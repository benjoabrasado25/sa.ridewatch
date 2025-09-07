// /src/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

// ⬇⬇⬇ use RELATIVE import ⬇⬇⬇
import { auth, db, googleProvider, ensureAuthPersistence } from "../lib/firebase";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function ensureUserDoc(u) {
    if (!u) {
      setProfile(null);
      return;
    }
    const ref = doc(db, "users", u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        await setDoc(ref, {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL || "",
        account_type: "school_admin", // ⬅ add this default
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        });
        setProfile((await getDoc(ref)).data());
    } else {
      setProfile(snap.data());
    }
  }

  useEffect(() => {
    // Set persistence once on mount (no top-level await needed)
    ensureAuthPersistence();

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await ensureUserDoc(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    login: (email, password) => signInWithEmailAndPassword(auth, email, password),
    register: async ({ email, password, displayName }) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(cred.user, { displayName });
      await ensureUserDoc(cred.user);
      return cred.user;
    },
    loginWithGoogle: async () => {
      const cred = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(cred.user);
      return cred.user;
    },
    logout: () => signOut(auth),
  }), [user, profile, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
