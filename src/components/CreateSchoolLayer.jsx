import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../auth/AuthProvider";

const CreateSchoolLayer = () => {
  const { user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) return; // RequireAuth should prevent this
    if (!name.trim()) {
      setError("School name is required.");
      return;
    }

    try {
      setBusy(true);

      // 1) Create the school doc
      const payload = {
        name: name.trim(),
        address: address.trim() || "",
        description: description.trim() || "",
        owner_uid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      };

      const ref = await addDoc(collection(db, "schools"), payload);

      // 2) Set as current school
      await setDoc(
        doc(db, "users", user.uid),
        { current_school_id: ref.id, updatedAt: serverTimestamp() },
        { merge: true }
      );

      // 3) Refresh the profile to get the updated current_school_id
      await refreshProfile();

      // 4) Alert + go to schools page
      window.alert("School has been created successfully.");
      navigate("/schools", { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to create school.");
    } finally {
      setBusy(false);
    }
  };

  // While waiting for profile to load, render nothing
  if (loading) return null;

  return (
    <section className="container py-5">
      <div className="max-w-600 mx-auto">
        <h3 className="mb-3">Create School</h3>
        <p className="text-secondary mb-4">Add your school details to continue.</p>

        <form onSubmit={handleCreate}>
          <div className="mb-3">
            <label className="form-label">School Name*</label>
            <input
              type="text"
              className="form-control h-56-px bg-neutral-50 radius-12"
              placeholder="e.g., Green Valley High School"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Address</label>
            <input
              type="text"
              className="form-control h-56-px bg-neutral-50 radius-12"
              placeholder="Street, City, Province, ZIP"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control bg-neutral-50 radius-12"
              rows={4}
              placeholder="Brief description about your school"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <div className="text-danger mb-3">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-100 radius-12 py-3"
            disabled={busy}
          >
            {busy ? "Creating…" : "Create School"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default CreateSchoolLayer;
