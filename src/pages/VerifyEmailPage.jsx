import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { useToast } from '../components/Toast';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        // Find user with this verification token
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('verificationToken', '==', token));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setStatus('error');
          setMessage('Invalid or expired verification link.');
          return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // Check if already verified
        if (userData.emailVerified) {
          setStatus('success');
          setMessage('Your email is already verified! You can now sign in.');
          setTimeout(() => navigate('/sign-in'), 3000);
          return;
        }

        // Check if token is expired
        const expiryDate = userData.verificationTokenExpiry?.toDate();
        if (expiryDate && expiryDate < new Date()) {
          setStatus('error');
          setMessage('This verification link has expired. Please request a new one.');
          return;
        }

        // Update user document to mark email as verified
        await updateDoc(doc(db, 'users', userDoc.id), {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
          updatedAt: serverTimestamp(),
        });

        setStatus('success');
        setMessage('Email verified successfully! Redirecting to sign in...');
        toast.success('Email verified successfully!');

        // Redirect to sign in after 3 seconds
        setTimeout(() => navigate('/sign-in'), 3000);
      } catch (error) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <div className="text-center" style={{ maxWidth: '500px', padding: '40px' }}>
        {status === 'verifying' && (
          <>
            <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h2 className="mb-3">Verifying Email</h2>
            <p className="text-muted">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                fill="currentColor"
                className="bi bi-check-circle-fill text-success"
                viewBox="0 0 16 16"
              >
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
              </svg>
            </div>
            <h2 className="mb-3 text-success">Email Verified!</h2>
            <p className="text-muted">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                fill="currentColor"
                className="bi bi-x-circle-fill text-danger"
                viewBox="0 0 16 16"
              >
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z" />
              </svg>
            </div>
            <h2 className="mb-3 text-danger">Verification Failed</h2>
            <p className="text-muted">{message}</p>
            <button
              className="btn btn-primary mt-3"
              onClick={() => navigate('/sign-in')}
            >
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
