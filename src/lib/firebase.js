// /src/lib/firebase.js (CRA-friendly)
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const config = {
  apiKey: process.env.REACT_APP_FB_API_KEY,
  authDomain: process.env.REACT_APP_FB_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FB_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FB_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FB_APP_ID,
};

// Optional: sanity check in dev
if (process.env.NODE_ENV !== "production") {
  const missing = Object.entries(config).filter(([, v]) => !v);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error("Firebase config missing envs:", missing.map(([k]) => k));
  }
}

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export async function ensureAuthPersistence() {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    console.warn("Auth persistence not set:", e?.message);
  }
}

export { app, auth, db, googleProvider };
