import React from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

const PrivacyPage = () => {
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
          <h2 className='fw-bold mb-4' style={{ color: '#2d3748' }}>Privacy Policy</h2>
          <p className='text-muted mb-4'>Last updated: April 2026</p>

          <div className='privacy-content' style={{ color: '#4a5568', lineHeight: '1.8' }}>
            <h5 className='fw-bold mt-4 mb-3'>1. Introduction</h5>
            <p>
              RideWatch ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when you use our school bus tracking
              platform and mobile applications.
            </p>

            <h5 className='fw-bold mt-4 mb-3'>2. Information We Collect</h5>
            <p><strong>Personal Information:</strong></p>
            <ul>
              <li>Name and contact information (email, phone number)</li>
              <li>Account credentials</li>
              <li>Student information (names, school, grade)</li>
              <li>Emergency contact information</li>
            </ul>
            <p><strong>Location Data:</strong></p>
            <ul>
              <li>Real-time GPS location of buses (for drivers)</li>
              <li>Route history and tracking data</li>
              <li>Pick-up and drop-off locations</li>
            </ul>
            <p><strong>Device Information:</strong></p>
            <ul>
              <li>Device type and operating system</li>
              <li>App usage data and analytics</li>
              <li>Push notification tokens</li>
            </ul>

            <h5 className='fw-bold mt-4 mb-3'>3. How We Use Your Information</h5>
            <p>We use the collected information to:</p>
            <ul>
              <li>Provide real-time bus tracking services</li>
              <li>Send notifications about bus arrivals and delays</li>
              <li>Manage driver routes and schedules</li>
              <li>Ensure student safety during transportation</li>
              <li>Improve our services and user experience</li>
              <li>Communicate important updates and alerts</li>
              <li>Process payments for premium features</li>
            </ul>

            <h5 className='fw-bold mt-4 mb-3'>4. Data Sharing and Disclosure</h5>
            <p>We may share your information with:</p>
            <ul>
              <li><strong>Schools:</strong> To facilitate coordination of transportation services</li>
              <li><strong>Bus Companies:</strong> To manage routes and driver assignments</li>
              <li><strong>Parents/Guardians:</strong> To provide tracking access for their children</li>
              <li><strong>Service Providers:</strong> Third-party services that help us operate (e.g., cloud hosting, analytics)</li>
            </ul>
            <p>
              We do NOT sell your personal information to third parties.
            </p>

            <h5 className='fw-bold mt-4 mb-3'>5. Data Security</h5>
            <p>
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul>
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure cloud infrastructure (Firebase/Google Cloud)</li>
              <li>Access controls and authentication</li>
              <li>Regular security audits and updates</li>
            </ul>

            <h5 className='fw-bold mt-4 mb-3'>6. Data Retention</h5>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide
              services. Location and tracking data is retained for operational purposes and may be archived
              for safety and compliance reasons.
            </p>

            <h5 className='fw-bold mt-4 mb-3'>7. Children's Privacy</h5>
            <p>
              Our Service involves tracking students for safety purposes. We collect only the minimum information
              necessary and with authorization from schools and parents. We do not knowingly collect personal
              information directly from children under 13 without parental consent.
            </p>

            <h5 className='fw-bold mt-4 mb-3'>8. Your Rights</h5>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>

            <h5 className='fw-bold mt-4 mb-3'>9. Third-Party Services</h5>
            <p>
              Our Service integrates with third-party services including:
            </p>
            <ul>
              <li>Google Maps for mapping and navigation</li>
              <li>Firebase for authentication and data storage</li>
              <li>Stripe for payment processing</li>
              <li>Apple/Google for push notifications</li>
            </ul>
            <p>
              These services have their own privacy policies governing their use of your data.
            </p>

            <h5 className='fw-bold mt-4 mb-3'>10. Changes to This Policy</h5>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes
              via email or through the app. The "Last updated" date at the top indicates when the policy was
              last revised.
            </p>

            <h5 className='fw-bold mt-4 mb-3'>11. Contact Us</h5>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> privacy@ridewatch.org<br />
              <strong>Support:</strong> support@ridewatch.org<br />
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

export default PrivacyPage;
