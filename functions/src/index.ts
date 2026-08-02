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
  // CORS headers for cross-origin calls from Vercel
  res.set("Access-Control-Allow-Origin", APP_URL);
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const code = req.query.code as string | undefined;
  const uid = req.query.uid as string | undefined;

  if (!code || !uid) {
    res.status(400).json({
      error: "Missing required parameters: code, uid",
    });
    return;
  }

  try {
    // ── Step 1: Exchange authorization code for short-lived access token ──
    const tokenParams = new URLSearchParams();
    tokenParams.append("client_id", INSTAGRAM_APP_ID);
    tokenParams.append("client_secret", INSTAGRAM_APP_SECRET);
    tokenParams.append("grant_type", "authorization_code");
    tokenParams.append("redirect_uri", REDIRECT_URI);
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
          fields: "id,username,account_type,media_count,profile_picture_url,name",
          access_token: longLivedToken,
        },
      }
    );

    const profile = profileResponse.data;

    // ── Step 4: Save to Firestore ──
    const instagramData = {
      igUserId: igUserId,
      handle: `@${profile.username}`,
      username: profile.username,
      accountType: profile.account_type || "BUSINESS",
      mediaCount: profile.media_count || 0,
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
