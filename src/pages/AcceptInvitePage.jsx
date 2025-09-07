// /src/pages/AcceptInvitePage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const rawToken = params.get('token') || '';
  const token = rawToken.trim();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [pwd, setPwd] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [plateNo, setPlateNo] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  const isExpired = useMemo(() => {
    if (!invite?.expiresAt) return false;
    const exp = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : new Date(invite.expiresAt);
    return Date.now() > exp.getTime();
  }, [invite]);

  useEffect(() => {
    let on = true;
    async function load() {
      if (!token) {
        setLoadError('Missing invite token.');
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'invites', token));
        if (!on) return;
        if (!snap.exists()) {
          setLoadError('Invite not found.');
        } else {
          setInvite(snap.data());
        }
      } catch (e) {
        setLoadError(e?.message || 'Unable to load invite (permissions?).');
      } finally {
        if (on) setLoading(false);
      }
    }
    load();
    return () => { on = false; };
  }, [token]);

  function validate() {
    if (!invite) return 'Invalid invite.';
    if (invite.status !== 'pending') return 'This invite is no longer valid.';
    if (isExpired) return 'This invite has expired.';
    if (pwd.trim().length < 8) return 'Password must be at least 8 characters.';
    if (!fullName.trim()) return 'Full name is required.';
    // Light phone check (optional; you can tighten as needed)
    if (phone && !/^[0-9+\-\s()]{7,}$/.test(phone)) return 'Please enter a valid phone number.';
    // License & plate can be optional or required—make both required here:
    if (!licenseNo.trim()) return 'License number is required.';
    if (!plateNo.trim()) return 'Plate number is required.';
    return '';
  }

  async function accept(e) {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) { setError(v); return; }

    try {
      setBusy(true);

      // 1) Create the user with the invited email
      const user = await register({
        email: String(invite.email || '').toLowerCase().trim(),
        password: pwd,
        displayName: fullName.trim(),
      });

      // 2) Merge driver profile fields into users/{uid}
      await setDoc(
        doc(db, 'users', user.uid),
        {
          account_type: 'driver',
          school_id: invite.school_id || null,
          displayName: fullName.trim(),
          phone: phone.trim(),
          driver_license_no: licenseNo.trim(),
          plate_no: plateNo.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 3) Mark invite as accepted
      await updateDoc(doc(db, 'invites', token), {
        status: 'accepted',
        accepted_by: user.uid,
        acceptedAt: serverTimestamp(),
      });

      // 4) Success → redirect to success page
      navigate('/invite-success', { replace: true });
    } catch (e) {
      setError(e?.message || 'Failed to accept invite.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  if (!invite) {
    return (
      <section className="container py-5">
        <div className="max-w-600 mx-auto">
          <h3 className="mb-3">Invitation</h3>
          <div className="alert alert-danger">
            {loadError || 'Invalid invitation.'}
          </div>
          <Link to="/sign-in" className="btn btn-primary mt-3">Go to Sign In</Link>
        </div>
      </section>
    );
  }

  const showInvalid = invite.status !== 'pending' || isExpired;

  return (
    <section className="container py-5">
      <div className="max-w-600 mx-auto">
        <h3 className="mb-3">Accept Invitation</h3>

        {showInvalid ? (
          <>
            <div className="alert alert-warning">
              {isExpired ? 'This invite has expired.' : 'This invite is no longer valid.'}
            </div>
            <Link to="/sign-in" className="btn btn-primary mt-3">Go to Sign In</Link>
          </>
        ) : (
          <form onSubmit={accept}>
            <div className="mb-3">
              <label className="form-label">Email (invited)</label>
              <input
                className="form-control h-56-px bg-neutral-50 radius-12"
                value={invite.email}
                readOnly
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Full Name*</label>
              <input
                type="text"
                className="form-control h-56-px bg-neutral-50 radius-12"
                placeholder="e.g., Juan Dela Cruz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-control h-56-px bg-neutral-50 radius-12"
                placeholder="+63 912 345 6789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Driver’s License No.*</label>
              <input
                type="text"
                className="form-control h-56-px bg-neutral-50 radius-12"
                placeholder="License number"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Plate No.*</label>
              <input
                type="text"
                className="form-control h-56-px bg-neutral-50 radius-12"
                placeholder="e.g., ABC-1234"
                value={plateNo}
                onChange={(e) => setPlateNo(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Set Password*</label>
              <input
                type="password"
                className="form-control h-56-px bg-neutral-50 radius-12"
                placeholder="Create a password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
              />
              <small className="text-secondary">At least 8 characters.</small>
            </div>

            {error && <div className="text-danger mb-3">{error}</div>}

            <button className="btn btn-primary w-100 radius-12 py-3" disabled={busy} type="submit">
              {busy ? 'Creating…' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
