// /src/pages/SuperAdminSubscriptionsPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import { collection, query, getDocs, doc, updateDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import MasterLayout from '../masterLayout/MasterLayout';
import { useAuth } from '../auth/AuthProvider';

export default function SuperAdminSubscriptionsPage() {
  const { loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalAction, setModalAction] = useState(''); // grant, revoke, extend, end_trial
  const [extendDays, setExtendDays] = useState(7);

  // Load users with subscription data
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );

      const snap = await getDocs(q);
      const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(allUsers);
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter users
  const filteredUsers = users.filter(user => {
    if (user.account_type !== 'user') return false;

    const matchesSearch = !searchTerm ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

    const subStatus = user.subscription?.status || 'none';
    const matchesStatus = filterStatus === 'all' || subStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Get subscription status badge
  function getStatusBadge(subscription) {
    const status = subscription?.status || 'none';
    switch (status) {
      case 'active':
        return <span className="badge bg-success-600">Active</span>;
      case 'trialing':
        return <span className="badge bg-info-600">Trial</span>;
      case 'canceled':
        return <span className="badge bg-warning-600">Canceled</span>;
      case 'past_due':
        return <span className="badge bg-danger-600">Past Due</span>;
      case 'expired':
        return <span className="badge bg-secondary-600">Expired</span>;
      default:
        return <span className="badge bg-neutral-400">No Subscription</span>;
    }
  }

  // Check if trial is expired
  function isTrialExpired(subscription) {
    if (subscription?.status !== 'trialing') return false;
    if (!subscription?.trialEndDate) return true;
    const endDate = subscription.trialEndDate.toDate ? subscription.trialEndDate.toDate() : new Date(subscription.trialEndDate);
    return new Date() > endDate;
  }

  // Get trial days remaining
  function getTrialDaysRemaining(subscription) {
    if (!subscription?.trialEndDate) return 0;
    const endDate = subscription.trialEndDate.toDate ? subscription.trialEndDate.toDate() : new Date(subscription.trialEndDate);
    const remaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
    return remaining > 0 ? remaining : 0;
  }

  // Format date
  function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Open modal for action
  function openModal(user, action) {
    setSelectedUser(user);
    setModalAction(action);
    setExtendDays(7);
    setShowModal(true);
  }

  // Grant subscription manually
  async function handleGrantSubscription(plan, durationDays) {
    if (!selectedUser) return;

    setUpdating(selectedUser.id);
    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const subscriptionData = {
        status: plan === 'trial' ? 'trialing' : 'active',
        plan: plan === 'trial' ? null : plan,
        grantedByAdmin: true,
        grantedAt: serverTimestamp(),
      };

      if (plan === 'trial') {
        subscriptionData.trialStartDate = now;
        subscriptionData.trialEndDate = endDate;
      } else {
        subscriptionData.currentPeriodEnd = endDate;
      }

      await updateDoc(doc(db, 'users', selectedUser.id), {
        subscription: subscriptionData,
        updatedAt: serverTimestamp(),
      });

      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, subscription: { ...subscriptionData, currentPeriodEnd: endDate, trialEndDate: plan === 'trial' ? endDate : null } }
          : u
      ));

      setShowModal(false);
      setSelectedUser(null);
    } catch (e) {
      console.error('Error granting subscription:', e);
      alert('Failed to grant subscription: ' + e.message);
    } finally {
      setUpdating(null);
    }
  }

  // Revoke/End subscription or trial
  async function handleRevokeSubscription() {
    if (!selectedUser) return;

    setUpdating(selectedUser.id);
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        subscription: {
          status: 'expired',
          revokedByAdmin: true,
          revokedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, subscription: { status: 'expired', revokedByAdmin: true } }
          : u
      ));

      setShowModal(false);
      setSelectedUser(null);
    } catch (e) {
      console.error('Error revoking subscription:', e);
      alert('Failed to revoke subscription: ' + e.message);
    } finally {
      setUpdating(null);
    }
  }

  // Extend trial
  async function handleExtendTrial() {
    if (!selectedUser || !extendDays) return;

    setUpdating(selectedUser.id);
    try {
      const currentEndDate = selectedUser.subscription?.trialEndDate?.toDate
        ? selectedUser.subscription.trialEndDate.toDate()
        : new Date(selectedUser.subscription?.trialEndDate || new Date());

      // If trial already expired, start from today
      const baseDate = currentEndDate < new Date() ? new Date() : currentEndDate;
      const newEndDate = new Date(baseDate);
      newEndDate.setDate(newEndDate.getDate() + parseInt(extendDays));

      await updateDoc(doc(db, 'users', selectedUser.id), {
        'subscription.trialEndDate': newEndDate,
        'subscription.status': 'trialing',
        'subscription.extendedByAdmin': true,
        'subscription.extendedAt': serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, subscription: { ...u.subscription, trialEndDate: newEndDate, status: 'trialing' } }
          : u
      ));

      setShowModal(false);
      setSelectedUser(null);
    } catch (e) {
      console.error('Error extending trial:', e);
      alert('Failed to extend trial: ' + e.message);
    } finally {
      setUpdating(null);
    }
  }

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Stats
  const activeCount = users.filter(u => u.account_type === 'user' && u.subscription?.status === 'active').length;
  const trialingCount = users.filter(u => u.account_type === 'user' && u.subscription?.status === 'trialing').length;
  const expiredCount = users.filter(u => u.account_type === 'user' && u.subscription?.status === 'expired').length;
  const canceledCount = users.filter(u => u.account_type === 'user' && u.subscription?.status === 'canceled').length;
  const noSubCount = users.filter(u => u.account_type === 'user' && !u.subscription?.status).length;

  return (
    <MasterLayout>
      {/* Breadcrumb */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h6 className="fw-semibold mb-0">
          <Icon icon="mdi:credit-card-check" className="me-2" />
          Super Admin - Subscription Management
        </h6>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <a href="/admin/users" className="d-flex align-items-center gap-1 hover-text-primary">
              <Icon icon="mdi:shield-account" />
              User Management
            </a>
          </li>
          <li>-</li>
          <li className="fw-medium">Subscriptions</li>
        </ul>
      </div>

      {/* Stats Cards */}
      <div className="row mb-24">
        <div className="col-6 col-lg">
          <div className="card p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 rounded bg-success-100">
                <Icon icon="mdi:check-circle" className="text-success-600 text-2xl" />
              </div>
              <div>
                <h6 className="mb-0">{activeCount}</h6>
                <small className="text-muted">Active</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg">
          <div className="card p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 rounded bg-info-100">
                <Icon icon="mdi:clock-start" className="text-info-600 text-2xl" />
              </div>
              <div>
                <h6 className="mb-0">{trialingCount}</h6>
                <small className="text-muted">Trial</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg">
          <div className="card p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 rounded bg-warning-100">
                <Icon icon="mdi:cancel" className="text-warning-600 text-2xl" />
              </div>
              <div>
                <h6 className="mb-0">{canceledCount}</h6>
                <small className="text-muted">Canceled</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg">
          <div className="card p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 rounded bg-danger-100">
                <Icon icon="mdi:clock-alert" className="text-danger-600 text-2xl" />
              </div>
              <div>
                <h6 className="mb-0">{expiredCount}</h6>
                <small className="text-muted">Expired</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg">
          <div className="card p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 rounded bg-neutral-100">
                <Icon icon="mdi:account-off" className="text-neutral-600 text-2xl" />
              </div>
              <div>
                <h6 className="mb-0">{noSubCount}</h6>
                <small className="text-muted">No Subscription</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="card">
        <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3">
          <h5 className="mb-0">User Subscriptions</h5>
          <div className="d-flex flex-wrap gap-3">
            {/* Search */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ minWidth: '250px' }}
              />
              <Icon
                icon="ion:search-outline"
                className="position-absolute top-50 translate-middle-y ms-3 text-muted"
              />
            </div>

            {/* Filter */}
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trialing">Trial</option>
              <option value="canceled">Canceled</option>
              <option value="expired">Expired</option>
              <option value="none">No Subscription</option>
            </select>

            {/* Refresh */}
            <button
              className="btn btn-outline-primary"
              onClick={loadUsers}
              disabled={loading}
            >
              <Icon icon="mdi:refresh" className="me-1" />
              Refresh
            </button>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-5">
              <Icon icon="mdi:credit-card-off" className="text-muted text-5xl mb-3" />
              <p className="text-muted">No users found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Plan</th>
                    <th>Expires</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: '40px',
                              height: '40px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            }}
                          >
                            <Icon icon="mdi:account" className="text-white text-xl" />
                          </div>
                          <div>
                            <p className="mb-0 fw-medium">{user.displayName || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td>{user.email || '-'}</td>
                      <td>
                        {getStatusBadge(user.subscription)}
                        {user.subscription?.status === 'trialing' && !isTrialExpired(user.subscription) && (
                          <small className="d-block text-muted">{getTrialDaysRemaining(user.subscription)} days left</small>
                        )}
                        {user.subscription?.status === 'trialing' && isTrialExpired(user.subscription) && (
                          <small className="d-block text-danger">Expired</small>
                        )}
                      </td>
                      <td>
                        {user.subscription?.plan ? (
                          <span className="text-capitalize">{user.subscription.plan}</span>
                        ) : user.subscription?.status === 'trialing' ? 'Trial' : '-'}
                      </td>
                      <td>{formatDate(user.subscription?.currentPeriodEnd || user.subscription?.trialEndDate)}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          {/* Grant Subscription - always available */}
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => openModal(user, 'grant')}
                            disabled={updating === user.id}
                            title="Grant Subscription"
                          >
                            <Icon icon="mdi:gift" />
                          </button>

                          {/* Extend Trial - only for trialing users */}
                          {user.subscription?.status === 'trialing' && (
                            <button
                              className="btn btn-sm btn-outline-info"
                              onClick={() => openModal(user, 'extend')}
                              disabled={updating === user.id}
                              title="Extend Trial"
                            >
                              <Icon icon="mdi:clock-plus" />
                            </button>
                          )}

                          {/* End Trial - only for trialing users */}
                          {user.subscription?.status === 'trialing' && (
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => openModal(user, 'end_trial')}
                              disabled={updating === user.id}
                              title="End Trial"
                            >
                              <Icon icon="mdi:clock-remove" />
                            </button>
                          )}

                          {/* Revoke - for active subscriptions */}
                          {user.subscription?.status === 'active' && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => openModal(user, 'revoke')}
                              disabled={updating === user.id}
                              title="Revoke Subscription"
                            >
                              <Icon icon="mdi:cancel" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showModal && selectedUser && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalAction === 'grant' && (
                    <>
                      <Icon icon="mdi:gift" className="me-2 text-success" />
                      Grant Subscription
                    </>
                  )}
                  {modalAction === 'revoke' && (
                    <>
                      <Icon icon="mdi:cancel" className="me-2 text-danger" />
                      Revoke Subscription
                    </>
                  )}
                  {modalAction === 'extend' && (
                    <>
                      <Icon icon="mdi:clock-plus" className="me-2 text-info" />
                      Extend Trial
                    </>
                  )}
                  {modalAction === 'end_trial' && (
                    <>
                      <Icon icon="mdi:clock-remove" className="me-2 text-warning" />
                      End Trial
                    </>
                  )}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="bg-light p-3 rounded mb-3">
                  <p className="mb-1"><strong>User:</strong> {selectedUser.displayName || '-'}</p>
                  <p className="mb-1"><strong>Email:</strong> {selectedUser.email || '-'}</p>
                  <p className="mb-0"><strong>Current Status:</strong> {selectedUser.subscription?.status || 'None'}</p>
                </div>

                {/* Grant Subscription */}
                {modalAction === 'grant' && (
                  <>
                    <p className="fw-medium mb-3">Select subscription to grant:</p>
                    <div className="d-grid gap-2">
                      <button
                        className="btn btn-success"
                        onClick={() => handleGrantSubscription('monthly', 30)}
                        disabled={updating}
                      >
                        <Icon icon="mdi:calendar-month" className="me-2" />
                        Monthly (30 days)
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleGrantSubscription('yearly', 365)}
                        disabled={updating}
                      >
                        <Icon icon="mdi:calendar" className="me-2" />
                        Yearly (365 days)
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => handleGrantSubscription('trial', 14)}
                        disabled={updating}
                      >
                        <Icon icon="mdi:clock-start" className="me-2" />
                        Trial (14 days)
                      </button>
                    </div>
                  </>
                )}

                {/* Extend Trial */}
                {modalAction === 'extend' && (
                  <>
                    <p className="fw-medium mb-3">How many days to add?</p>
                    <div className="mb-3">
                      <div className="d-flex gap-2 mb-3">
                        {[7, 14, 30].map(days => (
                          <button
                            key={days}
                            className={`btn ${extendDays === days ? 'btn-info' : 'btn-outline-info'} flex-fill`}
                            onClick={() => setExtendDays(days)}
                          >
                            {days} days
                          </button>
                        ))}
                      </div>
                      <div className="input-group">
                        <span className="input-group-text">Custom:</span>
                        <input
                          type="number"
                          className="form-control"
                          value={extendDays}
                          onChange={(e) => setExtendDays(e.target.value)}
                          min="1"
                          max="365"
                        />
                        <span className="input-group-text">days</span>
                      </div>
                    </div>
                    <div className="alert alert-info mb-0">
                      <Icon icon="mdi:information" className="me-2" />
                      Trial will be extended by <strong>{extendDays} days</strong> from the current end date.
                    </div>
                  </>
                )}

                {/* End Trial */}
                {modalAction === 'end_trial' && (
                  <div className="alert alert-warning">
                    <Icon icon="mdi:warning" className="me-2" />
                    This will immediately end the user's trial. They will lose access to premium features until they subscribe.
                  </div>
                )}

                {/* Revoke Subscription */}
                {modalAction === 'revoke' && (
                  <div className="alert alert-danger">
                    <Icon icon="mdi:warning" className="me-2" />
                    This will immediately revoke the user's subscription. They will lose access to premium features.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={updating}
                >
                  Cancel
                </button>

                {modalAction === 'extend' && (
                  <button
                    type="button"
                    className="btn btn-info"
                    onClick={handleExtendTrial}
                    disabled={updating || !extendDays}
                  >
                    {updating ? 'Extending...' : `Extend by ${extendDays} Days`}
                  </button>
                )}

                {modalAction === 'end_trial' && (
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleRevokeSubscription}
                    disabled={updating}
                  >
                    {updating ? 'Ending...' : 'End Trial Now'}
                  </button>
                )}

                {modalAction === 'revoke' && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleRevokeSubscription}
                    disabled={updating}
                  >
                    {updating ? 'Revoking...' : 'Revoke Subscription'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </MasterLayout>
  );
}
