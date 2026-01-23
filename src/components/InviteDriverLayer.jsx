import { Icon } from "@iconify/react";
import React, { useEffect, useMemo, useState } from "react";
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
  const toast = useToast();
  const schoolId = profile?.current_school_id || null;

  const canInvite = useMemo(() => !!user && !!schoolId, [user, schoolId]);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", onConfirm: null });

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
  const [assignUnsub, setAssignUnsub] = useState(null); // Track unsubscribe function

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

  const openAssign = async () => {
    setShowAssign(true);
    setAssignError("");
    setAllDrivers([]);

    // Security fix: Only load drivers that belong to schools in the current user's company
    try {
      if (!profile?.company_id) {
        setAssignError("No company associated with your account.");
        return;
      }

      // 1. Get all school IDs for the current company
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

      // 2. Query all drivers and filter client-side
      // (Firestore doesn't support array-contains-any with another array)
      const q = query(
        collection(db, "users"),
        where("account_type", "==", "driver")
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const allDrvs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Filter: only drivers who have at least one school_id in companySchoolIds
        const filteredDrivers = allDrvs.filter(driver => {
          const driverSchools = driver.school_ids || [];
          return driverSchools.some(sid => companySchoolIds.includes(sid));
        });
        setAllDrivers(filteredDrivers);
      });
      setAssignUnsub(() => unsub); // Store unsubscribe function
    } catch (err) {
      setAssignError(err?.message || "Failed to load drivers");
    }
  };
  const closeAssign = () => {
    // Clean up listener when modal closes
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

  // Load drivers for this school (live)
  useEffect(() => {
    if (!canInvite) {
      setDrivers([]); // Set to empty array instead of null when no school
      return;
    }
    setDrivers(null);
    setListError("");

    // users where school_ids array contains current schoolId && account_type == driver
    const q = query(
      collection(db, "users"),
      where("school_ids", "array-contains", schoolId),
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

      // Check if email is already registered (any account type)
      const existingQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const existingSnap = await getDocs(existingQuery);

      if (!existingSnap.empty) {
        const existingUser = existingSnap.docs[0].data();
        const accountType = existingUser.account_type || "user";

        if (accountType === "driver") {
          setInviteError("This email is already registered as a driver. Use 'Assign Existing Driver' instead.");
        } else {
          setInviteError(`This email is already registered as a ${accountType.replace("_", " ")}. Cannot invite as driver.`);
        }
        setBusyInvite(false);
        return;
      }

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
      toast.success("Invite link copied to clipboard.");
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
      toast.success(`Driver ${next === "active" ? "activated" : "deactivated"} successfully.`);
    } catch (e) {
      toast.error(e?.message || "Failed to update driver status.");
    }
  }

  async function removeDriverFromSchool(driver) {
    setConfirmModal({
      open: true,
      title: "Remove Driver",
      message: `Remove ${driver.displayName || driver.email} from this school?`,
      onConfirm: async () => {
        setConfirmModal({ open: false, title: "", message: "", onConfirm: null });
        try {
          const currentSchools = driver.school_ids || [];
          const updatedSchools = currentSchools.filter(id => id !== schoolId);

          await updateDoc(doc(db, "users", driver.id), {
            school_ids: updatedSchools,
            updatedAt: serverTimestamp(),
          });

          toast.success("Driver removed from this school.");
        } catch (e) {
          toast.error(e?.message || "Failed to remove driver from school.");
        }
      },
    });
  }

  if (loading) return null;

  return (
    <section className="container py-5">
      {/* School Selector - only show if user has a school */}
      {canInvite && (
        <div className="mb-4">
          <SchoolSelector />
        </div>
      )}

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="mb-1">Drivers</h3>
          <p className="text-secondary mb-0">
            Invite new drivers and manage their status for the selected school.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary radius-12 d-flex align-items-center gap-2"
            onClick={openAssign}
            disabled={!canInvite}
            title={!canInvite ? "You must select a school." : "Assign Existing Driver"}
          >
            <Icon icon="mingcute:user-add-line" />
            Assign Existing Driver
          </button>
          <button
            className="btn btn-primary radius-12 d-flex align-items-center gap-2"
            onClick={openInvite}
            disabled={!canInvite}
            title={!canInvite ? "You must select a school." : "Invite New Driver"}
          >
            <Icon icon="mingcute:add-line" />
            Invite New Driver
          </button>
        </div>
      </div>

      {!canInvite && (
        <div className="alert alert-warning mb-3 d-flex align-items-start gap-3">
          <Icon icon="mdi:alert-circle-outline" style={{ fontSize: '24px', marginTop: '2px' }} />
          <div>
            <h6 className="mb-2">No School Selected</h6>
            <p className="mb-2">You don't have an associated school yet. Please create a school first to invite and manage drivers.</p>
            <a href="/schools" className="btn btn-sm btn-warning">
              <Icon icon="mdi:plus-circle" className="me-1" />
              Create School
            </a>
          </div>
        </div>
      )}

      {/* Drivers list */}
      {listError && <div className="alert alert-danger">{listError}</div>}

      {drivers === null ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
          <p className="text-secondary mt-3">Loading drivers...</p>
        </div>
      ) : drivers.length === 0 && canInvite ? (
        <div className="text-center py-5">
          <Icon icon="mdi:account-off-outline" style={{ fontSize: '64px', color: '#9ca3af' }} />
          <h5 className="mt-3 mb-2">No Drivers Yet</h5>
          <p className="text-secondary mb-4">Get started by inviting your first driver to this school.</p>
          <button className="btn btn-primary" onClick={openInvite}>
            <Icon icon="mingcute:add-line" className="me-2" />
            Invite Your First Driver
          </button>
        </div>
      ) : canInvite ? (
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
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeDriverFromSchool(d)}
                          title="Remove from this school"
                        >
                          <Icon icon="mdi:delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

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

      {/* Confirmation Modal */}
      <Modal
        open={confirmModal.open}
        title={confirmModal.title}
        onClose={() => setConfirmModal({ open: false, title: "", message: "", onConfirm: null })}
      >
        <p className="mb-4">{confirmModal.message}</p>
        <div className="d-flex gap-2 justify-content-end">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setConfirmModal({ open: false, title: "", message: "", onConfirm: null })}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={confirmModal.onConfirm}
          >
            Confirm
          </button>
        </div>
      </Modal>
    </section>
  );
};

export default InviteDriverLayer;
