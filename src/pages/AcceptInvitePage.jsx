// /src/pages/AcceptInvitePage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const rawToken = params.get('token') || '';
  const token = rawToken.trim();
  const navigate = useNavigate();

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
          const inviteData = snap.data();
          console.log('Loaded invite data:', inviteData);
          console.log('Invite school_id:', inviteData.school_id);
          setInvite(inviteData);
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
    if (phone && !/^[0-9+\-\s()]{7,}$/.test(phone)) return 'Please enter a valid phone number.';
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

      // 1) Create the user directly with Firebase Auth (driver invitation - already verified via email)
      const email = String(invite.email || '').toLowerCase().trim();
      const cred = await createUserWithEmailAndPassword(auth, email, pwd);
      await updateProfile(cred.user, { displayName: fullName.trim() });
      const user = cred.user;

      // 2) IMMEDIATELY create driver profile BEFORE auth state listener can interfere
      //    ✅ Ensure user is ACTIVATED on creation
      //    ✅ Use school_ids array to support multiple schools
      //    ✅ Mark email as verified (they came from email invitation)
      const schoolIdsArray = invite.school_id ? [invite.school_id] : [];
      console.log('Creating driver with school_ids:', schoolIdsArray);
      console.log('User UID:', user.uid);

      const driverData = {
        uid: user.uid,
        email: String(invite.email || '').toLowerCase().trim(),
        account_type: 'driver',
        status: 'active',
        school_ids: schoolIdsArray,
        displayName: fullName.trim(),
        phone: phone.trim(),
        driver_license_no: licenseNo.trim(),
        plate_no: plateNo.trim(),
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Driver data to save:', driverData);

      // Use set WITHOUT merge to ensure we fully control the document (not merge with bus_company)
      await setDoc(doc(db, 'users', user.uid), driverData);

      console.log('Driver document saved successfully');

      // 3) Mark invite as accepted
      await updateDoc(doc(db, 'invites', token), {
        status: 'accepted',
        accepted_by: user.uid,
        acceptedAt: serverTimestamp(),
      });

      // 4) Sign out the driver (they should use the driver app, not admin portal)
      await signOut(auth);

      // 5) Success → redirect to success page
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
          <p className="text-muted mt-3">If you already have an account, please use the RideWatch Driver app to sign in.</p>
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
            <p className="text-muted mt-3">If you already have an account, please use the RideWatch Driver app to sign in.</p>
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
