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
  const [hasSchool, setHasSchool] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function check() {
      if (loading) return; // wait for auth/profile
      // no profile yet -> no school
      if (!profile || !profile.school_id) {
        if (isMounted) { setHasSchool(false); setChecking(false); }
        return;
      }
      try {
        const ref = doc(db, "schools", String(profile.school_id));
        const snap = await getDoc(ref);
        if (isMounted) {
          setHasSchool(snap.exists());
          setChecking(false);
        }
      } catch {
        if (isMounted) { setHasSchool(false); setChecking(false); }
      }
    }

    check();
    return () => { isMounted = false; };
  }, [profile, loading]);

  if (loading || checking) return null; // or a spinner

  if (!hasSchool) {
    // Force user to create a school first
    return <Navigate to="/create-school" state={{ from: location.pathname }} replace />;
  }

  return children;
}
