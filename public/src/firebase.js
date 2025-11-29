// src/firebase.js
// Firebase v9 (modular) initialization and exports
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";

// ----- YOUR FIREBASE CONFIG -----
// (You provided this config earlier — keep it here or move to env vars.)
const firebaseConfig = {
  apiKey: "AIzaSyCzIgVmXRHj-WsWM8fzs0h02TXPlCFDkHI",
  authDomain: "hyperlocal-marketplace-fe7d6.firebaseapp.com",
  projectId: "hyperlocal-marketplace-fe7d6",
  storageBucket: "hyperlocal-marketplace-fe7d6.appspot.com",  // FIXED
  messagingSenderId: "384709587442",
  appId: "1:384709587442:web:186fe2ebf2d24f68da3b6b",
  measurementId: "G-JL1H6EEQ03"
};

// Initialize app
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics is optional and may not be available in all environments (SSR).
export let analytics = null;
(async () => {
  try {
    if (await analyticsSupported()) {
      analytics = getAnalytics(app);
    }
  } catch (e) {
    // analytics not supported in this environment (ok to ignore)
    analytics = null;
  }
})();

/**
 * Helper: get current user UID (returns null if not signed-in)
 * Usage:
 *   import { getCurrentUid } from "./firebase";
 *   const uid = getCurrentUid();
 */
export function getCurrentUid() {
  const user = auth.currentUser;
  return user ? user.uid : null;
}

