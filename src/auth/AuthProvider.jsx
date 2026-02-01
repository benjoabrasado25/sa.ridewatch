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
      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationExpiry = new Date();
      verificationExpiry.setMinutes(verificationExpiry.getMinutes() + 15); // 15 minute expiry

      // Store registration data and verification code in Firestore
      const verificationRef = doc(collection(db, "verification_codes"));
      await setDoc(verificationRef, {
        email: email.toLowerCase().trim(),
        password: password, // Temporarily store password
        displayName: displayName || "",
        verificationCode: verificationCode,
        expiresAt: verificationExpiry,
        verified: false,
        createdAt: serverTimestamp(),
      });

      // Send verification email with code
      await sendVerificationEmail(email, displayName || email, verificationCode);

      return { verificationId: verificationRef.id, email };
    },
    completeRegistration: async (verificationId, code) => {
      // Get verification doc
      const verificationRef = doc(db, "verification_codes", verificationId);
      const verificationSnap = await getDoc(verificationRef);

      if (!verificationSnap.exists()) {
        throw new Error('Invalid verification code');
      }

      const data = verificationSnap.data();

      // Check if code matches
      if (data.verificationCode !== code) {
        throw new Error('Invalid verification code');
      }

      // Check if expired
      if (data.expiresAt.toDate() < new Date()) {
        throw new Error('Verification code expired');
      }

      // Check if already verified
      if (data.verified) {
        throw new Error('Verification code already used');
      }

      // Create Firebase account NOW
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (data.displayName) await updateProfile(cred.user, { displayName: data.displayName });

      const userRef = doc(db, "users", cred.user.uid);
      const companyName = data.displayName ? `${data.displayName}'s Bus Company` : "My Bus Company";

      // Create company
      const companyRef = await addDoc(collection(db, "companies"), {
        name: companyName,
        address: "",
        description: "School bus transportation services",
        contact_person: data.displayName || "",
        contact_phone: "",
        owner_uid: cred.user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      });

      // Create user doc
      await setDoc(userRef, {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: data.displayName || "",
        photoURL: cred.user.photoURL || "",
        account_type: "bus_company",
        company_id: companyRef.id,
        emailVerified: true, // Already verified via code
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Mark verification as used
      await setDoc(verificationRef, { verified: true }, { merge: true });

      // Delete password from verification doc for security
      await setDoc(verificationRef, { password: null }, { merge: true });

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
