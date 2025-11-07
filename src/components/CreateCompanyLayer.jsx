import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../auth/AuthProvider";

const CreateCompanyLayer = () => {
  const { user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) return;
    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }

    try {
      setBusy(true);

      // 1) Create the company doc
      const payload = {
        name: name.trim(),
        address: address.trim() || "",
        description: description.trim() || "",
        contact_person: contactPerson.trim() || "",
        contact_phone: contactPhone.trim() || "",
        owner_uid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      };

      const ref = await addDoc(collection(db, "companies"), payload);

      // 2) Set user profile as company admin
      await setDoc(
        doc(db, "users", user.uid),
        {
          company_id: ref.id,
          account_type: "bus_company",
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      // 3) Refresh profile to get updated company_id
      await refreshProfile();

      // 4) Alert + go to schools page
      window.alert("Bus company has been created successfully.");
      navigate("/schools", { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to create company.");
    } finally {
      setBusy(false);
    }
  };

  // While waiting for profile to load, render nothing
  if (loading) return null;

  return (
    <section className="container py-5">
      <div className="max-w-600 mx-auto">
        <h3 className="mb-3">Create Bus Company</h3>
        <p className="text-secondary mb-4">Add your bus company details to get started.</p>

        <form onSubmit={handleCreate}>
          <div className="mb-3">
            <label className="form-label">Company Name*</label>
            <input
              type="text"
              className="form-control h-56-px bg-neutral-50 radius-12"
              placeholder="e.g., SafeRide Bus Services"
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
              rows={3}
              placeholder="Brief description about your bus company"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                className="form-control h-56-px bg-neutral-50 radius-12"
                placeholder="Contact name"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                className="form-control h-56-px bg-neutral-50 radius-12"
                placeholder="+63 912 345 6789"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-danger mb-3">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-100 radius-12 py-3"
            disabled={busy}
          >
            {busy ? "Creating…" : "Create Company"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default CreateCompanyLayer;
