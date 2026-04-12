import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../lib/firebase';

const ResetPasswordLayer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);
  const [email, setEmail] = useState('');
  const [invalidCode, setInvalidCode] = useState(false);

  // Get the oobCode from URL
  const oobCode = searchParams.get('oobCode');

  // Verify the reset code on mount
  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setInvalidCode(true);
        setValidating(false);
        return;
      }

      try {
        // Verify the code and get the email
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setValidating(false);
      } catch (err) {
        console.error('Invalid or expired code:', err);
        setInvalidCode(true);
        setValidating(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Check for leading/trailing spaces
    if (password.length !== password.trim().length) {
      setError('Password cannot start or end with spaces.');
      return;
    }

    setBusy(true);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err) {
      console.error('Reset error:', err);
      if (err.code === 'auth/expired-action-code') {
        setError('This reset link has expired. Please request a new one.');
      } else if (err.code === 'auth/invalid-action-code') {
        setError('This reset link is invalid. Please request a new one.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError(err.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  // Loading state while validating code
  if (validating) {
    return (
      <section className='auth-modern d-flex flex-wrap min-vh-100'>
        <div className='w-100 d-flex align-items-center justify-content-center' style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
          <div className='text-center'>
            <div className='spinner-border text-primary mb-3' role='status' style={{ width: '3rem', height: '3rem' }}>
              <span className='visually-hidden'>Loading...</span>
            </div>
            <p className='text-muted'>Verifying reset link...</p>
          </div>
        </div>
      </section>
    );
  }

  // Invalid or expired code
  if (invalidCode) {
    return (
      <section className='auth-modern d-flex flex-wrap min-vh-100'>
        <div className='w-100 d-flex align-items-center justify-content-center p-4' style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
          <div className='w-100' style={{ maxWidth: '480px' }}>
            <div className='bg-white rounded-4 shadow-lg p-5 text-center'>
              <div className='mb-4'>
                <div className='rounded-circle d-inline-flex align-items-center justify-content-center' style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                }}>
                  <Icon icon='mdi:link-off' style={{ fontSize: '40px', color: 'white' }} />
                </div>
              </div>
              <h3 className='fw-bold mb-3' style={{ color: '#2d3748' }}>Invalid or Expired Link</h3>
              <p className='text-muted mb-4'>
                This password reset link is invalid or has expired. Please request a new password reset link.
              </p>
              <Link
                to='/forgot-password'
                className='btn w-100 py-3 fw-semibold text-white mb-3'
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px'
                }}
              >
                <Icon icon='mdi:email-send' className='me-2' />
                Request New Link
              </Link>
              <Link
                to='/sign-in'
                className='btn btn-link text-decoration-none'
                style={{ color: '#667eea', fontSize: '14px' }}
              >
                <Icon icon='mdi:arrow-left' className='me-1' />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='auth-modern d-flex flex-wrap min-vh-100'>
      {/* Left Side - Branding & Visual */}
      <div className='auth-left-modern d-lg-flex d-none flex-column justify-content-center align-items-center p-5' style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className='position-relative z-1 text-center w-100' style={{ maxWidth: '500px' }}>
          {/* Icon Illustration */}
          <div className='mb-5'>
            <Icon icon='mdi:lock-reset' style={{
              fontSize: '120px',
              color: 'white',
              filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))'
            }} />
          </div>

          {/* Branding */}
          <h1 className='text-white fw-bold mb-4' style={{ fontSize: '3rem' }}>
            RideWatch
          </h1>
          <h2 className='text-white fw-bold mb-3' style={{ fontSize: '1.8rem' }}>
            Create New Password
          </h2>
          <p className='text-white opacity-90 fs-5 mb-5'>
            Choose a strong password to secure your account
          </p>

          {/* Feature Icons */}
          <div className='d-flex justify-content-center gap-4 mt-5'>
            <div className='text-center'>
              <div className='bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-2' style={{ width: '60px', height: '60px' }}>
                <Icon icon='mdi:shield-check' style={{ fontSize: '30px', color: 'white' }} />
              </div>
              <small className='text-white opacity-75'>Secure</small>
            </div>
            <div className='text-center'>
              <div className='bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-2' style={{ width: '60px', height: '60px' }}>
                <Icon icon='mdi:lock' style={{ fontSize: '30px', color: 'white' }} />
              </div>
              <small className='text-white opacity-75'>Protected</small>
            </div>
            <div className='text-center'>
              <div className='bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-2' style={{ width: '60px', height: '60px' }}>
                <Icon icon='mdi:check-decagram' style={{ fontSize: '30px', color: 'white' }} />
              </div>
              <small className='text-white opacity-75'>Easy</small>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className='position-absolute' style={{
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          top: '-100px',
          right: '-100px',
          zIndex: 0
        }}></div>
        <div className='position-absolute' style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          bottom: '50px',
          left: '-50px',
          zIndex: 0
        }}></div>
      </div>

      {/* Right Side - Reset Password Form */}
      <div className='auth-right-modern d-flex align-items-center justify-content-center p-4' style={{
        flex: 1,
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}>
        <div className='w-100' style={{ maxWidth: '480px' }}>
          <div className='bg-white rounded-4 shadow-lg p-5'>
            {/* Mobile Logo */}
            <div className='d-lg-none text-center mb-4'>
              <Icon icon='mdi:lock-reset' style={{ fontSize: '60px', color: '#667eea' }} />
              <h2 className='fw-bold mt-2' style={{ color: '#667eea' }}>RideWatch</h2>
            </div>

            {!success ? (
              <>
                <div className='text-center mb-4'>
                  <h3 className='fw-bold mb-2' style={{ color: '#2d3748' }}>Reset Password</h3>
                  <p className='text-muted'>
                    Create a new password for<br />
                    <strong style={{ color: '#667eea' }}>{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* New Password Input */}
                  <div className='mb-3'>
                    <label className='form-label fw-semibold' style={{ color: '#4a5568' }}>New Password</label>
                    <div className='position-relative'>
                      <span className='position-absolute top-50 translate-middle-y ms-3' style={{ zIndex: 10 }}>
                        <Icon icon='solar:lock-password-outline' style={{ fontSize: '20px', color: '#9ca3af' }} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className='form-control ps-5 pe-5 py-3'
                        placeholder='Enter new password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '15px',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      />
                      <button
                        type='button'
                        className='btn position-absolute top-50 translate-middle-y end-0 me-2'
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ zIndex: 10 }}
                      >
                        <Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} style={{ fontSize: '20px', color: '#9ca3af' }} />
                      </button>
                    </div>
                    <small className='text-muted' style={{ fontSize: '12px' }}>
                      <Icon icon='ph:info' className='me-1' />
                      Password must be at least 8 characters
                    </small>
                  </div>

                  {/* Confirm Password Input */}
                  <div className='mb-4'>
                    <label className='form-label fw-semibold' style={{ color: '#4a5568' }}>Confirm Password</label>
                    <div className='position-relative'>
                      <span className='position-absolute top-50 translate-middle-y ms-3' style={{ zIndex: 10 }}>
                        <Icon icon='solar:lock-password-outline' style={{ fontSize: '20px', color: '#9ca3af' }} />
                      </span>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className='form-control ps-5 pe-5 py-3'
                        placeholder='Confirm new password'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '15px',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      />
                      <button
                        type='button'
                        className='btn position-absolute top-50 translate-middle-y end-0 me-2'
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ zIndex: 10 }}
                      >
                        <Icon icon={showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'} style={{ fontSize: '20px', color: '#9ca3af' }} />
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className='alert alert-danger rounded-3 py-2' role='alert' style={{ fontSize: '14px' }}>
                      <Icon icon='ph:warning-circle' className='me-2' />
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type='submit'
                    className='btn w-100 py-3 fw-semibold text-white mb-3'
                    disabled={busy}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    {busy ? (
                      <>
                        <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Icon icon='mdi:lock-check' className='me-2' style={{ fontSize: '18px' }} />
                        Reset Password
                      </>
                    )}
                  </button>

                  {/* Back to Sign In */}
                  <div className='text-center mt-4'>
                    <Link
                      to='/sign-in'
                      className='text-decoration-none fw-semibold d-inline-flex align-items-center'
                      style={{ color: '#667eea', fontSize: '14px' }}
                    >
                      <Icon icon='mdi:arrow-left' className='me-1' />
                      Back to Sign In
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              // Success State
              <div className='text-center'>
                <div className='mb-4'>
                  <div className='rounded-circle d-inline-flex align-items-center justify-content-center' style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  }}>
                    <Icon icon='mdi:check-bold' style={{ fontSize: '40px', color: 'white' }} />
                  </div>
                </div>
                <h3 className='fw-bold mb-3' style={{ color: '#2d3748' }}>Password Reset!</h3>
                <p className='text-muted mb-4'>
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>

                <button
                  onClick={() => navigate('/sign-in')}
                  className='btn w-100 py-3 fw-semibold text-white'
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px'
                  }}
                >
                  <Icon icon='ph:sign-in-bold' className='me-2' />
                  Sign In Now
                </button>
              </div>
            )}
          </div>

          {/* Footer Text */}
          <p className='text-center text-muted mt-4' style={{ fontSize: '13px' }}>
            Need help? Contact support at support@ridewatch.org
          </p>
        </div>
      </div>
    </section>
  );
};

export default ResetPasswordLayer;
