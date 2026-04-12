import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const ForgotPasswordLayer = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      await resetPassword(normalizedEmail);
      setSuccess(true);
    } catch (err) {
      // Firebase error codes
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err?.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

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
            Reset Your Password
          </h2>
          <p className='text-white opacity-90 fs-5 mb-5'>
            We'll help you get back into your account
          </p>

          {/* Feature Icons */}
          <div className='d-flex justify-content-center gap-4 mt-5'>
            <div className='text-center'>
              <div className='bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-2' style={{ width: '60px', height: '60px' }}>
                <Icon icon='mdi:email-fast' style={{ fontSize: '30px', color: 'white' }} />
              </div>
              <small className='text-white opacity-75'>Quick</small>
            </div>
            <div className='text-center'>
              <div className='bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-2' style={{ width: '60px', height: '60px' }}>
                <Icon icon='mdi:shield-lock' style={{ fontSize: '30px', color: 'white' }} />
              </div>
              <small className='text-white opacity-75'>Secure</small>
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

      {/* Right Side - Forgot Password Form */}
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
                  <h3 className='fw-bold mb-2' style={{ color: '#2d3748' }}>Forgot Password</h3>
                  <p className='text-muted'>
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Email Input */}
                  <div className='mb-4'>
                    <label className='form-label fw-semibold' style={{ color: '#4a5568' }}>Email Address</label>
                    <div className='position-relative'>
                      <span className='position-absolute top-50 translate-middle-y ms-3' style={{ zIndex: 10 }}>
                        <Icon icon='mage:email' style={{ fontSize: '20px', color: '#9ca3af' }} />
                      </span>
                      <input
                        type='email'
                        className='form-control ps-5 py-3'
                        placeholder='Enter your email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        Sending...
                      </>
                    ) : (
                      <>
                        <Icon icon='mdi:email-send' className='me-2' style={{ fontSize: '18px' }} />
                        Send Reset Link
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
                    <Icon icon='mdi:email-check' style={{ fontSize: '40px', color: 'white' }} />
                  </div>
                </div>
                <h3 className='fw-bold mb-3' style={{ color: '#2d3748' }}>Check Your Email</h3>
                <p className='text-muted mb-4'>
                  We've sent a password reset link to<br />
                  <strong style={{ color: '#667eea' }}>{email}</strong>
                </p>
                <p className='text-muted small mb-4'>
                  Didn't receive the email? Check your spam folder or try again.
                </p>

                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className='btn btn-outline-secondary mb-3 w-100 py-2'
                  style={{ borderRadius: '12px' }}
                >
                  <Icon icon='mdi:refresh' className='me-2' />
                  Try Different Email
                </button>

                <Link
                  to='/sign-in'
                  className='btn w-100 py-3 fw-semibold text-white'
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px'
                  }}
                >
                  <Icon icon='mdi:arrow-left' className='me-2' />
                  Back to Sign In
                </Link>
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

export default ForgotPasswordLayer;
