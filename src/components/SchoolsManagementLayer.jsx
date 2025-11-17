import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "../lib/firebase";
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
  const companyId = profile?.company_id || null;
  const currentSchoolId = profile?.current_school_id || null;

  const [schools, setSchools] = useState(null); // null = loading
  const [err, setErr] = useState("");

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [busy, setBusy] = useState(false);

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
    const ok = window.confirm(
      `Delete "${school.name}"? This will also delete all routes and data associated with this school. This cannot be undone.`
    );
    if (!ok) return;

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
    } catch (e) {
      setErr(e?.message || "Failed to delete school.");
    }
  }

  // Copy School ID
  function copySchoolId(schoolId) {
    navigator.clipboard.writeText(schoolId).then(() => {
      window.alert("School ID copied to clipboard.");
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
    </section>
  );
};

export default SchoolsManagementLayer;
