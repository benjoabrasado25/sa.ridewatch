// /src/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

// ⬇⬇⬇ use RELATIVE import ⬇⬇⬇
import { auth, db, ensureAuthPersistence } from "../lib/firebase";

import { doc, getDoc, serverTimestamp, setDoc, collection, addDoc } from "firebase/firestore";

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
      // New user - create user doc and auto-create company
      const companyName = u.displayName ? `${u.displayName}'s Bus Company` : "My Bus Company";

      // 1) Create company
      const companyRef = await addDoc(collection(db, "companies"), {
        name: companyName,
        address: "",
        description: "School bus transportation services",
        contact_person: u.displayName || "",
        contact_phone: "",
        owner_uid: u.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      });

      // 2) Create user doc with company_id
      await setDoc(ref, {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL || "",
        account_type: "bus_company",
        company_id: companyRef.id, // Auto-assign company
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setProfile((await getDoc(ref)).data());
    } else {
      // Existing user - check if they need a company
      const profileData = snap.data();
      if (!profileData.company_id) {
        // User exists but has no company - create one
        const companyName = u.displayName ? `${u.displayName}'s Bus Company` : "My Bus Company";

        const companyRef = await addDoc(collection(db, "companies"), {
          name: companyName,
          address: "",
          description: "School bus transportation services",
          contact_person: u.displayName || "",
          contact_phone: "",
          owner_uid: u.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: "active",
        });

        await setDoc(ref, { company_id: companyRef.id, updatedAt: serverTimestamp() }, { merge: true });
        setProfile((await getDoc(ref)).data());
      } else {
        setProfile(profileData);
      }
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

  // Function to refresh profile manually
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setProfile(snap.data());
    }
  }, [user]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    refreshProfile,
    login: (email, password) => signInWithEmailAndPassword(auth, email, password),
    register: async ({ email, password, displayName }) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(cred.user, { displayName });
      await ensureUserDoc(cred.user);
      return cred.user;
    },
    logout: () => signOut(auth),
  }), [user, profile, loading, refreshProfile]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
