import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "../lib/firebase";
import { useToast } from "./Toast";
import SchoolSelector from "./SchoolSelector";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";

/** Simple controlled modal (no jQuery/Bootstrap JS needed) */
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

const DriverRoutesLayer = () => {
  const { user, profile, loading } = useAuth();
  const toast = useToast();
  const schoolId = profile?.current_school_id || null;

  const canUse = useMemo(() => !!user && !!schoolId, [user, schoolId]);

  const [routes, setRoutes] = useState(null); // null = loading; [] = empty
  const [err, setErr] = useState("");

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", onConfirm: null });

  // modal state
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    from: "",
    to: "",
    stops: "",
  });

  // Load routes realtime
  useEffect(() => {
    if (!canUse) {
      setRoutes([]); // Set to empty array instead of null when no school
      return;
    }
    setRoutes(null);
    const q = query(
      collection(db, "schools", schoolId, "routes"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRoutes(items);
      },
      (e) => {
        setErr(e?.message || "Failed to load routes.");
        setRoutes([]);
      }
    );
    return () => unsub();
  }, [canUse, schoolId]);

  function openAdd() {
    setErr("");
    setForm({ name: "", from: "", to: "", stops: "" });
    setShowAdd(true);
  }
  function closeAdd() {
    if (!busy) setShowAdd(false);
  }

  async function submitAdd(e) {
    e.preventDefault();
    if (!canUse) return;
    setErr("");

    const name = form.name.trim();
    const from = form.from.trim();
    const to = form.to.trim();
    const stopsNum = Number(form.stops || 0);

    if (!name) return setErr("Route name is required.");
    if (!from) return setErr("From is required.");
    if (!to) return setErr("To is required.");
    if (Number.isNaN(stopsNum) || stopsNum < 0) {
      return setErr("Stops must be a non-negative number.");
    }

    try {
      setBusy(true);
      await addDoc(collection(db, "schools", schoolId, "routes"), {
        name,
        from,
        to,
        stops: stopsNum,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      setShowAdd(false);
    } catch (e) {
      setErr(e?.message || "Failed to create route.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteRoute(id) {
    if (!canUse || !id) return;

    setConfirmModal({
      open: true,
      title: "Delete Route",
      message: "Delete this route? This cannot be undone.",
      onConfirm: async () => {
        setConfirmModal({ open: false, title: "", message: "", onConfirm: null });
        try {
          await deleteDoc(doc(db, "schools", schoolId, "routes", id));
          toast.success("Route deleted successfully.");
        } catch (e) {
          toast.error(e?.message || "Failed to delete route.");
        }
      },
    });
  }

  if (loading) return null;

  return (
    <section className="container py-5">
      {/* School Selector - only show if user has a school */}
      {canUse && (
        <div className="mb-4">
          <SchoolSelector />
        </div>
      )}

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="mb-1">Routes</h3>
          <p className="text-secondary mb-0">
            Manage routes for the selected school (create and delete).
          </p>
        </div>
        <button
          className="btn btn-primary radius-12 d-flex align-items-center gap-2"
          onClick={openAdd}
          disabled={!canUse}
          title={!canUse ? "You must select a school." : "Add Route"}
        >
          <Icon icon="mingcute:add-line" />
          Add Route
        </button>
      </div>

      {!canUse && (
        <div className="alert alert-warning mb-3 d-flex align-items-start gap-3">
          <Icon icon="mdi:alert-circle-outline" style={{ fontSize: '24px', marginTop: '2px' }} />
          <div>
            <h6 className="mb-2">No School Selected</h6>
            <p className="mb-2">You don't have an associated school yet. Please create a school first to manage routes.</p>
            <a href="/schools" className="btn btn-sm btn-warning">
              <Icon icon="mdi:plus-circle" className="me-1" />
              Create School
            </a>
          </div>
        </div>
      )}

      {err && <div className="alert alert-danger">{err}</div>}

      {/* Routes list */}
      {routes === null ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
          <p className="text-secondary mt-3">Loading routes...</p>
        </div>
      ) : routes.length === 0 && canUse ? (
        <div className="text-center py-5">
          <Icon icon="mdi:routes" style={{ fontSize: '64px', color: '#9ca3af' }} />
          <h5 className="mt-3 mb-2">No Routes Yet</h5>
          <p className="text-secondary mb-4">Get started by creating your first route for this school.</p>
          <button className="btn btn-primary" onClick={openAdd}>
            <Icon icon="mingcute:add-line" className="me-2" />
            Create Your First Route
          </button>
        </div>
      ) : canUse ? (
        <div className="row g-3">
          {routes.map((r) => (
            <div className="col-12 col-md-6 col-xl-4" key={r.id}>
              <div className="card h-100 radius-12">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-1">{r.name || "Route"}</h5>
                      <div className="text-secondary">
                        {(r.from || "") + " "}→{" " + (r.to || "")}
                      </div>
                    </div>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => deleteRoute(r.id)}
                      title="Delete route"
                    >
                      <Icon icon="mdi:trash-outline" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <span className="badge bg-light text-dark">
                      {typeof r.stops === "number" ? r.stops : 0} stops
                    </span>
                  </div>

                  {/* placeholder for future: view route, manage stops, etc. */}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Add Route Modal */}
      <Modal open={showAdd} title="Create Route" onClose={closeAdd}>
        <form onSubmit={submitAdd}>
          <div className="mb-3">
            <label className="form-label">Route Name</label>
            <input
              className="form-control bg-neutral-50 radius-12"
              placeholder="Morning Route A"
              value={form.name}
              onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
              required
              disabled={busy}
            />
          </div>

          <div className="row">
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">From</label>
              <input
                className="form-control bg-neutral-50 radius-12"
                placeholder="Depot"
                value={form.from}
                onChange={(e) => setForm((v) => ({ ...v, from: e.target.value }))}
                required
                disabled={busy}
              />
            </div>
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">To</label>
              <input
                className="form-control bg-neutral-50 radius-12"
                placeholder="School"
                value={form.to}
                onChange={(e) => setForm((v) => ({ ...v, to: e.target.value }))}
                required
                disabled={busy}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Stops (optional)</label>
            <input
              type="number"
              min="0"
              className="form-control bg-neutral-50 radius-12"
              placeholder="0"
              value={form.stops}
              onChange={(e) => setForm((v) => ({ ...v, stops: e.target.value }))}
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
              {busy ? "Creating…" : "Create Route"}
            </button>
          </div>
        </form>
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

export default DriverRoutesLayer;
