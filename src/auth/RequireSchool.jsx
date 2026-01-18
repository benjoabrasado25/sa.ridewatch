// /src/auth/RequireSchool.jsx
import React, { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function RequireSchool({ children }) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasCompany, setHasCompany] = useState(false);
  const checkedCompanyId = useRef(null); // Track which company_id we've checked

  useEffect(() => {
    let isMounted = true;

    async function check() {
      if (loading) return; // wait for auth/profile

      // no profile yet -> no company
      if (!profile || !profile.company_id) {
        if (isMounted) { setHasCompany(false); setChecking(false); }
        return;
      }

      // If we already checked this company_id and it was valid, don't re-check
      if (checkedCompanyId.current === profile.company_id && hasCompany) {
        if (isMounted) setChecking(false);
        return;
      }

      try {
        const ref = doc(db, "companies", String(profile.company_id));
        const snap = await getDoc(ref);
        if (isMounted) {
          const exists = snap.exists();
          setHasCompany(exists);
          if (exists) {
            checkedCompanyId.current = profile.company_id;
          }
          setChecking(false);
        }
      } catch (err) {
        console.error("Error checking company:", err);
        // On error, if we have a company_id, assume it's valid to prevent redirect loop
        if (isMounted) {
          setHasCompany(!!profile.company_id);
          setChecking(false);
        }
      }
    }

    check();
    return () => { isMounted = false; };
  }, [profile, loading, hasCompany]);

  if (loading || checking) return null; // or a spinner

  if (!hasCompany) {
    // Force user to create a company first
    return <Navigate to="/create-company" state={{ from: location.pathname }} replace />;
  }

  return children;
}
