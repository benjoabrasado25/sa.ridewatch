// /src/pages/InviteSuccessPage.jsx
import React from "react";
import { Icon } from "@iconify/react";

export default function InviteSuccessPage() {
  return (
    <section
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="container py-5">
        <div
          className="mx-auto text-center p-5 bg-white shadow-lg"
          style={{
            maxWidth: "500px",
            borderRadius: "24px",
          }}
        >
          {/* Success Icon with Animation */}
          <div
            className="mx-auto mb-4 d-flex align-items-center justify-content-center"
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              boxShadow: "0 10px 40px rgba(34, 197, 94, 0.3)",
            }}
          >
            <Icon icon="mdi:check" style={{ fontSize: "50px", color: "#fff" }} />
          </div>

          {/* Title */}
          <h2
            className="fw-bold mb-3"
            style={{ color: "#1f2937", fontSize: "28px" }}
          >
            Welcome to RideWatch!
          </h2>

          {/* Subtitle */}
          <p className="text-secondary mb-4" style={{ fontSize: "16px", lineHeight: "1.6" }}>
            Your driver account has been created successfully. Download the app to start your journey.
          </p>

          {/* Download Buttons */}
          <div className="d-flex flex-column gap-2">
            <a
              href="https://play.google.com/store/apps/details?id=com.riderwatch.trackerDriver&hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg w-100 d-flex align-items-center justify-content-center gap-3"
              style={{
                background: "#000",
                color: "#fff",
                borderRadius: "14px",
                padding: "14px 24px",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              <Icon icon="mdi:google-play" style={{ fontSize: "28px" }} />
              <div className="text-start">
                <div style={{ fontSize: "11px", opacity: 0.8, fontWeight: "400" }}>GET IT ON</div>
                <div style={{ fontSize: "18px", marginTop: "-2px" }}>Google Play</div>
              </div>
            </a>

            <a
              href="https://apps.apple.com/us/app/my-ridewatch-driver/id6755679971"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg w-100 d-flex align-items-center justify-content-center gap-3"
              style={{
                background: "#000",
                color: "#fff",
                borderRadius: "14px",
                padding: "14px 24px",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              <Icon icon="mdi:apple" style={{ fontSize: "28px" }} />
              <div className="text-start">
                <div style={{ fontSize: "11px", opacity: 0.8, fontWeight: "400" }}>Download on the</div>
                <div style={{ fontSize: "18px", marginTop: "-2px" }}>App Store</div>
              </div>
            </a>
          </div>

          {/* Divider */}
          <div className="d-flex align-items-center my-4">
            <div className="flex-grow-1" style={{ height: "1px", background: "#e5e7eb" }}></div>
            <span className="px-3 text-secondary" style={{ fontSize: "13px" }}>Next Steps</span>
            <div className="flex-grow-1" style={{ height: "1px", background: "#e5e7eb" }}></div>
          </div>

          {/* Steps */}
          <div className="text-start">
            <div className="d-flex align-items-start gap-3 mb-3">
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#f3f4f6",
                  color: "#6b7280",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                1
              </div>
              <div>
                <div className="fw-semibold" style={{ color: "#374151" }}>Download the app</div>
                <div className="text-secondary" style={{ fontSize: "14px" }}>Install RideWatch Driver from Google Play</div>
              </div>
            </div>

            <div className="d-flex align-items-start gap-3 mb-3">
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#f3f4f6",
                  color: "#6b7280",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                2
              </div>
              <div>
                <div className="fw-semibold" style={{ color: "#374151" }}>Sign in</div>
                <div className="text-secondary" style={{ fontSize: "14px" }}>Use the email and password you just created</div>
              </div>
            </div>

            <div className="d-flex align-items-start gap-3">
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#f3f4f6",
                  color: "#6b7280",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                3
              </div>
              <div>
                <div className="fw-semibold" style={{ color: "#374151" }}>Start driving</div>
                <div className="text-secondary" style={{ fontSize: "14px" }}>Begin tracking your routes for parents</div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div
            className="mt-4 pt-4"
            style={{ borderTop: "1px solid #e5e7eb" }}
          >
            <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
              <Icon icon="mdi:information-outline" className="me-1" />
              This portal is for school administrators only
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
