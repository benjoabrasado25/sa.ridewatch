import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider"; // relative import

const SignInLayer = () => {
  const { user, loading, login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  // If already logged in, bounce away from /sign-in
  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, redirectTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      await login(normalizedEmail, password);
      navigate(redirectTo, { replace: true }); // <-- redirect after success
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate(redirectTo, { replace: true }); // <-- redirect after success
    } catch (err) {
      setError(err?.message || "Google sign-in failed");
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
            <Icon icon='mdi:car-multiple' style={{
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
            Welcome Back
          </h2>
          <p className='text-white opacity-90 fs-5 mb-5'>
            Manage your transportation services with ease and efficiency
          </p>

          {/* Feature Icons */}
          <div className='d-flex justify-content-center gap-4 mt-5'>
            <div className='text-center'>
              <div className='bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-2' style={{ width: '60px', height: '60px' }}>
                <Icon icon='mdi:security' style={{ fontSize: '30px', color: 'white' }} />
              </div>
              <small className='text-white opacity-75'>Secure</small>
            </div>
            <div className='text-center'>
              <div className='bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-2' style={{ width: '60px', height: '60px' }}>
                <Icon icon='mdi:lightning-bolt' style={{ fontSize: '30px', color: 'white' }} />
              </div>
              <small className='text-white opacity-75'>Fast</small>
            </div>
            <div className='text-center'>
              <div className='bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-2' style={{ width: '60px', height: '60px' }}>
                <Icon icon='mdi:check-circle' style={{ fontSize: '30px', color: 'white' }} />
              </div>
              <small className='text-white opacity-75'>Reliable</small>
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

      {/* Right Side - Sign In Form */}
      <div className='auth-right-modern d-flex align-items-center justify-content-center p-4' style={{
        flex: 1,
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}>
        <div className='w-100' style={{ maxWidth: '480px' }}>
          <div className='bg-white rounded-4 shadow-lg p-5'>
            {/* Mobile Logo */}
            <div className='d-lg-none text-center mb-4'>
              <Icon icon='mdi:car-multiple' style={{ fontSize: '60px', color: '#667eea' }} />
              <h2 className='fw-bold mt-2' style={{ color: '#667eea' }}>RideWatch</h2>
            </div>

            <div className='text-center mb-4'>
              <h3 className='fw-bold mb-2' style={{ color: '#2d3748' }}>Sign In</h3>
              <p className='text-muted'>Welcome back! Please enter your credentials</p>
            </div>

            <form id='sign-in-form' onSubmit={handleSubmit}>
              {/* Email Input */}
              <div className='mb-3'>
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

              {/* Password Input */}
              <div className='mb-3'>
                <label className='form-label fw-semibold' style={{ color: '#4a5568' }}>Password</label>
                <div className='position-relative'>
                  <span className='position-absolute top-50 translate-middle-y ms-3' style={{ zIndex: 10 }}>
                    <Icon icon='solar:lock-password-outline' style={{ fontSize: '20px', color: '#9ca3af' }} />
                  </span>
                  <input
                    type='password'
                    className='form-control ps-5 py-3'
                    id='your-password'
                    placeholder='Enter your password'
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
                </div>
              </div>

              {/* Remember & Forgot Password */}
              <div className='d-flex justify-content-between align-items-center mb-4'>
                <div className='form-check'>
                  <input
                    className='form-check-input'
                    type='checkbox'
                    id='remeber'
                    style={{ cursor: 'pointer' }}
                  />
                  <label className='form-check-label' htmlFor='remeber' style={{ cursor: 'pointer', fontSize: '14px' }}>
                    Remember me
                  </label>
                </div>
                <Link
                  to='/forgot-password'
                  className='text-decoration-none fw-semibold'
                  style={{ color: '#667eea', fontSize: '14px' }}
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <div className='alert alert-danger rounded-3 py-2' role='alert' style={{ fontSize: '14px' }}>
                  <Icon icon='ph:warning-circle' className='me-2' />
                  {error}
                </div>
              )}

              {/* Sign In Button */}
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <Icon icon='ph:sign-in-bold' className='me-2' style={{ fontSize: '18px' }} />
                    Sign In
                  </>
                )}
              </button>

              {/* Divider */}
              <div className='position-relative text-center my-4'>
                <hr style={{ borderColor: '#e2e8f0' }} />
                <span
                  className='position-absolute top-50 start-50 translate-middle px-3 bg-white text-muted'
                  style={{ fontSize: '14px' }}
                >
                  Or continue with
                </span>
              </div>

              {/* Google Sign In */}
              <button
                type='button'
                onClick={handleGoogle}
                disabled={busy}
                className='btn w-100 py-3 fw-semibold d-flex align-items-center justify-content-center gap-2'
                style={{
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  color: '#4a5568',
                  fontSize: '15px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.backgroundColor = '#f7fafc';
                }}
                onMouseOut={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.backgroundColor = 'white';
                }}
              >
                <Icon icon='logos:google-icon' style={{ fontSize: '20px' }} />
                Sign in with Google
              </button>

              {/* Sign Up Link */}
              <div className='text-center mt-4'>
                <p className='mb-0 text-muted' style={{ fontSize: '14px' }}>
                  Don't have an account?{' '}
                  <Link
                    to='/sign-up'
                    className='text-decoration-none fw-bold'
                    style={{ color: '#667eea' }}
                  >
                    Sign Up
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Footer Text */}
          <p className='text-center text-muted mt-4' style={{ fontSize: '13px' }}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </section>
  );
};

export default SignInLayer;
