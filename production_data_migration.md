# Production Data Migration & Live Integration Plan

This guide outlines how to migrate the Kreator Kolkata application from local mock data to live databases (Firebase/Firestore) and live APIs, ensuring that all UI components, buttons, page transitions, and layouts remain in their exact current positions.

---

## The Migration Philosophy: Data Layer Injection

To transition to production without disrupting the layout or features, we use the **Data Layer Injection Pattern**. 
Instead of modifying the styling or positioning within our JSX, we simply swap out the source of our state variables (e.g. `GIGS` array, `chats` array) for live Firestore data structures of the same exact shape.

```
[ Current Mock Flow ]
Static Arrays (GIGS, CREATORS) ──> React Local States ──> Tailwind Render Components

[ Live Production Flow ]
Firebase / Firestore Streams ──> React Hook / Zustand ──> Tailwind Render Components (UNCHANGED)
```

---

## Step 1: Firebase Initialization & SDK Setup

Add the Firebase core and sub-services to the project (`npm i firebase`). Create a configuration file in `src/firebase.ts` to initialize the SDKs:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "kreator-kolkata.firebaseapp.com",
  projectId: "kreator-kolkata",
  storageBucket: "kreator-kolkata.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

---

## Step 2: Replacing Mock Constants with Firestore Data Streams

Currently, the application imports or defines static arrays: `GIGS`, `CREATORS`, `BRANDS`, `EVENTS`. We will replace these declarations with real-time reactive hooks.

### A. Live Gigs Feed Migration
**Before (Static Array):**
```typescript
const [savedGigs, setSavedGigs] = useState<Set<number>>(new Set([2, 5]))
// GIGS is a hardcoded constant
```

**After (Live Firestore Stream):**
We keep the `filteredGigs` logic intact, but update the underlying list dynamically:
```typescript
const [gigs, setGigs] = useState<Gig[]>([]);

useEffect(() => {
  // Query active, uncompleted gigs sorted by date
  const gigsQuery = query(
    collection(db, "gigs"), 
    where("status", "==", "Active"),
    orderBy("createdAt", "desc")
  );
  
  const unsubscribe = onSnapshot(gigsQuery, (snapshot) => {
    const liveGigs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as unknown as Gig[];
    setGigs(liveGigs);
  });
  
  return unsubscribe;
}, []);
```

### B. Creator & Brand Lists Migration
We do the exact same swap for `CREATORS` and `BRANDS` lists:
- Creators are loaded from the `/users` collection where `role === 'creator'`.
- Brands are loaded from the `/users` collection where `role === 'brand'`.

---

## Step 3: Swapping Authentication Logic

Currently, logging in toggles a simple boolean state: `setIsLoggedIn(true)`.

### A. Live Auth State Integration
We connect `isLoggedIn` directly to the official Firebase Authentication session listener:

```typescript
const [currentUser, setCurrentUser] = useState<any>(null);
const [isLoggedIn, setIsLoggedIn] = useState(false);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
    } else {
      setCurrentUser(null);
      setIsLoggedIn(false);
    }
  });
  return unsubscribe;
}, []);
```

### B. Auth Dialog Integration
- When a user submits credentials in the `AuthScreen` component, it calls `signInWithEmailAndPassword(auth, email, password)` or triggers Phone OTP validation.
- Success automatically triggers `onAuthStateChanged`, which sets `isLoggedIn(true)` and displays the application interface.

---

## Step 4: Upgrading the Messaging System to Real-Time Threads

Currently, chats use a local array `chats` loaded with `INITIAL_CHATS`. We will migrate this to a real-time messaging layout.

**Live Chat Sync Hook:**
```typescript
useEffect(() => {
  if (!currentUser) return;

  // Retrieve threads where the current user is a participant
  const threadsQuery = query(
    collection(db, "threads"),
    where("participants", "array-contains", currentUser.uid),
    orderBy("lastActive", "desc")
  );

  const unsubscribe = onSnapshot(threadsQuery, (snapshot) => {
    const liveThreads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as unknown as ChatThread[];
    setChats(liveThreads);
  });

  return unsubscribe;
}, [currentUser]);
```

- **Typing & Sending Messages**:
  - The typing handlers remain completely identical in style.
  - The "Send" button calls `addDoc(collection(db, "threads", activeThreadId, "messages"), newMsg)` instead of altering the local state array.

---

## Step 5: Secure Instagram API Follower Fetching

Our new **Instagram API Secure Link** modal is already built and fully functional. To connect it to real data:

1. **Trigger Redirect**:
   The "Authorize & Connect API" button will open a popup window redirecting the user to Facebook's OAuth authorization url:
   `https://www.facebook.com/v19.0/dialog/oauth?client_id=APP_ID&redirect_uri=REDIRECT_URI&scope=instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement`
2. **Handle Callback**:
   When Facebook redirects back with an authorization code, we pass it to a Firebase Cloud Function via a simple POST call:
   ```typescript
   const response = await fetch("https://us-central1-kreator-kolkata.cloudfunctions.net/exchangeInstaCode", {
     method: "POST",
     body: JSON.stringify({ code })
   });
   const data = await response.json();
   ```
3. **Save Followers**:
   The Cloud Function securely queries Meta, extracts the Instagram Business account username and followers count, updates the user's document in Firestore under `/users/{uid}`, and automatically refreshes the state.

---

## Step 6: Step-by-Step Production Roadmap

1. **Initialize Firebase Console**: Create a production project in the Firebase console and activate Authentication (Phone OTP & Email) and Firestore database.
2. **Implement Security Rules**: Write Firebase security rules to prevent unauthorized reads/writes to private chats, profiles, and gigs.
3. **Register Meta Developer App**: Register an app in the Meta Developers portal, configure Instagram Graph API permissions, and obtain a Client ID & Secret.
4. **Deploy Cloud Functions**: Deploy the token exchange function and scheduled crons to automatically refresh creator follower counts.
5. **Connect Hooks in App.tsx**: Swap local state assignments with the listeners defined above.
