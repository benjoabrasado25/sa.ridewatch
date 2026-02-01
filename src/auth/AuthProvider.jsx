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

// Generate random token for email verification
function generateVerificationToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Send verification email via marketing API
async function sendVerificationEmail(email, displayName, token) {
  const apiUrl = process.env.REACT_APP_EMAIL_API_URL || 'https://www.ridewatch.org/api';

  try {
    const response = await fetch(`${apiUrl}/send-verification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        displayName,
        verificationToken: token,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send verification email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

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
      // Existing user - check email verification
      const profileData = snap.data();

      // Block unverified users (except drivers who verified via email invitation)
      if (profileData.emailVerified === false) {
        await auth.signOut();
        setProfile(null);
        throw new Error('Please verify your email address before signing in. Check your inbox for the verification link.');
      }

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

      // Create user doc and company, then update profile state
      const userRef = doc(db, "users", cred.user.uid);
      const companyName = displayName ? `${displayName}'s Bus Company` : "My Bus Company";

      // Create company
      const companyRef = await addDoc(collection(db, "companies"), {
        name: companyName,
        address: "",
        description: "School bus transportation services",
        contact_person: displayName || "",
        contact_phone: "",
        owner_uid: cred.user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      });

      // Generate email verification token
      const verificationToken = generateVerificationToken();
      const verificationExpiry = new Date();
      verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hour expiry

      // Create user doc with company_id and verification fields
      await setDoc(userRef, {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: displayName || "",
        photoURL: cred.user.photoURL || "",
        account_type: "bus_company",
        company_id: companyRef.id,
        emailVerified: false,
        verificationToken: verificationToken,
        verificationTokenExpiry: verificationExpiry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Send verification email
      await sendVerificationEmail(cred.user.email, displayName || cred.user.email, verificationToken);

      // Sign out immediately - user must verify email before accessing the app
      await signOut(auth);
      setProfile(null);

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
