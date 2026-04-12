import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "./Toast";

const SignUpLayer = () => {
  const { register, completeRegistration } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Verification code state
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // Modal state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  function hasEdgeSpaces(str) {
    return str.length !== str.trim().length; // leading/trailing spaces present
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

      const result = await register({
        email: normalizedEmail,
        password, // do NOT trim; we already validated edges above
        displayName: displayName,
      });

      // Store verificationId and show verification code input
      setVerificationId(result.verificationId);
      setVerificationStep(true);
      toast.success("Verification code sent! Please check your email.");
    } catch (err) {
      setError(err?.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (verificationCode.length !== 6) {
        throw new Error("Please enter a valid 6-digit code.");
      }

      await completeRegistration(verificationId, verificationCode);

      toast.success("Registration successful! You can now sign in.");
      navigate("/sign-in", { replace: true });
    } catch (err) {
      setError(err?.message || "Verification failed");
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
              <h3 className='fw-bold mb-2' style={{ color: '#2d3748' }}>
                {verificationStep ? 'Verify Your Email' : 'Create Account'}
              </h3>
              <p className='text-muted'>
                {verificationStep
                  ? 'Enter the 6-digit code sent to your email'
                  : 'Join us today! Please fill in your details'}
              </p>
            </div>

            {!verificationStep ? (
            <form id='sign-up-form' onSubmit={handleSubmit}>
              {/* Full Name Input */}
              <div className='mb-3'>
                <label className='form-label fw-semibold' style={{ color: '#4a5568' }}>Full Name</label>
                <div className='position-relative'>
                  <span className='position-absolute top-50 translate-middle-y ms-3' style={{ zIndex: 10 }}>
                    <Icon icon='f7:person' style={{ fontSize: '20px', color: '#9ca3af' }} />
                  </span>
                  <input
                    type='text'
                    className='form-control ps-5 py-3'
                    placeholder='Enter your full name'
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
                    <button
                      type='button'
                      onClick={() => setShowTermsModal(true)}
                      className='btn btn-link p-0 text-decoration-none fw-semibold'
                      style={{ color: '#667eea', fontSize: '13px' }}
                    >
                      Terms & Conditions
                    </button>{' '}
                    and{' '}
                    <button
                      type='button'
                      onClick={() => setShowPrivacyModal(true)}
                      className='btn btn-link p-0 text-decoration-none fw-semibold'
                      style={{ color: '#667eea', fontSize: '13px' }}
                    >
                      Privacy Policy
                    </button>
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
            ) : (
            <form id='verification-form' onSubmit={handleVerifyCode}>
              {/* Verification Code Input */}
              <div className='mb-3'>
                <label className='form-label fw-semibold' style={{ color: '#4a5568' }}>Verification Code</label>
                <div className='position-relative'>
                  <span className='position-absolute top-50 translate-middle-y ms-3' style={{ zIndex: 10 }}>
                    <Icon icon='mdi:shield-key' style={{ fontSize: '20px', color: '#9ca3af' }} />
                  </span>
                  <input
                    type='text'
                    className='form-control ps-5 py-3 text-center'
                    placeholder='Enter 6-digit code'
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    autoFocus
                    style={{
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '24px',
                      letterSpacing: '8px',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <small className='text-muted d-block mt-2' style={{ fontSize: '12px' }}>
                  <Icon icon='ph:info' className='me-1' />
                  Check your email for the verification code
                </small>
              </div>

              {/* Error Message */}
              {error && (
                <div className='alert alert-danger rounded-3 py-2' role='alert' style={{ fontSize: '14px' }}>
                  <Icon icon='ph:warning-circle' className='me-2' />
                  {error}
                </div>
              )}

              {/* Verify Button */}
              <button
                type='submit'
                className='btn w-100 py-3 fw-semibold text-white mb-3'
                disabled={busy || verificationCode.length !== 6}
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
                    Verifying...
                  </>
                ) : (
                  <>
                    <Icon icon='mdi:check-circle' className='me-2' style={{ fontSize: '18px' }} />
                    Verify & Complete Registration
                  </>
                )}
              </button>

              {/* Back Link */}
              <div className='text-center mt-4'>
                <button
                  type='button'
                  className='btn btn-link text-decoration-none'
                  onClick={() => {
                    setVerificationStep(false);
                    setVerificationCode('');
                    setError('');
                  }}
                  style={{ color: '#667eea', fontSize: '14px' }}
                >
                  <Icon icon='mdi:arrow-left' className='me-1' />
                  Back to registration
                </button>
              </div>
            </form>
            )}
          </div>

          {/* Footer Text */}
          <p className='text-center text-muted mt-4' style={{ fontSize: '13px' }}>
            By creating an account, you agree to our{' '}
            <button
              type='button'
              onClick={() => setShowTermsModal(true)}
              className='btn btn-link p-0 text-decoration-none'
              style={{ color: '#667eea', fontSize: '13px' }}
            >
              Terms of Service
            </button>
            {' '}and{' '}
            <button
              type='button'
              onClick={() => setShowPrivacyModal(true)}
              className='btn btn-link p-0 text-decoration-none'
              style={{ color: '#667eea', fontSize: '13px' }}
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowTermsModal(false)}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: '16px', maxHeight: '80vh' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ color: '#2d3748' }}>
                  <Icon icon="mdi:file-document" className="me-2" style={{ color: '#667eea' }} />
                  Terms of Service
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowTermsModal(false)} />
              </div>
              <div className="modal-body" style={{ color: '#4a5568', lineHeight: '1.7' }}>
                <p className='text-muted mb-4'><small>Last updated: April 2026</small></p>

                <h6 className='fw-bold mt-3 mb-2'>1. Acceptance of Terms</h6>
                <p>By accessing or using the RideWatch platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.</p>

                <h6 className='fw-bold mt-3 mb-2'>2. Description of Service</h6>
                <p>RideWatch provides a school bus tracking and fleet management platform that enables:</p>
                <ul>
                  <li>Real-time GPS tracking of school buses</li>
                  <li>Driver management and route planning</li>
                  <li>Parent notifications and student tracking</li>
                  <li>Fleet administration and reporting</li>
                </ul>

                <h6 className='fw-bold mt-3 mb-2'>3. User Accounts</h6>
                <p>To use certain features of the Service, you must create an account. You are responsible for:</p>
                <ul>
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete information</li>
                  <li>Notifying us immediately of any unauthorized access</li>
                </ul>

                <h6 className='fw-bold mt-3 mb-2'>4. Acceptable Use</h6>
                <p>You agree not to:</p>
                <ul>
                  <li>Use the Service for any unlawful purpose</li>
                  <li>Share your account credentials with others</li>
                  <li>Attempt to gain unauthorized access to the Service</li>
                  <li>Interfere with or disrupt the Service</li>
                </ul>

                <h6 className='fw-bold mt-3 mb-2'>5. Subscription and Payments</h6>
                <p>Some features of the Service require a paid subscription. By subscribing, you agree to pay all applicable fees as described at the time of purchase and automatic renewal unless cancelled before the renewal date.</p>

                <h6 className='fw-bold mt-3 mb-2'>6. Disclaimer of Warranties</h6>
                <p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.</p>

                <h6 className='fw-bold mt-3 mb-2'>7. Limitation of Liability</h6>
                <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, RIDEWATCH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.</p>

                <h6 className='fw-bold mt-3 mb-2'>8. Contact Us</h6>
                <p>If you have questions about these Terms, please contact us at: <strong>support@ridewatch.org</strong></p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn px-4 py-2 fw-semibold text-white"
                  onClick={() => setShowTermsModal(false)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '10px'
                  }}
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowPrivacyModal(false)}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: '16px', maxHeight: '80vh' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ color: '#2d3748' }}>
                  <Icon icon="mdi:shield-lock" className="me-2" style={{ color: '#667eea' }} />
                  Privacy Policy
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowPrivacyModal(false)} />
              </div>
              <div className="modal-body" style={{ color: '#4a5568', lineHeight: '1.7' }}>
                <p className='text-muted mb-4'><small>Last updated: April 2026</small></p>

                <h6 className='fw-bold mt-3 mb-2'>1. Introduction</h6>
                <p>RideWatch ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our school bus tracking platform and mobile applications.</p>

                <h6 className='fw-bold mt-3 mb-2'>2. Information We Collect</h6>
                <p><strong>Personal Information:</strong></p>
                <ul>
                  <li>Name and contact information (email, phone number)</li>
                  <li>Account credentials</li>
                  <li>Student information (names, school, grade)</li>
                </ul>
                <p><strong>Location Data:</strong></p>
                <ul>
                  <li>Real-time GPS location of buses (for drivers)</li>
                  <li>Route history and tracking data</li>
                  <li>Pick-up and drop-off locations</li>
                </ul>

                <h6 className='fw-bold mt-3 mb-2'>3. How We Use Your Information</h6>
                <p>We use the collected information to:</p>
                <ul>
                  <li>Provide real-time bus tracking services</li>
                  <li>Send notifications about bus arrivals and delays</li>
                  <li>Manage driver routes and schedules</li>
                  <li>Ensure student safety during transportation</li>
                  <li>Improve our services and user experience</li>
                </ul>

                <h6 className='fw-bold mt-3 mb-2'>4. Data Sharing</h6>
                <p>We may share your information with:</p>
                <ul>
                  <li><strong>Schools:</strong> To facilitate coordination of transportation services</li>
                  <li><strong>Bus Companies:</strong> To manage routes and driver assignments</li>
                  <li><strong>Parents/Guardians:</strong> To provide tracking access for their children</li>
                </ul>
                <p><strong>We do NOT sell your personal information to third parties.</strong></p>

                <h6 className='fw-bold mt-3 mb-2'>5. Data Security</h6>
                <p>We implement industry-standard security measures including encryption of data in transit (HTTPS/TLS), secure cloud infrastructure, access controls, and regular security audits.</p>

                <h6 className='fw-bold mt-3 mb-2'>6. Your Rights</h6>
                <p>You have the right to access your personal information, correct inaccurate data, request deletion of your account and data, and opt-out of marketing communications.</p>

                <h6 className='fw-bold mt-3 mb-2'>7. Contact Us</h6>
                <p>If you have questions about this Privacy Policy, please contact us at: <strong>privacy@ridewatch.org</strong></p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn px-4 py-2 fw-semibold text-white"
                  onClick={() => setShowPrivacyModal(false)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '10px'
                  }}
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SignUpLayer;
