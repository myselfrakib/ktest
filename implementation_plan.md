# Implementation Plan - Firebase Integration

This plan details the step-by-step implementation to transition the Kreator Kolkata application from local mock data/actions to a live Firebase backend (Authentication, Firestore Database, and Storage) without changing any UI layouts, buttons, or page transitions.

---

## 1. Project Dependencies

We will verify and install the required Firebase web SDK packages.
- Command: `npm install firebase` (Done)

---

## 2. Firebase SDK Integration

Create a new file `src/firebase.ts` to initialize Firebase and export references to Auth, Firestore, and Storage.

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCLIkZiiLCtgux7faHH4e2_z8LAG4omEiY",
  authDomain: "kreatorkolkata.firebaseapp.com",
  databaseURL: "https://kreatorkolkata-default-rtdb.firebaseio.com",
  projectId: "kreatorkolkata",
  storageBucket: "kreatorkolkata.firebasestorage.app",
  messagingSenderId: "882651352678",
  appId: "1:882651352678:web:5ec49cb746ba88ff2fa7a7",
  measurementId: "G-46DJKQ74CE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

---

## 3. Application State & Live Listeners

### A. State Upgrades
We will elevate local mock state lists to live state variables inside the `App` component in `src/App.tsx`:
- `const [gigs, setGigs] = useState<Gig[]>(GIGS)` (Pre-filled with fallback mock data, then synced from Firestore)
- `const [creators, setCreators] = useState<Creator[]>(CREATORS)`
- `const [brands, setBrands] = useState<Brand[]>(BRANDS)`
- `const [events, setEvents] = useState<Event[]>(EVENTS)`

### B. Session State Sync
Connect the `isLoggedIn` state to Firebase's official `onAuthStateChanged` auth listener.
```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setIsLoggedIn(!!user);
  });
  return unsubscribe;
}, []);
```

### C. Live Firestore Syncer
Query Firestore collections `/gigs`, `/creators`, `/brands`, and `/events`. If any collections are empty on first run, we will run a light seed script to populate them with the rich mock datasets.

---

## 4. UI Alignment & Layout Stability
All layouts, buttons, and state logic will remain 100% exactly as they are. We will simply swap out constant array accesses for their reactive state array equivalents.

---

## 5. Verification Plan

### Automated Checks
- Run `npx tsc --noEmit` to verify type safety and TypeScript compilation.
- Run `npm run build` to verify the build package.

### Manual Verification
- Check login/signup screen authentication flow.
- Add/update items inside the Firestore console and verify they sync in real-time on the app pages.
