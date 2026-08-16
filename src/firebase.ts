import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"


const firebaseConfig = {
  apiKey: "AIzaSyCLIkZiiLCtgux7faHH4e2_z8LAG4omEiY",
  authDomain: "kreatorkolkata.firebaseapp.com",
  databaseURL: "https://kreatorkolkata-default-rtdb.firebaseio.com",
  projectId: "kreatorkolkata",
  storageBucket: "kreatorkolkata.firebasestorage.app",
  messagingSenderId: "882651352678",
  appId: "1:882651352678:web:5ec49cb746ba88ff2fa7a7",
  measurementId: "G-46DJKQ74CE",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export let messaging: any = null
try {
  if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
    const { getMessaging } = require("firebase/messaging")
    messaging = getMessaging(app)
  }
} catch (e) {
  console.warn("Firebase Messaging not available:", e)
}

export default app
