// /src/pages/SuperAdminUsersPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import { collection, query, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import MasterLayout from '../masterLayout/MasterLayout';
import { useAuth } from '../auth/AuthProvider';

export default function SuperAdminUsersPage() {
  const { loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, bus_company, driver, user
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const PAGE_SIZE = 20;

  // Load users
  const loadUsers = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (!reset && lastDoc) {
        q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(q);
      const newUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (reset) {
        setUsers(newUsers);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
      }

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  }, [lastDoc]);

  useEffect(() => {
    loadUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter users based on search and type
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || user.account_type === filterType;

    return matchesSearch && matchesType;
  });

  // Confirm delete
  function confirmDelete(user) {
    setUserToDelete(user);
    setShowDeleteModal(true);
  }

  // Delete user (from both Firebase Auth and Firestore)
  async function handleDelete() {
    if (!userToDelete) return;

    setDeleting(userToDelete.id);
    try {
      // Get current user's ID token for authorization
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Not authenticated');
      }
      const token = await currentUser.getIdToken();

      // Call API to delete user from both Auth and Firestore
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${apiUrl}/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      // Remove from local state
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));

      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (e) {
      console.error('Error deleting user:', e);
      alert('Failed to delete user: ' + e.message);
    } finally {
      setDeleting(null);
    }
  }

  // Get badge color for account type
  function getTypeBadge(type) {
    switch (type) {
      case 'bus_company':
        return <span className="badge bg-primary-600">Bus Company</span>;
      case 'driver':
        return <span className="badge bg-success-600">Driver</span>;
      case 'user':
        return <span className="badge bg-info-600">Parent/User</span>;
      case 'super_admin':
        return <span className="badge bg-danger-600">Super Admin</span>;
      default:
        return <span className="badge bg-secondary-600">{type || 'Unknown'}</span>;
    }
  }

  // Format date
  function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <MasterLayout>
      {/* Breadcrumb */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h6 className="fw-semibold mb-0">
          <Icon icon="mdi:shield-account" className="me-2" />
          Super Admin - User Management
        </h6>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <a href="/" className="d-flex align-items-center gap-1 hover-text-primary">
              <Icon icon="solar:home-smile-angle-outline" />
              Dashboard
            </a>
          </li>
          <li>-</li>
          <li className="fw-medium">User Management</li>
        </ul>
      </div>

      {/* Stats Cards */}
      <div className="row mb-24">
        <div className="col-md-3">
          <div className="card p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 rounded bg-primary-100">
                <Icon icon="mdi:account-group" className="text-primary-600 text-2xl" />
              </div>
              <div>
                <h6 className="mb-0">{users.length}</h6>
                <small className="text-muted">Total Users</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 rounded bg-success-100">
                <Icon icon="mdi:bus" className="text-success-600 text-2xl" />
              </div>
              <div>
                <h6 className="mb-0">{users.filter(u => u.account_type === 'bus_company').length}</h6>
                <small className="text-muted">Bus Companies</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 rounded bg-info-100">
                <Icon icon="mdi:steering" className="text-info-600 text-2xl" />
              </div>
              <div>
                <h6 className="mb-0">{users.filter(u => u.account_type === 'driver').length}</h6>
                <small className="text-muted">Drivers</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 rounded bg-warning-100">
                <Icon icon="mdi:account-child" className="text-warning-600 text-2xl" />
              </div>
              <div>
                <h6 className="mb-0">{users.filter(u => u.account_type === 'user').length}</h6>
                <small className="text-muted">Parents/Users</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="card">
        <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3">
          <h5 className="mb-0">All Users</h5>
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="all">All Types</option>
              <option value="bus_company">Bus Company</option>
              <option value="driver">Driver</option>
              <option value="user">Parent/User</option>
              <option value="super_admin">Super Admin</option>
            </select>

            {/* Refresh */}
            <button
              className="btn btn-outline-primary"
              onClick={() => loadUsers(true)}
              disabled={loading}
            >
              <Icon icon="mdi:refresh" className="me-1" />
              Refresh
            </button>
          </div>
        </div>

        <div className="card-body">
          {loading && users.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-5">
              <Icon icon="mdi:account-search" className="text-muted text-5xl mb-3" />
              <p className="text-muted">No users found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Created</th>
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
                              <small className="text-muted">{user.id.slice(0, 12)}...</small>
                            </div>
                          </div>
                        </td>
                        <td>{user.email || '-'}</td>
                        <td>{getTypeBadge(user.account_type)}</td>
                        <td>
                          {user.status === 'active' ? (
                            <span className="badge bg-success-100 text-success-600">Active</span>
                          ) : user.status === 'inactive' ? (
                            <span className="badge bg-danger-100 text-danger-600">Inactive</span>
                          ) : (
                            <span className="badge bg-secondary-100 text-secondary-600">{user.status || 'Unknown'}</span>
                          )}
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td className="text-center">
                          {/* Don't allow deleting super_admin */}
                          {user.role !== 'super_admin' && user.account_type !== 'super_admin' ? (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => confirmDelete(user)}
                              disabled={deleting === user.id}
                            >
                              {deleting === user.id ? (
                                <span className="spinner-border spinner-border-sm" />
                              ) : (
                                <Icon icon="mdi:delete" />
                              )}
                            </button>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-4">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => loadUsers(false)}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">
                  <Icon icon="mdi:alert" className="me-2" />
                  Confirm Delete
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this user?</p>
                <div className="bg-light p-3 rounded">
                  <p className="mb-1"><strong>Name:</strong> {userToDelete?.displayName || '-'}</p>
                  <p className="mb-1"><strong>Email:</strong> {userToDelete?.email || '-'}</p>
                  <p className="mb-0"><strong>Type:</strong> {userToDelete?.account_type || '-'}</p>
                </div>
                <div className="alert alert-danger mt-3 mb-0">
                  <Icon icon="mdi:warning" className="me-2" />
                  <strong>Warning:</strong> This action is permanent and cannot be undone.
                  The user will be deleted from both Firebase Authentication and Firestore.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MasterLayout>
  );
}
