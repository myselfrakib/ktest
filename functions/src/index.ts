import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();
const db = admin.firestore();

// ─── Configuration ──────────────────────────────────────────────────────────
// These are set via: firebase functions:config:set instagram.client_id="..." etc.
// For local dev, use .runtimeconfig.json

const INSTAGRAM_APP_ID = "1361228946204623";
const INSTAGRAM_APP_SECRET = "a8cd8976f9493e19360c2db1b20e28f1";
const APP_URL = "https://ktest-nine.vercel.app";
// The redirect URI registered in Meta App Dashboard must match EXACTLY:
const REDIRECT_URI = `${APP_URL}/auth/instagram/callback`;

// ─── Instagram OAuth Callback ───────────────────────────────────────────────
// This function is called when Instagram redirects the user back after authorization.
// Flow:
//   1. User clicks "Connect Instagram" → redirected to Instagram OAuth
//   2. Instagram redirects to: https://ktest-nine.vercel.app/auth/instagram/callback?code=XXX&state=UID
//   3. The Vercel SPA detects ?code= and calls THIS Cloud Function with code + uid
//   4. This function exchanges code → short-lived token → long-lived token
//   5. Fetches user profile from Graph API
//   6. Saves to Firestore users/{uid}.instagram
//   7. Returns success JSON to the frontend

export const instagramCallback = functions.https.onRequest(async (req, res) => {
  // CORS headers allowing requests from any of the Vercel app domains
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const code = req.query.code as string | undefined;
  const uid = req.query.uid as string | undefined;
  const clientRedirectUri = req.query.redirect_uri as string | undefined;

  if (!code || !uid) {
    res.status(400).json({
      error: "Missing required parameters: code, uid",
    });
    return;
  }

  // Use the redirect URI supplied by the client, or fallback to default
  const targetRedirectUri = clientRedirectUri || REDIRECT_URI;

  try {
    // ── Step 1: Exchange authorization code for short-lived access token ──
    const tokenParams = new URLSearchParams();
    tokenParams.append("client_id", INSTAGRAM_APP_ID);
    tokenParams.append("client_secret", INSTAGRAM_APP_SECRET);
    tokenParams.append("grant_type", "authorization_code");
    tokenParams.append("redirect_uri", targetRedirectUri);
    tokenParams.append("code", code);

    const tokenResponse = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      tokenParams.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const shortLivedToken: string = tokenResponse.data.access_token;
    const igUserId: string = String(tokenResponse.data.user_id);

    // ── Step 2: Exchange short-lived token for long-lived token (60 days) ──
    const longLivedResponse = await axios.get(
      "https://graph.instagram.com/access_token",
      {
        params: {
          grant_type: "ig_exchange_token",
          client_secret: INSTAGRAM_APP_SECRET,
          access_token: shortLivedToken,
        },
      }
    );

    const longLivedToken: string = longLivedResponse.data.access_token;
    const expiresIn: number = longLivedResponse.data.expires_in; // seconds (~60 days)

    // ── Step 3: Fetch Instagram user profile ──
    const profileResponse = await axios.get(
      `https://graph.instagram.com/v21.0/me`,
      {
        params: {
          fields: "id,username,account_type,media_count,followers_count,profile_picture_url,name",
          access_token: longLivedToken,
        },
      }
    );

    const profile = profileResponse.data;

    // ── Step 4: Save to Firestore ──
    // Format followers count for display (e.g. 12400 → "12.4K")
    const rawFollowers: number = profile.followers_count || 0;
    const followersFormatted = rawFollowers >= 1000
      ? `${(rawFollowers / 1000).toFixed(1).replace(/\.0$/, '')}K`
      : String(rawFollowers);

    const instagramData = {
      igUserId: igUserId,
      handle: `@${profile.username}`,
      username: profile.username,
      accountType: profile.account_type || "BUSINESS",
      mediaCount: profile.media_count || 0,
      followersCount: rawFollowers,
      followersFormatted: followersFormatted,
      profilePicture: profile.profile_picture_url || null,
      displayName: profile.name || profile.username,
      accessToken: longLivedToken,
      tokenExpiresAt: new Date(
        Date.now() + expiresIn * 1000
      ).toISOString(),
      connectedAt: new Date().toISOString(),
    };

    // Update the user document in whichever collection they belong to
    // Try 'creators' first, then 'brands'
    const creatorsRef = db.collection("creators").doc(uid);
    const brandsRef = db.collection("brands").doc(uid);
    const usersRef = db.collection("users").doc(uid);

    const [creatorsSnap, brandsSnap] = await Promise.all([
      creatorsRef.get(),
      brandsRef.get(),
    ]);

    const updates: Promise<FirebaseFirestore.WriteResult>[] = [];

    if (creatorsSnap.exists) {
      updates.push(
        creatorsRef.update({
          instagram: instagramData,
          isInstagramConnected: true,
          followers: profile.media_count
            ? `${Math.max(profile.media_count, 0)}`
            : "0",
        })
      );
    }

    if (brandsSnap.exists) {
      updates.push(
        brandsRef.update({
          instagram: instagramData,
          isInstagramConnected: true,
        })
      );
    }

    // Always update the users collection too
    updates.push(
      usersRef.set(
        { instagram: instagramData, isInstagramConnected: true },
        { merge: true }
      )
    );

    await Promise.all(updates);

    // ── Step 5: Return success ──
    res.status(200).json({
      success: true,
      handle: instagramData.handle,
      username: profile.username,
      mediaCount: profile.media_count || 0,
      followersCount: rawFollowers,
      followersFormatted: followersFormatted,
      accountType: profile.account_type || "BUSINESS",
      displayName: profile.name || profile.username,
    });
  } catch (error: any) {
    console.error(
      "Instagram OAuth error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Instagram authentication failed",
      details: error.response?.data?.error_message || error.message,
    });
  }
});

