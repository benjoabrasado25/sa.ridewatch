// /src/auth/RequireSchool.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { db } from "../lib/firebase";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function RequireSchool({ children }) {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [creatingCompany, setCreatingCompany] = useState(false);

  // Auto-create company if user exists but has no company_id
  useEffect(() => {
    async function autoCreateCompany() {
      if (loading || !user || !profile || profile.company_id || creatingCompany) return;

      // User exists but has no company - create one automatically
      setCreatingCompany(true);
      try {
        const companyName = user.displayName ? `${user.displayName}'s Bus Company` : "My Bus Company";

        // Create company
        const companyRef = await addDoc(collection(db, "companies"), {
          name: companyName,
          address: "",
          description: "School bus transportation services",
          contact_person: user.displayName || "",
          contact_phone: "",
          owner_uid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: "active",
        });

        // Update user doc with company_id
        await setDoc(
          doc(db, "users", user.uid),
          { company_id: companyRef.id, updatedAt: serverTimestamp() },
          { merge: true }
        );

        // Refresh profile to get the new company_id
        await refreshProfile();
      } catch (err) {
        console.error("Failed to auto-create company:", err);
      } finally {
        setCreatingCompany(false);
      }
    }

    autoCreateCompany();
  }, [loading, user, profile, creatingCompany, refreshProfile]);

  // Show loading while auth is loading or company is being created
  if (loading || creatingCompany || (profile && !profile.company_id)) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If profile has company_id, allow access
  if (profile?.company_id) {
    return children;
  }

  // This shouldn't happen, but show loading just in case
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Setting up your account...</span>
      </div>
    </div>
  );
}
