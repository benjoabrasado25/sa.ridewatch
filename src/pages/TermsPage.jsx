import React from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

const TermsPage = () => {
  return (
    <section className='min-vh-100' style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px'
      }}>
        <div className='container'>
          <div className='d-flex align-items-center justify-content-between'>
            <Link to='/sign-in' className='text-white text-decoration-none d-flex align-items-center'>
              <Icon icon='mdi:arrow-left' className='me-2' style={{ fontSize: '20px' }} />
              Back
            </Link>
            <div className='text-center'>
              <Icon icon='mdi:car-multiple' style={{ fontSize: '40px', color: 'white' }} />
              <h1 className='text-white fw-bold mb-0 mt-2' style={{ fontSize: '1.5rem' }}>RideWatch</h1>
            </div>
            <div style={{ width: '60px' }}></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='container py-5'>
        <div className='bg-white rounded-4 shadow-lg p-4 p-md-5' style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 className='fw-bold mb-4' style={{ color: '#2d3748' }}>Terms of Service</h2>
          <p className='text-muted mb-4'>Last updated: April 2026</p>

          <div className='terms-content' style={{ color: '#4a5568', lineHeight: '1.8' }}>
            <h5 className='fw-bold mt-4 mb-3'>1. Acceptance of Terms</h5>
            <p>
              By accessing or using the RideWatch platform ("Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our Service.
            </p>

            <h5 className='fw-bold mt-4 mb-3'>2. Description of Service</h5>
            <p>
              RideWatch provides a school bus tracking and fleet management platform that enables:
            </p>
            <ul>
              <li>Real-time GPS tracking of school buses</li>
              <li>Driver management and route planning</li>
              <li>Parent notifications and student tracking</li>
              <li>Fleet administration and reporting</li>
            </ul>

            <h5 className='fw-bold mt-4 mb-3'>3. User Accounts</h5>
            <p>
              To use certain features of the Service, you must create an account. You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>

            <h5 className='fw-bold mt-4 mb-3'>4. Acceptable Use</h5>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose</li>
              <li>Share your account credentials with others</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Upload malicious code or content</li>
            </ul>

            <h5 className='fw-bold mt-4 mb-3'>5. Privacy</h5>
            <p>
              Your use of the Service is also governed by our <Link to='/privacy' style={{ color: '#667eea' }}>Privacy Policy</Link>.
              Please review our Privacy Policy to understand our practices regarding personal information.
            </p>

            <h5 className='fw-bold mt-4 mb-3'>6. Subscription and Payments</h5>
            <p>
              Some features of the Service require a paid subscription. By subscribing, you agree to:
            </p>
            <ul>
              <li>Pay all applicable fees as described at the time of purchase</li>
              <li>Automatic renewal unless cancelled before the renewal date</li>
              <li>Provide valid payment information</li>
            </ul>

            <h5 className='fw-bold mt-4 mb-3'>7. Data and Content</h5>
            <p>
              You retain ownership of data you submit to the Service. By using the Service, you grant us a license to
              use, store, and process your data solely for the purpose of providing the Service.
            </p>

            <h5 className='fw-bold mt-4 mb-3'>8. Disclaimer of Warranties</h5>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE SERVICE
              WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>

            <h5 className='fw-bold mt-4 mb-3'>9. Limitation of Liability</h5>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, RIDEWATCH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
            </p>

            <h5 className='fw-bold mt-4 mb-3'>10. Changes to Terms</h5>
            <p>
              We may modify these Terms at any time. We will notify users of material changes via email or through
              the Service. Continued use after changes constitutes acceptance of the modified Terms.
            </p>

            <h5 className='fw-bold mt-4 mb-3'>11. Contact Us</h5>
            <p>
              If you have questions about these Terms, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> support@ridewatch.org<br />
              <strong>Website:</strong> <a href='https://ridewatch.org' style={{ color: '#667eea' }}>ridewatch.org</a>
            </p>
          </div>

          <div className='mt-5 pt-4 border-top'>
            <Link
              to='/sign-in'
              className='btn px-4 py-2 fw-semibold text-white'
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px'
              }}
            >
              <Icon icon='mdi:arrow-left' className='me-2' />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TermsPage;
