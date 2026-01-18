import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { QRCodeCanvas } from 'qrcode.react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const SchoolQRPage = () => {
  const { schoolId } = useParams();
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
      alert('School ID copied to clipboard!');
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border text-white" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ color: 'white', marginTop: '20px', fontSize: '16px' }}>Loading school information...</p>
        </div>
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
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div className="school-icon" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
              marginBottom: '20px'
            }}>
              <Icon icon="mdi:school" style={{ fontSize: '40px', color: 'white' }} />
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
                marginTop: '10px',
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
            <div style={{
              backgroundColor: '#f7fafc',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '30px'
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
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              display: 'inline-block',
              padding: '30px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              marginBottom: '15px'
            }}>
              <QRCodeCanvas
                id="school-qr-code"
                value={window.location.href}
                size={280}
                level="H"
                includeMargin={true}
              />
            </div>
            <p style={{
              color: '#718096',
              fontSize: '14px',
              margin: '15px 0 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <Icon icon="mdi:information" style={{ fontSize: '16px' }} />
              Scan this QR Code in Ridewatch App so you can start tracking buses.
            </p>
          </div>

          {/* School ID Section */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              textAlign: 'center',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '12px',
              fontSize: '14px'
            }}>
              School ID
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                readOnly
                value={schoolId}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  backgroundColor: '#f7fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  color: '#2d3748'
                }}
              />
              <button
                onClick={copySchoolId}
                style={{
                  minWidth: '50px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
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
                <Icon icon="mdi:content-copy" style={{ fontSize: '20px', color: '#4a5568' }} />
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
          <div style={{
            textAlign: 'center',
            paddingTop: '30px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <Icon icon="mdi:car-multiple" style={{ fontSize: '24px', color: '#667eea' }} />
              <span style={{
                fontWeight: '600',
                color: '#667eea',
                fontSize: '18px'
              }}>RideWatch</span>
            </div>
            <p style={{
              color: '#718096',
              fontSize: '13px',
              margin: 0
            }}>
              School Transportation Management System
            </p>
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
            margin: 0.75in;
          }
          html, body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide decorative circles */
          .decorative-circle {
            display: none !important;
          }
          /* Hide action buttons */
          .action-buttons {
            display: none !important;
          }
          /* Style the main container for print */
          .qr-page-container {
            background: white !important;
            padding: 0 !important;
            min-height: auto !important;
            display: block !important;
          }
          /* Style the wrapper */
          .qr-page-wrapper {
            max-width: 100% !important;
          }
          /* Style the card for print - clean border, no shadow */
          .qr-card {
            box-shadow: none !important;
            border: 2px solid #667eea !important;
            border-radius: 16px !important;
            padding: 40px 30px !important;
          }
          /* Ensure school icon prints with color */
          .school-icon {
            background: #667eea !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide copy button in print */
          button[title="Copy School ID"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SchoolQRPage;
