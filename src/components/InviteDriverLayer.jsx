import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

function createToken(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

const InviteDriverLayer = () => {
  const { user, profile, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');

  const schoolId = profile?.school_id || null;

  const canInvite = useMemo(() => {
    return !!user && !!schoolId;
  }, [user, schoolId]);

  async function onInvite(e) {
    e.preventDefault();
    setError('');
    setLink('');

    if (!canInvite) {
      setError('You must belong to a school to send invites.');
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setBusy(true);
      const token = createToken();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Use token as doc ID for simple lookup
      await setDoc(doc(db, 'invites', token), {
        token,
        email: normalizedEmail,
        role: 'driver',
        school_id: schoolId,
        status: 'pending',
        invited_by: user.uid,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
      });

      const acceptUrl = `${window.location.origin}/accept-invite?token=${encodeURIComponent(token)}`;
      setLink(acceptUrl);
      window.alert('Invitation created. Copy the link and send it to the driver.');
    } catch (err) {
      setError(err?.message || 'Failed to create invite.');
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      window.alert('Invite link copied to clipboard.');
    });
  }

  if (loading) return null;

  return (
    <section className="container py-5">
      <div className="max-w-600 mx-auto">
        <h3 className="mb-3">Invite Driver</h3>
        <p className="text-secondary mb-4">
          Send an invitation link so a driver can create an account for your school.
        </p>

        {!canInvite && (
          <div className="alert alert-warning mb-3">
            You don’t have an associated school yet. Please create a school first.
          </div>
        )}

        <form onSubmit={onInvite}>
          <div className="icon-field mb-3">
            <span className="icon top-50 translate-middle-y">
              <Icon icon="mage:email" />
            </span>
            <input
              type="email"
              className="form-control h-56-px bg-neutral-50 radius-12"
              placeholder="driver@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!canInvite || busy}
            />
          </div>

          {error && <div className="text-danger mb-3">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-100 radius-12 py-3"
            disabled={!canInvite || busy}
          >
            {busy ? 'Sending…' : 'Send Invitation'}
          </button>
        </form>

        {link ? (
          <div className="mt-4">
            <label className="form-label">Invitation Link</label>
            <div className="d-flex gap-2">
              <input
                readOnly
                className="form-control bg-neutral-50 radius-12"
                value={link}
              />
              <button className="btn btn-outline-secondary" onClick={copyLink} type="button">
                Copy
              </button>
            </div>
            <small className="text-secondary">Link expires in 7 days.</small>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default InviteDriverLayer;
