import React from "react";
import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "./Toast";

const SchoolQRCodeLayer = () => {
  const { schoolId } = useParams();
  const toast = useToast();

  if (!schoolId) {
    return (
      <section className="container py-5">
        <div className="max-w-600 mx-auto text-center">
          <h3 className="mb-3">School QR Code</h3>
          <div className="alert alert-warning">No school ID provided.</div>
        </div>
      </section>
    );
  }

  const link = `${window.location.origin}/school/${schoolId}`;

  function copyId() {
    navigator.clipboard.writeText(schoolId).then(() => {
      toast.success("School ID copied to clipboard.");
    });
  }

  return (
    <section className="container py-5">
      <div className="max-w-600 mx-auto text-center">
        <h3 className="mb-3">School QR Code</h3>

        <div className="d-flex justify-content-center mb-4">
          <QRCodeCanvas value={link} size={200} includeMargin={true} />
        </div>

        <p className="mb-2">
          <strong>School ID:</strong>
        </p>
        <div className="d-flex justify-content-center gap-2 mb-3">
          <input
            readOnly
            value={schoolId}
            className="form-control text-center bg-neutral-50 radius-12"
            style={{ maxWidth: 280 }}
          />
          <button
            className="btn btn-outline-secondary"
            onClick={copyId}
            type="button"
          >
            Copy
          </button>
        </div>

        <small className="text-secondary">
          Scan the QR code or copy the school ID to join this school.
        </small>
      </div>
    </section>
  );
};

export default SchoolQRCodeLayer;
