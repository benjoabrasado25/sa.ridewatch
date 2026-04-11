import { Icon } from "@iconify/react";
import React, { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "../lib/firebase";
import { useToast } from "./Toast";
import SchoolSelector from "./SchoolSelector";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

/** Small modal component */
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
  const toast = useToast();
  const schoolId = profile?.current_school_id || null;

  const canInvite = useMemo(() => !!user && !!schoolId, [user, schoolId]);

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [busyInvite, setBusyInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  // Assign existing driver modal
  const [showAssign, setShowAssign] = useState(false);
  const [allDrivers, setAllDrivers] = useState([]);
  const [assignError, setAssignError] = useState("");
  const [assignUnsub, setAssignUnsub] = useState(null);

  // Open/close invite modal
  const openInvite = () => {
    setInviteError("");
    setInviteLink("");
    setInviteEmail("");
    setShowInvite(true);
  };
  const closeInvite = () => {
    if (!busyInvite) setShowInvite(false);
  };

  // Open/close assign modal
  const openAssign = async () => {
    setShowAssign(true);
    setAssignError("");
    setAllDrivers([]);

    try {
      if (!profile?.company_id) {
        setAssignError("No company associated with your account.");
        return;
      }

      const schoolsQuery = query(
        collection(db, "schools"),
        where("company_id", "==", profile.company_id)
      );
      const schoolsSnap = await getDocs(schoolsQuery);
      const companySchoolIds = schoolsSnap.docs.map(d => d.id);

      if (companySchoolIds.length === 0) {
        setAssignError("No schools found for your company.");
        return;
      }

      const q = query(
        collection(db, "users"),
        where("account_type", "==", "driver")
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const allDrvs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const filteredDrivers = allDrvs.filter(driver => {
          const driverSchools = driver.school_ids || [];
          return driverSchools.some(sid => companySchoolIds.includes(sid));
        });
        setAllDrivers(filteredDrivers);
      });
      setAssignUnsub(() => unsub);
    } catch (err) {
      setAssignError(err?.message || "Failed to load drivers");
    }
  };

  const closeAssign = () => {
    if (assignUnsub) {
      assignUnsub();
      setAssignUnsub(null);
    }
    setShowAssign(false);
  };

  async function assignDriverToSchool(driverId) {
    try {
      const driverDoc = doc(db, "users", driverId);
      const driverSnap = await getDoc(driverDoc);
      if (!driverSnap.exists()) {
        toast.error("Driver not found");
        return;
      }

      const driverData = driverSnap.data();
      const currentSchools = driverData.school_ids || [];

      if (currentSchools.includes(schoolId)) {
        toast.warning("Driver already assigned to this school");
        return;
      }

      const updatedSchools = [...currentSchools, schoolId];
      await updateDoc(driverDoc, {
        school_ids: updatedSchools,
        updatedAt: serverTimestamp(),
      });

      toast.success("Driver assigned to this school successfully!");
      closeAssign();
    } catch (err) {
      toast.error(err?.message || "Failed to assign driver");
    }
  }

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

      const existingQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const existingSnap = await getDocs(existingQuery);

      if (!existingSnap.empty) {
        const existingUserDoc = existingSnap.docs[0];
        const existingUser = existingUserDoc.data();
        const accountType = existingUser.account_type || "user";

        if (accountType === "driver") {
          // Auto-assign the driver to this school
          const driverSchools = existingUser.school_ids || [];
          if (driverSchools.includes(schoolId)) {
            setInviteError("This driver is already assigned to this school.");
            setBusyInvite(false);
            return;
          }

          // Add school to driver's school_ids
          const updatedSchools = [...driverSchools, schoolId];
          await updateDoc(doc(db, "users", existingUserDoc.id), {
            school_ids: updatedSchools,
            updatedAt: serverTimestamp(),
          });

          toast.success("Driver already registered. They have been assigned to this school.");
          setInviteEmail("");
          setBusyInvite(false);
          return;
        } else {
          setInviteError(`This email is already registered as a ${accountType.replace("_", " ")}. Cannot invite as driver.`);
          setBusyInvite(false);
          return;
        }
      }

      const token = createToken();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

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

      const acceptUrl = `${window.location.origin}/accept-invite?token=${encodeURIComponent(token)}`;
      setInviteLink(acceptUrl);

      try {
        const schoolDoc = await getDoc(doc(db, "schools", schoolId));
        const schoolName = schoolDoc.exists() ? schoolDoc.data().name : "School";

        const apiUrl = process.env.REACT_APP_EMAIL_API_URL || 'https://app.ridewatch.org/api';
        const emailResponse = await fetch(`${apiUrl}/send-driver-invitation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            schoolName,
            inviterName: user.displayName || user.email,
            invitationLink: acceptUrl,
            expiresAt: expiresAt.toISOString(),
          }),
        });

        if (!emailResponse.ok) {
          toast.warning('Invitation created but email sending failed. Please share the link manually.');
        } else {
          toast.success('Invitation email sent successfully!');
        }
      } catch (emailError) {
        toast.warning('Invitation created but email sending failed. Please share the link manually.');
      }
    } catch (err) {
      setInviteError(err?.message || "Failed to create invite.");
    } finally {
      setBusyInvite(false);
    }
  }

  function copyInviteLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      toast.success("Invite link copied to clipboard.");
    });
  }

  if (loading) return null;

  return (
    <section className="container py-5">
      {/* School Selector */}
      {canInvite && (
        <div className="mb-4">
          <SchoolSelector />
        </div>
      )}

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="mb-1">Invite Driver</h3>
          <p className="text-secondary mb-0">
            Invite new drivers or assign existing drivers to the selected school.
          </p>
        </div>
      </div>

      {!canInvite && (
        <div className="alert alert-warning mb-3 d-flex align-items-start gap-3">
          <Icon icon="mdi:alert-circle-outline" style={{ fontSize: '24px', marginTop: '2px' }} />
          <div>
            <h6 className="mb-2">No School Selected</h6>
            <p className="mb-2">You don't have an associated school yet. Please create a school first to invite drivers.</p>
            <a href="/schools" className="btn btn-sm btn-warning">
              <Icon icon="mdi:plus-circle" className="me-1" />
              Create School
            </a>
          </div>
        </div>
      )}

      {/* Action Cards */}
      {canInvite && (
        <div className="row g-4">
          {/* Invite New Driver Card */}
          <div className="col-md-6">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body text-center p-5">
                <div className="mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                  >
                    <Icon icon="mdi:email-plus-outline" style={{ fontSize: '40px', color: '#fff' }} />
                  </div>
                </div>
                <h4 className="mb-3">Invite New Driver</h4>
                <p className="text-secondary mb-4">
                  Send an email invitation to a new driver. They will create their account and be automatically assigned to this school.
                </p>
                <button
                  className="btn btn-primary btn-lg radius-12 px-5"
                  onClick={openInvite}
                >
                  <Icon icon="mingcute:add-line" className="me-2" />
                  Send Invitation
                </button>
              </div>
            </div>
          </div>

          {/* Assign Existing Driver Card */}
          <div className="col-md-6">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body text-center p-5">
                <div className="mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                  >
                    <Icon icon="mdi:account-plus-outline" style={{ fontSize: '40px', color: '#fff' }} />
                  </div>
                </div>
                <h4 className="mb-3">Assign Existing Driver</h4>
                <p className="text-secondary mb-4">
                  Assign a driver who already has an account in your organization to this school.
                </p>
                <button
                  className="btn btn-outline-primary btn-lg radius-12 px-5"
                  onClick={openAssign}
                >
                  <Icon icon="mingcute:user-add-line" className="me-2" />
                  Assign Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Driver List Link */}
      {canInvite && (
        <div className="text-center mt-5">
          <a href="/driver-list" className="btn btn-link text-secondary">
            <Icon icon="mdi:account-group" className="me-2" />
            View All Drivers
          </a>
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

        {inviteLink && (
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
        )}
      </Modal>

      {/* Assign Existing Driver Modal */}
      <Modal open={showAssign} title="Assign Existing Driver to School" onClose={closeAssign}>
        {assignError && <div className="alert alert-danger mb-3">{assignError}</div>}
        <div className="mb-3">
          <p className="text-secondary">
            Select a driver who is already registered to assign them to this school.
          </p>
        </div>
        {allDrivers.length === 0 ? (
          <div className="text-center text-secondary py-3">
            No registered drivers found. Invite new drivers first.
          </div>
        ) : (
          <div className="list-group">
            {allDrivers
              .filter(d => !(d.school_ids || []).includes(schoolId))
              .map(d => (
                <div
                  key={d.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div className="fw-bold">{d.displayName || d.email}</div>
                    <small className="text-secondary">{d.email}</small>
                    {d.school_ids && d.school_ids.length > 0 && (
                      <div>
                        <span className="badge bg-info mt-1">
                          Already in {d.school_ids.length} school(s)
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => assignDriverToSchool(d.id)}
                  >
                    <Icon icon="mingcute:add-line" /> Assign
                  </button>
                </div>
              ))}
            {allDrivers.filter(d => !(d.school_ids || []).includes(schoolId)).length === 0 && (
              <div className="text-center text-secondary py-3">
                All registered drivers are already assigned to this school.
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
};

export default InviteDriverLayer;
