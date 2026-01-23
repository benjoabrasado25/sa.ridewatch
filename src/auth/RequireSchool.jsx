// /src/auth/RequireSchool.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireSchool({ children }) {
  const { profile, loading } = useAuth();
  const location = useLocation();

  // Wait for auth to finish loading - company is auto-created during auth
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If profile has company_id, allow access (company was auto-created)
  if (profile?.company_id) {
    return children;
  }

  // No company_id - redirect to create company (fallback, shouldn't happen normally)
  return <Navigate to="/create-company" state={{ from: location.pathname }} replace />;
}
