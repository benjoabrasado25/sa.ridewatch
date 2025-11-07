// /src/auth/RequireSchool.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function RequireSchool({ children }) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasCompany, setHasCompany] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function check() {
      if (loading) return; // wait for auth/profile
      // no profile yet -> no company
      if (!profile || !profile.company_id) {
        if (isMounted) { setHasCompany(false); setChecking(false); }
        return;
      }
      try {
        const ref = doc(db, "companies", String(profile.company_id));
        const snap = await getDoc(ref);
        if (isMounted) {
          setHasCompany(snap.exists());
          setChecking(false);
        }
      } catch {
        if (isMounted) { setHasCompany(false); setChecking(false); }
      }
    }

    check();
    return () => { isMounted = false; };
  }, [profile, loading]);

  if (loading || checking) return null; // or a spinner

  if (!hasCompany) {
    // Force user to create a company first
    return <Navigate to="/create-company" state={{ from: location.pathname }} replace />;
  }

  return children;
}
