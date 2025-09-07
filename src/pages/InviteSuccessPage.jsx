// /src/pages/InviteSuccessPage.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function InviteSuccessPage() {
  return (
    <section className="container py-5">
      <div className="max-w-600 mx-auto text-center">
        <h3 className="mb-2">Account Created</h3>
        <p className="text-secondary mb-4">
          Your driver account has been created successfully. You can now sign in.
        </p>
        <Link to="/sign-in" className="btn btn-primary radius-12 px-4 py-2">
          Go to Sign In
        </Link>
      </div>
    </section>
  );
}
