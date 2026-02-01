import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "./Toast";

const SignUpLayer = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function hasEdgeSpaces(str) {
    return str.length !== str.trim().length; // leading/trailing spaces present
  }

  async function afterSignUp(user) {
    // Note: User is already signed out by register() function
    // Show success message with email verification instructions
    toast.success("Registration successful! Please check your email to verify your account before signing in.");
    navigate("/sign-in", { replace: true });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Guard against passwords with accidental leading/trailing spaces
      if (hasEdgeSpaces(password)) {
        throw new Error(
          "Password cannot start or end with spaces. Please retype it."
        );
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      const user = await register({
        email: normalizedEmail,
        password, // do NOT trim; we already validated edges above
        displayName: displayName,
      });

      await afterSignUp(user);
    } catch (err) {
      setError(err?.message || "Sign up failed");
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
            <Icon icon='mdi:bus-multiple' style={{
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
            Join Us Today
          </h2>
          <p className='text-white opacity-90 fs-5 mb-5'>
            Start managing your transportation services efficiently
          </p>

          {/* Feature Icons */}
          <div className='d-flex justify-content-center gap-4 mt-5'>
            <div className='text-center'>
              <div className='bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-2' style={{ width: '60px', height: '60px' }}>
                <Icon icon='mdi:clock-fast' style={{ fontSize: '30px', color: 'white' }} />
              </div>
              <small className='text-white opacity-75'>Quick Setup</small>
            </div>
            <div className='text-center'>
              <div className='bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-2' style={{ width: '60px', height: '60px' }}>
                <Icon icon='mdi:shield-check' style={{ fontSize: '30px', color: 'white' }} />
              </div>
              <small className='text-white opacity-75'>Protected</small>
            </div>
            <div className='text-center'>
              <div className='bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-2' style={{ width: '60px', height: '60px' }}>
                <Icon icon='mdi:star' style={{ fontSize: '30px', color: 'white' }} />
              </div>
              <small className='text-white opacity-75'>Trusted</small>
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

      {/* Right Side - Sign Up Form */}
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
              <h3 className='fw-bold mb-2' style={{ color: '#2d3748' }}>Create Account</h3>
              <p className='text-muted'>Join us today! Please fill in your details</p>
            </div>

            <form id='sign-up-form' onSubmit={handleSubmit}>
              {/* Username Input */}
              <div className='mb-3'>
                <label className='form-label fw-semibold' style={{ color: '#4a5568' }}>Username</label>
                <div className='position-relative'>
                  <span className='position-absolute top-50 translate-middle-y ms-3' style={{ zIndex: 10 }}>
                    <Icon icon='f7:person' style={{ fontSize: '20px', color: '#9ca3af' }} />
                  </span>
                  <input
                    type='text'
                    className='form-control ps-5 py-3'
                    placeholder='Enter your username'
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
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
                    placeholder='Create a password'
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
                <small className='text-muted' style={{ fontSize: '12px' }}>
                  <Icon icon='ph:info' className='me-1' />
                  Password must be at least 8 characters
                </small>
              </div>

              {/* Terms & Conditions */}
              <div className='mb-4'>
                <div className='form-check'>
                  <input
                    className='form-check-input'
                    type='checkbox'
                    id='condition'
                    required
                    style={{ cursor: 'pointer' }}
                  />
                  <label
                    className='form-check-label'
                    htmlFor='condition'
                    style={{ cursor: 'pointer', fontSize: '13px', lineHeight: '1.5' }}
                  >
                    I agree to the{' '}
                    <Link to='#' className='text-decoration-none fw-semibold' style={{ color: '#667eea' }}>
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to='#' className='text-decoration-none fw-semibold' style={{ color: '#667eea' }}>
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className='alert alert-danger rounded-3 py-2' role='alert' style={{ fontSize: '14px' }}>
                  <Icon icon='ph:warning-circle' className='me-2' />
                  {error}
                </div>
              )}

              {/* Sign Up Button */}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    <Icon icon='ph:user-plus-bold' className='me-2' style={{ fontSize: '18px' }} />
                    Create Account
                  </>
                )}
              </button>

              {/* Sign In Link */}
              <div className='text-center mt-4'>
                <p className='mb-0 text-muted' style={{ fontSize: '14px' }}>
                  Already have an account?{' '}
                  <Link
                    to='/sign-in'
                    className='text-decoration-none fw-bold'
                    style={{ color: '#667eea' }}
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Footer Text */}
          <p className='text-center text-muted mt-4' style={{ fontSize: '13px' }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </section>
  );
};

export default SignUpLayer;
