// /src/auth/RequireSuperAdmin.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

/**
 * Protects routes that require super_admin role.
 * Redirects to dashboard if user is not a super admin.
 */
export default function RequireSuperAdmin({ children }) {
  const { profile, loading } = useAuth();

  // Still loading
  if (loading) {
    return null;
  }

  // Check for super_admin role
  const isSuperAdmin = profile?.role === 'super_admin';

  if (!isSuperAdmin) {
    // Not a super admin - redirect to dashboard (not an error page to avoid revealing the route exists)
    return <Navigate to="/" replace />;
  }

  return children;
}
