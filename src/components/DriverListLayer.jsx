import { Icon } from "@iconify/react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "../lib/firebase";
import { useToast } from "./Toast";
import SchoolSelector from "./SchoolSelector";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  serverTimestamp,
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

const DriverListLayer = () => {
  const { user, profile, loading } = useAuth();
  const toast = useToast();
  const schoolId = profile?.current_school_id || null;

  const canManage = !!user && !!schoolId;

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", onConfirm: null });

  // Drivers list state
  const [drivers, setDrivers] = useState(null);
  const [listError, setListError] = useState("");

  // Load drivers for this school (live)
  useEffect(() => {
    if (!canManage) {
      setDrivers([]);
      return;
    }
    setDrivers(null);
    setListError("");

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
  }, [canManage, schoolId]);

  async function toggleDriverStatus(driver) {
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
      {/* School Selector */}
      {canManage && (
        <div className="mb-4">
          <SchoolSelector />
        </div>
      )}

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="mb-1">Driver List</h3>
          <p className="text-secondary mb-0">
            View and manage all drivers assigned to the selected school.
          </p>
        </div>
      </div>

      {!canManage && (
        <div className="alert alert-warning mb-3 d-flex align-items-start gap-3">
          <Icon icon="mdi:alert-circle-outline" style={{ fontSize: '24px', marginTop: '2px' }} />
          <div>
            <h6 className="mb-2">No School Selected</h6>
            <p className="mb-2">You don't have an associated school yet. Please create a school first.</p>
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
      ) : drivers.length === 0 && canManage ? (
        <div className="text-center py-5">
          <Icon icon="mdi:account-off-outline" style={{ fontSize: '64px', color: '#9ca3af' }} />
          <h5 className="mt-3 mb-2">No Drivers Yet</h5>
          <p className="text-secondary mb-4">No drivers have been assigned to this school yet.</p>
          <a href="/invite-driver" className="btn btn-primary">
            <Icon icon="mingcute:add-line" className="me-2" />
            Invite a Driver
          </a>
        </div>
      ) : canManage ? (
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
                const badgeClass = status === "active" ? "bg-success" : "bg-secondary";
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

export default DriverListLayer;
