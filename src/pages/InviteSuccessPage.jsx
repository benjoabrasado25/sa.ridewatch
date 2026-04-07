// /src/pages/InviteSuccessPage.jsx
import React from "react";
import { Icon } from "@iconify/react";

export default function InviteSuccessPage() {
  return (
    <section className="container py-5">
      <div className="max-w-600 mx-auto text-center">
        <div className="mb-4">
          <Icon icon="mdi:check-circle" style={{ fontSize: '80px', color: '#22c55e' }} />
        </div>
        <h3 className="mb-2">Account Created Successfully!</h3>
        <p className="text-secondary mb-4">
          Your driver account has been created. Download the app and sign in with the email and password you just created.
        </p>

        <a
          href="https://play.google.com/store/apps/details?id=com.riderwatch.trackerUser&hl=en"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-dark btn-lg radius-12 px-4 py-3 d-inline-flex align-items-center gap-2"
        >
          <Icon icon="mdi:google-play" style={{ fontSize: '24px' }} />
          Download on Google Play
        </a>

        <p className="text-muted small mt-4">
          Note: This admin portal is for school administrators only. Drivers must use the mobile app.
        </p>
      </div>
    </section>
  );
}
