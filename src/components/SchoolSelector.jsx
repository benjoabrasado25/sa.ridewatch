import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "../lib/firebase";
import { useToast } from "./Toast";
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from "firebase/firestore";

const SchoolSelector = () => {
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const companyId = profile?.company_id || null;
  const currentSchoolId = profile?.current_school_id || null;

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  // Load schools for the company
  useEffect(() => {
    if (!companyId) {
      setSchools([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "schools"), where("company_id", "==", companyId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSchools(items);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load schools:", err);
        setSchools([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [companyId]);

  const currentSchool = schools.find((s) => s.id === currentSchoolId);

  async function changeSchool(schoolId) {
    if (!user || schoolId === currentSchoolId) return;

    try {
      setChanging(true);
      await setDoc(
        doc(db, "users", user.uid),
        { current_school_id: schoolId, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await refreshProfile();
      toast.success("School changed successfully.");
    } catch (err) {
      console.error("Failed to change school:", err);
      toast.error("Failed to change school. Please try again.");
    } finally {
      setChanging(false);
    }
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2 text-secondary">
        <div className="spinner-border spinner-border-sm" role="status" />
        <span>Loading schools...</span>
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <div className="alert alert-warning mb-0">
        <Icon icon="mdi:alert-outline" className="me-2" />
        No schools found. Please add a school first.
      </div>
    );
  }

  if (schools.length === 1) {
    // Only one school, no need for dropdown
    return (
      <div className="d-flex align-items-center gap-2">
        <Icon icon="mdi:school-outline" className="text-primary" />
        <span className="fw-semibold">{schools[0].name}</span>
        <span className="badge bg-primary-subtle text-primary">Only School</span>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center gap-3">
      <Icon icon="mdi:school-outline" className="text-primary fs-5" />
      <div className="dropdown">
        <button
          className="btn btn-outline-primary dropdown-toggle d-flex align-items-center gap-2"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          disabled={changing}
        >
          {changing ? (
            <>
              <div className="spinner-border spinner-border-sm" role="status" />
              <span>Switching...</span>
            </>
          ) : (
            <>
              <span className="fw-semibold">
                {currentSchool?.name || "Select School"}
              </span>
              <Icon icon="mdi:chevron-down" />
            </>
          )}
        </button>
        <ul className="dropdown-menu">
          {schools.map((school) => (
            <li key={school.id}>
              <button
                className={`dropdown-item d-flex align-items-center justify-content-between ${
                  school.id === currentSchoolId ? "active" : ""
                }`}
                onClick={() => changeSchool(school.id)}
                type="button"
              >
                <span>{school.name}</span>
                {school.id === currentSchoolId && (
                  <Icon icon="mdi:check-circle" className="text-success" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {currentSchool && (
        <small className="text-secondary">
          {currentSchool.address && `• ${currentSchool.address}`}
        </small>
      )}
    </div>
  );
};

export default SchoolSelector;