// ─── Meta signed_request parsing & signature verification ───────────────────
function parseSignedRequest(signedRequest: string, secret: string) {
  const parts = signedRequest.split(".", 2);
  if (parts.length !== 2) {
    throw new Error("Invalid signed request format");
  }
  const [encodedSig, payload] = parts;

  // Decode the signature
  const sig = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  
  // Decode the payload
  const data = JSON.parse(
    Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
  );

  if (data.algorithm.toUpperCase() !== "HMAC-SHA256") {
    throw new Error("Unknown algorithm. Expected HMAC-SHA256");
  }

  // Validate signature using SHA-256 HMAC
  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest();
  if (!crypto.timingSafeEqual(sig, expectedSig)) {
    throw new Error("Invalid signature verification");
  }

  return data;
}

// ─── Deauthorize Callback ───────────────────────────────────────────────────
import * as crypto from "crypto";

export const instagramDeauthorize = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const signedRequest = req.body.signed_request;
  if (!signedRequest) {
    res.status(400).send("Missing signed_request parameter");
    return;
  }

  try {
    const data = parseSignedRequest(signedRequest, INSTAGRAM_APP_SECRET);
    const igUserId = String(data.user_id);

    // Find the user document that matches this igUserId and set isInstagramConnected = false
    const creatorsSnap = await db.collection("creators").where("instagram.igUserId", "==", igUserId).get();
    const brandsSnap = await db.collection("brands").where("instagram.igUserId", "==", igUserId).get();
    const usersSnap = await db.collection("users").where("instagram.igUserId", "==", igUserId).get();

    const batch = db.batch();

    creatorsSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        isInstagramConnected: false,
        "instagram.deauthorizedAt": new Date().toISOString(),
      });
    });

    brandsSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        isInstagramConnected: false,
        "instagram.deauthorizedAt": new Date().toISOString(),
      });
    });

    usersSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        isInstagramConnected: false,
        "instagram.deauthorizedAt": new Date().toISOString(),
      });
    });

    await batch.commit();
    res.status(200).send("Deauthorization processed successfully");
  } catch (error: any) {
    console.error("Deauthorization callback error:", error.message);
    res.status(400).send(`Invalid request: ${error.message}`);
  }
});

// ─── Data Deletion Request Callback ─────────────────────────────────────────
export const instagramDeleteData = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const signedRequest = req.body.signed_request;
  if (!signedRequest) {
    res.status(400).send("Missing signed_request parameter");
    return;
  }

  try {
    const data = parseSignedRequest(signedRequest, INSTAGRAM_APP_SECRET);
    const igUserId = String(data.user_id);

    // Delete/unlink instagram credentials from matched user profiles
    const creatorsSnap = await db.collection("creators").where("instagram.igUserId", "==", igUserId).get();
    const brandsSnap = await db.collection("brands").where("instagram.igUserId", "==", igUserId).get();
    const usersSnap = await db.collection("users").where("instagram.igUserId", "==", igUserId).get();

    const batch = db.batch();

    creatorsSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        isInstagramConnected: false,
        instagram: admin.firestore.FieldValue.delete(),
        followers: "0",
      });
    });

    brandsSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        isInstagramConnected: false,
        instagram: admin.firestore.FieldValue.delete(),
      });
    });

    usersSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        isInstagramConnected: false,
        instagram: admin.firestore.FieldValue.delete(),
      });
    });

    await batch.commit();

    const confirmationCode = `del_${igUserId}_${Date.now()}`;
    const statusUrl = `${APP_URL}/data-deletion-status?id=${confirmationCode}`;

    res.status(200).json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error: any) {
    console.error("Data deletion callback error:", error.message);
    res.status(400).send(`Invalid request: ${error.message}`);
  }
});
