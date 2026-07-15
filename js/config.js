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
  apiKey: "AIzaSyB5X6Iu9fCMtY9US6LiOE-SKwmD49ae6No",
  authDomain: "exsimplify-9ec79.firebaseapp.com",
  projectId: "exsimplify-9ec79",
  storageBucket: "exsimplify-9ec79.firebasestorage.app",
  messagingSenderId: "817331530751",
  appId: "1:817331530751:web:55ce205962fb8d11a115ca",
};

export const FIREBASE_READY = !firebaseConfig.apiKey.startsWith("PASTE_");
