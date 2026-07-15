/* ============================================================
   ExSimplify — Firebase configuration
   ------------------------------------------------------------
   This is the ONLY file you need to edit to enable sync.

   1. Firebase Console → Project settings → Your apps → Web app
   2. Copy the config object and paste it below.
   3. Commit and push — this config is PUBLIC BY DESIGN and safe
      to commit. Security lives in Firestore rules, not here.

   Until you do this, the app runs in local mode (data stays
   on the device in localStorage).
   ============================================================ */

export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID",
};

export const FIREBASE_READY = !firebaseConfig.apiKey.startsWith("PASTE_");
