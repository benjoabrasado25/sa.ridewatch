import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "../lib/firebase";
import { useToast } from "./Toast";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";

/** Simple controlled modal */
function Modal({ open, title, children, onClose, size = "md" }) {
  if (!open) return null;
  return (
    <div
      className="modal fade show"
      style={{ display: "block", background: "rgba(0,0,0,.4)" }}
      aria-modal="true"
      role="dialog"
    >
      <div className={`modal-dialog modal-dialog-centered ${size === "lg" ? "modal-lg" : ""}`}>
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

const SchoolsManagementLayer = () => {
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const companyId = profile?.company_id || null;
  const currentSchoolId = profile?.current_school_id || null;

  const [schools, setSchools] = useState(null); // null = loading
  const [err, setErr] = useState("");

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [busy, setBusy] = useState(false);

  // Users management state
  const [schoolUsers, setSchoolUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingBanned, setLoadingBanned] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [usersUnsub, setUsersUnsub] = useState(null); // Track unsubscribe function
  const [usersTab, setUsersTab] = useState("active"); // "active" or "banned"

  // Form state
  const [form, setForm] = useState({
    name: "",
    address: "",
    description: "",
  });

  // Load schools where company_id matches
  useEffect(() => {
    if (!user || !companyId) return;
    setSchools(null);
    const q = query(collection(db, "schools"), where("company_id", "==", companyId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSchools(items);
      },
      (e) => {
        setErr(e?.message || "Failed to load schools.");
        setSchools([]);
      }
    );
    return () => unsub();
  }, [user, companyId]);

  // Open Add Modal
  function openAdd() {
    setErr("");
    setForm({ name: "", address: "", description: "" });
    setShowAdd(true);
  }

  // Open Edit Modal
  function openEdit(school) {
    setErr("");
    setSelectedSchool(school);
    setForm({
      name: school.name || "",
      address: school.address || "",
      description: school.description || "",
    });
    setShowEdit(true);
  }

  // Open QR Modal
  function openQR(school) {
    setSelectedSchool(school);
    setShowQR(true);
  }

  // Open Users Modal
  async function openUsers(school) {
    setSelectedSchool(school);
    setShowUsers(true);
    setUsersError("");
    setSchoolUsers([]);
    setBannedUsers([]);
    setLoadingUsers(true);
    setLoadingBanned(true);
    setUsersTab("active");

    // Query users who have joined this school (account_type == "user")
    const q = query(
      collection(db, "users"),
      where("school_ids", "array-contains", school.id),
      where("account_type", "==", "user")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSchoolUsers(users);
        setLoadingUsers(false);
      },
      (e) => {
        setUsersError(e?.message || "Failed to load users.");
        setLoadingUsers(false);
      }
    );

    // Store unsubscribe function to clean up when modal closes
    setUsersUnsub(() => unsub);

    // Load banned users from school document
    try {
      const schoolSnap = await import("firebase/firestore").then(({ getDoc }) =>
        getDoc(doc(db, "schools", school.id))
      );
      if (schoolSnap.exists()) {
        const bannedIds = schoolSnap.data()?.banned_users || [];
        if (bannedIds.length > 0) {
          // Fetch user details for banned users
          const { getDocs } = await import("firebase/firestore");
          const bannedQ = query(
            collection(db, "users"),
            where("__name__", "in", bannedIds.slice(0, 10)) // Firestore limit: 10
          );
          const bannedSnap = await getDocs(bannedQ);
          const banned = bannedSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setBannedUsers(banned);
        }
      }
    } catch (e) {
      console.error("Error loading banned users:", e);
    }
    setLoadingBanned(false);
  }

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", onConfirm: null });

  // Ban user from school
  async function banUserFromSchool(userId, userName) {
    if (!selectedSchool) return;

    setConfirmModal({
      open: true,
      title: "Ban User",
      message: `Ban "${userName || 'this user'}" from ${selectedSchool.name}? They will no longer be able to see routes from this school.`,
      onConfirm: async () => {
        setConfirmModal({ open: false, title: "", message: "", onConfirm: null });
        try {
          // Add user to banned_users array in school document
          await updateDoc(doc(db, "schools", selectedSchool.id), {
            banned_users: arrayUnion(userId),
            updatedAt: serverTimestamp(),
          });

          // Remove this school from user's school_ids
          await updateDoc(doc(db, "users", userId), {
            school_ids: arrayRemove(selectedSchool.id),
            updatedAt: serverTimestamp(),
          });

          toast.success(`User has been banned from ${selectedSchool.name}.`);
        } catch (e) {
          toast.error(e?.message || "Failed to ban user.");
        }
      },
    });
  }

  // Unban user from school
  async function unbanUserFromSchool(userId, userName) {
    if (!selectedSchool) return;

    setConfirmModal({
      open: true,
      title: "Unban User",
      message: `Unban "${userName || 'this user'}" from ${selectedSchool.name}? They will be restored to active users.`,
      onConfirm: async () => {
        setConfirmModal({ open: false, title: "", message: "", onConfirm: null });
        try {
          // Remove user from banned_users array in school document
          await updateDoc(doc(db, "schools", selectedSchool.id), {
            banned_users: arrayRemove(userId),
            updatedAt: serverTimestamp(),
          });

          // Re-add this school to user's school_ids so they're active again
          await updateDoc(doc(db, "users", userId), {
            school_ids: arrayUnion(selectedSchool.id),
            updatedAt: serverTimestamp(),
          });

          // Find the user in bannedUsers and move them to schoolUsers
          const unbannedUser = bannedUsers.find((u) => u.id === userId);
          if (unbannedUser) {
            setSchoolUsers((prev) => [...prev, unbannedUser]);
          }
          setBannedUsers((prev) => prev.filter((u) => u.id !== userId));

          toast.success(`User has been unbanned and restored to ${selectedSchool.name}.`);
        } catch (e) {
          toast.error(e?.message || "Failed to unban user.");
        }
      },
    });
  }

  // Close Modals
  function closeAdd() {
    if (!busy) setShowAdd(false);
  }
  function closeEdit() {
    if (!busy) {
      setShowEdit(false);
      setSelectedSchool(null);
    }
  }
  function closeQR() {
    setShowQR(false);
    setSelectedSchool(null);
  }
  function closeUsers() {
    // Clean up listener when modal closes
    if (usersUnsub) {
      usersUnsub();
      setUsersUnsub(null);
    }
    setShowUsers(false);
    setSelectedSchool(null);
    setSchoolUsers([]);
    setBannedUsers([]);
    setUsersTab("active");
  }

  // Submit Add School
  async function submitAdd(e) {
    e.preventDefault();
    if (!user || !companyId) return;
    setErr("");

    const name = form.name.trim();
    if (!name) {
      setErr("School name is required.");
      return;
    }

    try {
      setBusy(true);
      const payload = {
        name,
        address: form.address.trim() || "",
        description: form.description.trim() || "",
        company_id: companyId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      };

      const ref = await addDoc(collection(db, "schools"), payload);

      // If this is the user's first school, set it as current
      if (!currentSchoolId || schools?.length === 0) {
        await setDoc(
          doc(db, "users", user.uid),
          { current_school_id: ref.id, updatedAt: serverTimestamp() },
          { merge: true }
        );
        // Refresh profile to update current_school_id
        await refreshProfile();
      }

      setShowAdd(false);
      setForm({ name: "", address: "", description: "" });
    } catch (e) {
      setErr(e?.message || "Failed to create school.");
    } finally {
      setBusy(false);
    }
  }

  // Submit Edit School
  async function submitEdit(e) {
    e.preventDefault();
    if (!user || !selectedSchool) return;
    setErr("");

    const name = form.name.trim();
    if (!name) {
      setErr("School name is required.");
      return;
    }

    try {
      setBusy(true);
      await updateDoc(doc(db, "schools", selectedSchool.id), {
        name,
        address: form.address.trim() || "",
        description: form.description.trim() || "",
        updatedAt: serverTimestamp(),
      });

      setShowEdit(false);
      setSelectedSchool(null);
    } catch (e) {
      setErr(e?.message || "Failed to update school.");
    } finally {
      setBusy(false);
    }
  }

  // Set as Current School
  async function setAsCurrent(schoolId) {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { current_school_id: schoolId, updatedAt: serverTimestamp() },
        { merge: true }
      );
      // Refresh profile to update current_school_id
      await refreshProfile();
    } catch (e) {
      setErr(e?.message || "Failed to set current school.");
    }
  }

  // Delete School
  async function deleteSchool(school) {
    if (!user || !school) return;

    setConfirmModal({
      open: true,
      title: "Delete School",
      message: `Delete "${school.name}"? This will also delete all routes and data associated with this school. This cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal({ open: false, title: "", message: "", onConfirm: null });
        try {
          await deleteDoc(doc(db, "schools", school.id));

          // If deleting current school, clear it
          if (currentSchoolId === school.id) {
            const remaining = schools?.filter((s) => s.id !== school.id) || [];
            const newCurrent = remaining.length > 0 ? remaining[0].id : null;
            await setDoc(
              doc(db, "users", user.uid),
              { current_school_id: newCurrent, updatedAt: serverTimestamp() },
              { merge: true }
            );
          }
          toast.success(`School "${school.name}" has been deleted.`);
        } catch (e) {
          toast.error(e?.message || "Failed to delete school.");
        }
      },
    });
  }

  // Copy School ID
  function copySchoolId(schoolId) {
    navigator.clipboard.writeText(schoolId).then(() => {
      toast.success("School ID copied to clipboard.");
    });
  }

  if (!user) return null;

  return (
    <section className="container py-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="mb-1">Schools</h3>
          <p className="text-secondary mb-0">
            Manage your schools, view QR codes, and switch between them.
          </p>
        </div>
        <button
          className="btn btn-primary radius-12 d-flex align-items-center gap-2"
          onClick={openAdd}
        >
          <Icon icon="mingcute:add-line" />
          Add School
        </button>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      {/* Schools List */}
      {schools === null ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      ) : schools.length === 0 ? (
        <div className="text-center text-secondary py-5">
          <Icon icon="mdi:school-outline" className="text-6xl mb-3" />
          <h5 className="mb-2">No Schools Yet</h5>
          <p className="mb-3">Get started by adding your first school to manage routes and drivers.</p>
          <button
            className="btn btn-primary radius-12"
            onClick={openAdd}
          >
            <Icon icon="mingcute:add-line" className="me-2" />
            Add Your First School
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {schools.map((school) => {
            const isCurrent = currentSchoolId === school.id;
            return (
              <div className="col-12 col-md-6 col-xl-4" key={school.id}>
                <div className={`card h-100 radius-12 ${isCurrent ? "border-primary border-2" : ""}`}>
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="flex-grow-1">
                        <h5 className="mb-1 d-flex align-items-center gap-2">
                          {school.name}
                          {isCurrent && (
                            <span className="badge bg-primary text-xs">Current</span>
                          )}
                        </h5>
                        {school.address && (
                          <p className="text-secondary mb-0 text-sm">
                            <Icon icon="mdi:map-marker-outline" className="me-1" />
                            {school.address}
                          </p>
                        )}
                      </div>
                    </div>

                    {school.description && (
                      <p className="text-secondary mb-3 text-sm">{school.description}</p>
                    )}

                    <div className="mt-auto">
                      <div className="d-flex gap-2 flex-wrap">
                        {!isCurrent && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setAsCurrent(school.id)}
                            title="Set as current school"
                          >
                            <Icon icon="mdi:check-circle-outline" className="me-1" />
                            Set as Current
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openUsers(school)}
                          title="View Users"
                        >
                          <Icon icon="mdi:account-group-outline" />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openQR(school)}
                          title="View QR Code"
                        >
                          <Icon icon="mdi:qrcode" />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openEdit(school)}
                          title="Edit school"
                        >
                          <Icon icon="mdi:pencil-outline" />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteSchool(school)}
                          title="Delete school"
                        >
                          <Icon icon="mdi:trash-outline" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add School Modal */}
      <Modal open={showAdd} title="Add New School" onClose={closeAdd}>
        <form onSubmit={submitAdd}>
          <div className="mb-3">
            <label className="form-label">School Name*</label>
            <input
              className="form-control bg-neutral-50 radius-12"
              placeholder="e.g., Green Valley High School"
              value={form.name}
              onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
              required
              disabled={busy}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Address</label>
            <input
              className="form-control bg-neutral-50 radius-12"
              placeholder="Street, City, Province, ZIP"
              value={form.address}
              onChange={(e) => setForm((v) => ({ ...v, address: e.target.value }))}
              disabled={busy}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control bg-neutral-50 radius-12"
              rows={3}
              placeholder="Brief description about your school"
              value={form.description}
              onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
              disabled={busy}
            />
          </div>

          {err && <div className="text-danger mb-3">{err}</div>}

          <div className="d-flex gap-2 justify-content-end">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={closeAdd}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Creating…" : "Create School"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit School Modal */}
      <Modal open={showEdit} title="Edit School" onClose={closeEdit}>
        <form onSubmit={submitEdit}>
          <div className="mb-3">
            <label className="form-label">School Name*</label>
            <input
              className="form-control bg-neutral-50 radius-12"
              placeholder="e.g., Green Valley High School"
              value={form.name}
              onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
              required
              disabled={busy}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Address</label>
            <input
              className="form-control bg-neutral-50 radius-12"
              placeholder="Street, City, Province, ZIP"
              value={form.address}
              onChange={(e) => setForm((v) => ({ ...v, address: e.target.value }))}
              disabled={busy}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control bg-neutral-50 radius-12"
              rows={3}
              placeholder="Brief description about your school"
              value={form.description}
              onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
              disabled={busy}
            />
          </div>

          {err && <div className="text-danger mb-3">{err}</div>}

          <div className="d-flex gap-2 justify-content-end">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={closeEdit}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Updating…" : "Update School"}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Modal */}
      <Modal open={showQR} title={`QR Code - ${selectedSchool?.name || ""}`} onClose={closeQR}>
        {selectedSchool && (
          <div className="text-center">
            <div className="d-flex justify-content-center mb-4">
              <QRCodeCanvas
                value={`${window.location.origin}/school/${selectedSchool.id}`}
                size={240}
                includeMargin={true}
              />
            </div>

            <p className="mb-2">
              <strong>School ID:</strong>
            </p>
            <div className="d-flex justify-content-center gap-2 mb-3">
              <input
                readOnly
                value={selectedSchool.id}
                className="form-control text-center bg-neutral-50 radius-12"
                style={{ maxWidth: 320 }}
              />
              <button
                className="btn btn-outline-secondary"
                onClick={() => copySchoolId(selectedSchool.id)}
                type="button"
              >
                <Icon icon="mdi:content-copy" />
              </button>
            </div>

            <small className="text-secondary d-block mb-3">
              Scan the QR code or share the school ID for drivers to join this school.
            </small>

            <a
              href={`/school/${selectedSchool.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
            >
              <Icon icon="mdi:open-in-new" />
              View Public QR Page
            </a>
          </div>
        )}
      </Modal>

      {/* Users Management Modal */}
      <Modal open={showUsers} title={`Users - ${selectedSchool?.name || ""}`} onClose={closeUsers} size="lg">
        {selectedSchool && (
          <div>
            <p className="text-secondary mb-3">
              Manage users who have joined this school. You can ban users to prevent them from seeing routes.
            </p>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button
                  className={`nav-link ${usersTab === "active" ? "active" : ""}`}
                  onClick={() => setUsersTab("active")}
                >
                  Active Users ({schoolUsers.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${usersTab === "banned" ? "active" : ""}`}
                  onClick={() => setUsersTab("banned")}
                >
                  Banned Users ({bannedUsers.length})
                </button>
              </li>
            </ul>

            {usersError && <div className="alert alert-danger">{usersError}</div>}

            {/* Active Users Tab */}
            {usersTab === "active" && (
              <>
                {loadingUsers ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status" />
                    <p className="text-secondary mt-2">Loading users...</p>
                  </div>
                ) : schoolUsers.length === 0 ? (
                  <div className="text-center py-4">
                    <Icon icon="mdi:account-off-outline" style={{ fontSize: '48px', color: '#9ca3af' }} />
                    <p className="text-secondary mt-2">No users have joined this school yet.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th style={{ width: 36 }}></th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Joined</th>
                          <th style={{ width: 120 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schoolUsers.map((u) => {
                          const joinedDate = u.createdAt?.toDate?.()
                            ? u.createdAt.toDate().toLocaleDateString()
                            : "—";
                          return (
                            <tr key={u.id}>
                              <td>
                                <div className="avatar avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center">
                                  <Icon icon="mdi:account" />
                                </div>
                              </td>
                              <td>{u.displayName || "—"}</td>
                              <td>{u.email || "—"}</td>
                              <td>{joinedDate}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                                  onClick={() => banUserFromSchool(u.id, u.displayName || u.email)}
                                  title="Ban user from this school"
                                >
                                  <Icon icon="mdi:cancel" />
                                  Ban
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Banned Users Tab */}
            {usersTab === "banned" && (
              <>
                {loadingBanned ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status" />
                    <p className="text-secondary mt-2">Loading banned users...</p>
                  </div>
                ) : bannedUsers.length === 0 ? (
                  <div className="text-center py-4">
                    <Icon icon="mdi:account-check-outline" style={{ fontSize: '48px', color: '#22c55e' }} />
                    <p className="text-secondary mt-2">No banned users.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th style={{ width: 36 }}></th>
                          <th>Name</th>
                          <th>Email</th>
                          <th style={{ width: 120 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bannedUsers.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div className="avatar avatar-sm rounded-circle bg-danger-subtle d-flex align-items-center justify-content-center">
                                <Icon icon="mdi:account-cancel" className="text-danger" />
                              </div>
                            </td>
                            <td>{u.displayName || "—"}</td>
                            <td>{u.email || "—"}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                                onClick={() => unbanUserFromSchool(u.id, u.displayName || u.email)}
                                title="Unban user"
                              >
                                <Icon icon="mdi:account-check" />
                                Unban
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
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

export default SchoolsManagementLayer;
