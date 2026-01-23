import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { QRCodeCanvas } from 'qrcode.react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '../components/Toast';

const SchoolQRPage = () => {
  const { schoolId } = useParams();
  const toast = useToast();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        setLoading(true);
        const schoolDoc = await getDoc(doc(db, 'schools', schoolId));

        if (schoolDoc.exists()) {
          setSchool({ id: schoolDoc.id, ...schoolDoc.data() });
        } else {
          setError('School not found');
        }
      } catch (err) {
        console.error('Error fetching school:', err);
        setError('Failed to load school information');
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchSchool();
    }
  }, [schoolId]);

  const handleDownloadQR = () => {
    const canvas = document.getElementById('school-qr-code');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${school?.name || 'school'}-qr-code.png`;
      link.href = url;
      link.click();
    }
  };

  const copySchoolId = () => {
    navigator.clipboard.writeText(schoolId).then(() => {
      toast.success('School ID copied to clipboard!');
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles for loading screen */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          top: '-150px',
          right: '-150px'
        }}></div>
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          bottom: '-100px',
          left: '-100px'
        }}></div>

        <div style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Animated Logo */}
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 30px',
            position: 'relative'
          }}>
            {/* Outer spinning ring */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              border: '4px solid rgba(255,255,255,0.2)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            {/* Inner icon container */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon icon="mdi:bus-school" style={{ fontSize: '40px', color: 'white' }} />
            </div>
          </div>

          {/* Brand name */}
          <h2 style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '10px',
            letterSpacing: '1px'
          }}>RideWatch</h2>

          {/* Loading text */}
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '16px',
            margin: 0
          }}>Loading school information...</p>

          {/* Animated dots */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '20px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              background: 'white',
              borderRadius: '50%',
              animation: 'bounce 1.4s ease-in-out infinite',
              animationDelay: '0s'
            }}></div>
            <div style={{
              width: '10px',
              height: '10px',
              background: 'white',
              borderRadius: '50%',
              animation: 'bounce 1.4s ease-in-out infinite',
              animationDelay: '0.2s'
            }}></div>
            <div style={{
              width: '10px',
              height: '10px',
              background: 'white',
              borderRadius: '50%',
              animation: 'bounce 1.4s ease-in-out infinite',
              animationDelay: '0.4s'
            }}></div>
          </div>
        </div>

        {/* Keyframe animations */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Icon icon="mdi:alert-circle" style={{ fontSize: '80px', color: 'white' }} />
          <h3 style={{ color: 'white', marginTop: '20px' }}>{error || 'School not found'}</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '10px' }}>Please check the URL and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-page-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative circles */}
      <div className="decorative-circle" style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        top: '-150px',
        right: '-150px',
        zIndex: 0
      }}></div>
      <div className="decorative-circle" style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        bottom: '-100px',
        left: '-100px',
        zIndex: 0
      }}></div>

      <div className="qr-page-wrapper" style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div className="qr-card" style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          padding: '50px 40px'
        }}>
          {/* Header */}
          <div className="header-section" style={{ textAlign: 'center', marginBottom: '30px' }}>
            {/* Screen Icon - with gradient background */}
            <div className="school-icon-screen" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
              marginBottom: '20px'
            }}>
              <Icon icon="mdi:school" style={{ fontSize: '45px', color: 'white' }} />
            </div>
            {/* Print Icon - with border instead of gradient (borders print, backgrounds don't) */}
            <div className="school-icon-print" style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              border: '3px solid #667eea',
              marginBottom: '15px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              <Icon icon="mdi:school" style={{ fontSize: '35px', color: '#667eea' }} />
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#2d3748',
              marginBottom: '10px',
              lineHeight: '1.2'
            }}>{school.name}</h1>
            {school.address && (
              <p style={{
                color: '#718096',
                fontSize: '15px',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <Icon icon="mdi:map-marker" style={{ fontSize: '18px' }} />
                {school.address}
              </p>
            )}
          </div>

          {/* Description */}
          {school.description && (
            <div className="description-box" style={{
              backgroundColor: '#f7fafc',
              borderRadius: '12px',
              padding: '15px 20px',
              marginBottom: '25px',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{
                margin: 0,
                textAlign: 'center',
                color: '#4a5568',
                fontSize: '15px',
                lineHeight: '1.6'
              }}>
                {school.description}
              </p>
            </div>
          )}

          {/* QR Code */}
          <div className="qr-section" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div className="qr-code-container" style={{
              display: 'inline-block',
              padding: '15px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
              marginBottom: '10px'
            }}>
              <QRCodeCanvas
                id="school-qr-code"
                value={window.location.href}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="qr-instruction" style={{
              color: '#718096',
              fontSize: '13px',
              margin: '10px 0 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}>
              <Icon icon="mdi:information" style={{ fontSize: '14px' }} />
              Scan this QR Code in Ridewatch App to start tracking buses.
            </p>
          </div>

          {/* School ID Section */}
          <div className="school-id-section" style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              textAlign: 'center',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '8px',
              fontSize: '13px'
            }}>
              School ID
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={schoolId}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  backgroundColor: '#f7fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px',
                  color: '#2d3748'
                }}
              />
              <button
                onClick={copySchoolId}
                style={{
                  minWidth: '40px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.borderColor = '#667eea'}
                onMouseOut={(e) => e.target.style.borderColor = '#e2e8f0'}
                title="Copy School ID"
              >
                <Icon icon="mdi:content-copy" style={{ fontSize: '18px', color: '#4a5568' }} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
            <button
              onClick={handleDownloadQR}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <Icon icon="mdi:download" style={{ fontSize: '20px' }} />
              Download QR Code
            </button>

            <button
              onClick={() => window.print()}
              style={{
                width: '100%',
                padding: '16px',
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#4a5568',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s'
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
              <Icon icon="mdi:printer" style={{ fontSize: '20px' }} />
              Print QR Code
            </button>
          </div>

          {/* Footer */}
          <div className="footer-section" style={{
            textAlign: 'center',
            paddingTop: '15px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <Icon icon="mdi:bus-school" style={{ fontSize: '20px', color: '#667eea' }} />
              <span style={{
                fontWeight: '600',
                color: '#667eea',
                fontSize: '16px'
              }}>RideWatch</span>
              <span style={{ color: '#a0aec0', fontSize: '12px', marginLeft: '5px' }}>
                — School Transportation Management
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global and Print Styles */}
      <style>{`
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.5in;
          }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide decorative circles */
          .decorative-circle {
            display: none !important;
          }
          /* Hide action buttons */
          .action-buttons {
            display: none !important;
          }
          /* Hide the screen icon (gradient won't print) */
          .school-icon-screen {
            display: none !important;
          }
          /* Show the print icon (uses border which DOES print) */
          .school-icon-print {
            display: flex !important;
          }
          /* Style the main container for print */
          .qr-page-container {
            background: white !important;
            padding: 0 !important;
            min-height: auto !important;
            display: block !important;
            height: auto !important;
            overflow: visible !important;
          }
          /* Style the wrapper */
          .qr-page-wrapper {
            max-width: 100% !important;
            margin: 0 !important;
          }
          /* Style the card for print - clean border, no shadow */
          .qr-card {
            box-shadow: none !important;
            border: 2px solid #333 !important;
            border-radius: 12px !important;
            padding: 30px 25px !important;
            page-break-inside: avoid !important;
          }
          /* Header section */
          .header-section {
            margin-bottom: 20px !important;
          }
          /* Title sizing for print */
          .qr-card h1 {
            font-size: 26px !important;
            margin-bottom: 8px !important;
            margin-top: 0 !important;
          }
          .qr-card p {
            font-size: 13px !important;
            margin-bottom: 8px !important;
            margin-top: 0 !important;
          }
          /* QR section */
          .qr-section {
            margin-bottom: 20px !important;
          }
          /* QR code size for print */
          #school-qr-code {
            width: 180px !important;
            height: 180px !important;
          }
          /* QR container */
          .qr-code-container {
            padding: 12px !important;
            margin-bottom: 8px !important;
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
          /* QR instruction */
          .qr-instruction {
            font-size: 12px !important;
            margin-top: 8px !important;
          }
          /* Hide copy button in print */
          button[title="Copy School ID"] {
            display: none !important;
          }
          /* School ID section */
          .school-id-section {
            margin-bottom: 20px !important;
          }
          .school-id-section label {
            font-size: 13px !important;
            margin-bottom: 6px !important;
          }
          .qr-card input[readonly] {
            padding: 10px !important;
            font-size: 12px !important;
            border-radius: 6px !important;
          }
          /* Footer */
          .footer-section {
            padding-top: 15px !important;
            margin-top: 0 !important;
            border-top: 1px solid #ccc !important;
          }
          .footer-section span {
            font-size: 14px !important;
          }
          /* Description box */
          .description-box {
            padding: 12px 15px !important;
            margin-bottom: 20px !important;
          }
          .description-box p {
            font-size: 12px !important;
            line-height: 1.5 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SchoolQRPage;
