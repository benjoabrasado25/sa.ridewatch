import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../auth/AuthProvider';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const DashBoardLayerOne = () => {
  const { profile } = useAuth();
  const schoolId = profile?.current_school_id || null;

  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    totalRoutes: 0,
    schools: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      setStats({
        totalDrivers: 0,
        activeDrivers: 0,
        totalRoutes: 0,
        schools: 0,
      });
      return;
    }

    setLoading(true);
    const unsubscribers = [];
    let driversLoaded = false;
    let routesLoaded = false;

    const checkAllLoaded = () => {
      if (driversLoaded && routesLoaded) {
        setLoading(false);
      }
    };

    // Listen to drivers for this school
    const driversQuery = query(
      collection(db, 'users'),
      where('school_ids', 'array-contains', schoolId),
      where('account_type', '==', 'driver')
    );

    const unsubDrivers = onSnapshot(
      driversQuery,
      (snap) => {
        const drivers = snap.docs.map(d => d.data());
        const activeCount = drivers.filter(d => (d.status || 'active').toLowerCase() === 'active').length;

        setStats(prev => ({
          ...prev,
          totalDrivers: drivers.length,
          activeDrivers: activeCount,
        }));
        driversLoaded = true;
        checkAllLoaded();
      },
      (error) => {
        console.error('Error loading drivers:', error);
        driversLoaded = true;
        checkAllLoaded();
      }
    );
    unsubscribers.push(unsubDrivers);

    // Listen to routes for this school
    const routesQuery = query(
      collection(db, 'routes'),
      where('school_id', '==', schoolId)
    );

    const unsubRoutes = onSnapshot(
      routesQuery,
      (snap) => {
        setStats(prev => ({
          ...prev,
          totalRoutes: snap.docs.length,
        }));
        routesLoaded = true;
        checkAllLoaded();
      },
      (error) => {
        console.error('Error loading routes:', error);
        routesLoaded = true;
        checkAllLoaded();
      }
    );
    unsubscribers.push(unsubRoutes);

    return () => unsubscribers.forEach(unsub => unsub());
  }, [schoolId]);

  if (!schoolId) {
    return (
      <div className="text-center py-5">
        <Icon icon="mdi:school-outline" style={{ fontSize: '80px', color: '#9ca3af' }} />
        <h4 className="mt-4 mb-3">Welcome to RideWatch</h4>
        <p className="text-secondary mb-4">Get started by creating your first school to manage drivers and routes.</p>
        <Link to="/schools" className="btn btn-primary btn-lg">
          <Icon icon="mdi:plus-circle" className="me-2" />
          Create Your First School
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-secondary mt-3">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <>
      <div className="row gy-4">
        {/* Total Drivers */}
        <div className="col-xxl-3 col-sm-6">
          <div className="card h-100 radius-12 shadow-sm border-0">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}>
                  <Icon icon="mdi:account-group" style={{ fontSize: '28px', color: 'white' }} />
                </div>
              </div>
              <div>
                <h3 className="mb-1 fw-bold">{stats.totalDrivers}</h3>
                <p className="text-secondary mb-0" style={{ fontSize: '14px' }}>Total Drivers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Drivers */}
        <div className="col-xxl-3 col-sm-6">
          <div className="card h-100 radius-12 shadow-sm border-0">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  boxShadow: '0 4px 12px rgba(17, 153, 142, 0.3)'
                }}>
                  <Icon icon="mdi:account-check" style={{ fontSize: '28px', color: 'white' }} />
                </div>
              </div>
              <div>
                <h3 className="mb-1 fw-bold">{stats.activeDrivers}</h3>
                <p className="text-secondary mb-0" style={{ fontSize: '14px' }}>Active Drivers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Routes */}
        <div className="col-xxl-3 col-sm-6">
          <div className="card h-100 radius-12 shadow-sm border-0">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)'
                }}>
                  <Icon icon="mdi:routes" style={{ fontSize: '28px', color: 'white' }} />
                </div>
              </div>
              <div>
                <h3 className="mb-1 fw-bold">{stats.totalRoutes}</h3>
                <p className="text-secondary mb-0" style={{ fontSize: '14px' }}>Total Routes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inactive Drivers */}
        <div className="col-xxl-3 col-sm-6">
          <div className="card h-100 radius-12 shadow-sm border-0">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
                  boxShadow: '0 4px 12px rgba(255, 167, 38, 0.3)'
                }}>
                  <Icon icon="mdi:account-off" style={{ fontSize: '28px', color: 'white' }} />
                </div>
              </div>
              <div>
                <h3 className="mb-1 fw-bold">{stats.totalDrivers - stats.activeDrivers}</h3>
                <p className="text-secondary mb-0" style={{ fontSize: '14px' }}>Inactive Drivers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row gy-4 mt-3">
        <div className="col-12">
          <div className="card radius-12 shadow-sm">
            <div className="card-body">
              <h5 className="mb-4">Quick Actions</h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <Link to="/invite-driver" className="btn btn-outline-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2">
                    <Icon icon="mdi:account-plus" style={{ fontSize: '24px' }} />
                    <span>Invite Driver</span>
                  </Link>
                </div>
                <div className="col-md-4">
                  <Link to="/routes" className="btn btn-outline-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2">
                    <Icon icon="mdi:map-marker-path" style={{ fontSize: '24px' }} />
                    <span>Manage Routes</span>
                  </Link>
                </div>
                <div className="col-md-4">
                  <Link to="/schools" className="btn btn-outline-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2">
                    <Icon icon="mdi:school" style={{ fontSize: '24px' }} />
                    <span>View Schools</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DashBoardLayerOne