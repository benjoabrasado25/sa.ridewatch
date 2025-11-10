import { Icon } from "@iconify/react";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

/** Small modal component (no external JS needed) */
function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div
      className="modal fade show"
      style={{ display: "block", background: "rgba(0,0,0,.4)" }}
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content radius-12">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

function createToken(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

const InviteDriverLayer = () => {
  const { user, profile, loading } = useAuth();
  const schoolId = profile?.school_id || null;

  const canInvite = useMemo(() => !!user && !!schoolId, [user, schoolId]);

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [busyInvite, setBusyInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  // Drivers list state
  const [drivers, setDrivers] = useState(null); // null = loading; [] = empty
  const [listError, setListError] = useState("");

  // Open/close modal
  const openInvite = () => {
    setInviteError("");
    setInviteLink("");
    setInviteEmail("");
    setShowInvite(true);
  };
  const closeInvite = () => {
    if (!busyInvite) setShowInvite(false);
  };

  // Load drivers for this school (live)
  useEffect(() => {
    if (!canInvite) return;
    setDrivers(null);
    setListError("");

    // users where school_id == current && account_type == driver
    const q = query(
      collection(db, "users"),
      where("school_id", "==", schoolId),
      where("account_type", "==", "driver")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDrivers(rows);
      },
      (err) => {
        setListError(err?.message || "Failed to load drivers.");
        setDrivers([]);
      }
    );

    return () => unsub();
  }, [canInvite, schoolId]);

  async function submitInvite(e) {
    e.preventDefault();
    setInviteError("");
    setInviteLink("");

    if (!canInvite) {
      setInviteError("You must belong to a school to send invites.");
      return;
    }

    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError("Please enter a valid email address.");
      return;
    }

    try {
      setBusyInvite(true);
      const token = createToken();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await setDoc(doc(db, "invites", token), {
        token,
        email,
        role: "driver",
        school_id: schoolId,
        status: "pending",
        invited_by: user.uid,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
      });

      const acceptUrl = `${window.location.origin}/accept-invite?token=${encodeURIComponent(
        token
      )}`;
      setInviteLink(acceptUrl);
    } catch (err) {
      setInviteError(err?.message || "Failed to create invite.");
    } finally {
      setBusyInvite(false);
    }
  }

  function copyInviteLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      window.alert("Invite link copied to clipboard.");
    });
  }

  async function toggleDriverStatus(driver) {
    // status: 'active' | 'inactive' (default to 'active' if missing)
    const current = (driver.status || "active").toLowerCase();
    const next = current === "active" ? "inactive" : "active";

    try {
      await updateDoc(doc(db, "users", driver.id), {
        status: next,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      window.alert(e?.message || "Failed to update driver status.");
    }
  }

  if (loading) return null;

  return (
    <section className="container py-5">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="mb-1">Drivers</h3>
          <p className="text-secondary mb-0">
            Invite new drivers and manage their status.
          </p>
        </div>

        <button
          className="btn btn-primary radius-12 d-flex align-items-center gap-2"
          onClick={openInvite}
          disabled={!canInvite}
          title={!canInvite ? "You must belong to a school." : "Invite Driver"}
        >
          <Icon icon="mingcute:add-line" />
          Invite Driver
        </button>
      </div>

      {!canInvite && (
        <div className="alert alert-warning mb-3">
          You don’t have an associated school yet. Please create a school first.
        </div>
      )}

      {/* Drivers list */}
      {listError && <div className="alert alert-danger">{listError}</div>}

      {drivers === null ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center text-secondary py-5">
          No drivers yet. Click “Invite Driver” to add one.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Name</th>
                <th>Email</th>
                <th>License #</th>
                <th>Plate #</th>
                <th>Status</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => {
                const status = (d.status || "active").toLowerCase();
                const badgeClass =
                  status === "active" ? "bg-success" : "bg-secondary";
                return (
                  <tr key={d.id}>
                    <td>
                      <div className="avatar avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center">
                        <Icon icon="mdi:steering" />
                      </div>
                    </td>
                    <td>{d.displayName || "—"}</td>
                    <td>{d.email || "—"}</td>
                    <td>{d.driver_license_no || "—"}</td>
                    <td>{d.plate_no || "—"}</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{status}</span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className={`btn btn-sm ${
                            status === "active"
                              ? "btn-outline-secondary"
                              : "btn-outline-success"
                          }`}
                          onClick={() => toggleDriverStatus(d)}
                          title={
                            status === "active"
                              ? "Deactivate driver"
                              : "Activate driver"
                          }
                        >
                          {status === "active" ? (
                            <>
                              <Icon icon="mdi:pause-circle" /> Deactivate
                            </>
                          ) : (
                            <>
                              <Icon icon="mdi:play-circle" /> Activate
                            </>
                          )}
                        </button>
                        {/* Optional: View / Edit buttons could go here */}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      <Modal open={showInvite} title="Invite Driver" onClose={closeInvite}>
        <form onSubmit={submitInvite}>
          <div className="mb-3">
            <label className="form-label">Driver Email</label>
            <div className="icon-field">
              <span className="icon top-50 translate-middle-y">
                <Icon icon="mage:email" />
              </span>
              <input
                type="email"
                className="form-control h-56-px bg-neutral-50 radius-12"
                placeholder="driver@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                disabled={!canInvite || busyInvite}
              />
            </div>
          </div>

          {inviteError && <div className="text-danger mb-3">{inviteError}</div>}

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={closeInvite}
              disabled={busyInvite}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!canInvite || busyInvite}
            >
              {busyInvite ? "Sending…" : "Send Invitation"}
            </button>
          </div>
        </form>

        {inviteLink ? (
          <div className="mt-4">
            <label className="form-label">Invitation Link</label>
            <div className="d-flex gap-2">
              <input
                readOnly
                className="form-control bg-neutral-50 radius-12"
                value={inviteLink}
              />
              <button
                className="btn btn-outline-secondary"
                onClick={copyInviteLink}
                type="button"
              >
                Copy
              </button>
            </div>
            <small className="text-secondary">Link expires in 7 days.</small>
          </div>
        ) : null}
      </Modal>
    </section>
  );
};

export default InviteDriverLayer;
