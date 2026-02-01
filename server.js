const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Sanitize HTML to prevent XSS
function sanitizeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Email verification endpoint
app.post('/api/send-verification-email', async (req, res) => {
  const { email, displayName, verificationToken } = req.body;

  // Validate required fields
  if (!email || !displayName || !verificationToken) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // SendGrid configuration
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ridewatch.org';
  const APP_URL = process.env.REACT_APP_PUBLIC_URL || 'https://app.ridewatch.org';

  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const verificationLink = `${APP_URL}/verify-email?token=${verificationToken}`;
  const safeName = sanitizeHtml(displayName.trim());

  const emailContent = {
    personalizations: [
      {
        to: [{ email: email.trim() }],
        subject: 'Verify Your RideWatch Account',
      },
    ],
    from: {
      email: FROM_EMAIL,
      name: 'RideWatch',
    },
    content: [
      {
        type: 'text/plain',
        value: `Hi ${safeName},

Welcome to RideWatch! Please verify your email address by clicking the link below:

${verificationLink}

This link will expire in 24 hours.

If you didn't create an account with RideWatch, please ignore this email.

Best regards,
The RideWatch Team`,
      },
      {
        type: 'text/html',
        value: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #2563eb, #1d4ed8); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to RideWatch!</h1>
            </div>
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hi ${safeName},</p>
              <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
                Thank you for creating a RideWatch account. To get started, please verify your email address by clicking the button below:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}"
                   style="background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
                <p style="font-size: 14px; color: #374151; margin-bottom: 15px; font-weight: bold;">
                  Or scan this QR code:
                </p>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationLink)}"
                     alt="QR Code for Email Verification"
                     style="width: 200px; height: 200px; margin: 0 auto; display: block;" />
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                This link will expire in 24 hours. If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; color: #2563eb; word-break: break-all; margin-top: 10px;">
                ${verificationLink}
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                If you didn't create an account with RideWatch, please ignore this email.
              </p>
            </div>
            <div style="background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 12px; color: #6b7280; margin: 0;">
                © ${new Date().getFullYear()} RideWatch. All rights reserved.
              </p>
            </div>
          </div>
        `,
      },
    ],
  };

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailContent),
    });

    if (response.ok || response.status === 202) {
      return res.status(200).json({ success: true, message: 'Verification email sent' });
    } else {
      const errorData = await response.text();
      console.error('SendGrid error:', errorData);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

// Driver invitation endpoint
app.post('/api/send-driver-invitation', async (req, res) => {
  const { email, schoolName, inviterName, invitationLink, expiresAt } = req.body;

  // Validate required fields
  if (!email || !schoolName || !inviterName || !invitationLink) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // SendGrid configuration
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ridewatch.org';

  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const safeSchoolName = sanitizeHtml(schoolName.trim());
  const safeInviterName = sanitizeHtml(inviterName.trim());

  // Format expiration date
  let expirationText = 'in 7 days';
  if (expiresAt) {
    const expirationDate = new Date(expiresAt);
    expirationText = `on ${expirationDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}`;
  }

  const emailContent = {
    personalizations: [
      {
        to: [{ email: email.trim() }],
        subject: `You've been invited to join ${safeSchoolName} on RideWatch`,
      },
    ],
    from: {
      email: FROM_EMAIL,
      name: 'RideWatch',
    },
    content: [
      {
        type: 'text/plain',
        value: `Hi there,

${safeInviterName} has invited you to join ${safeSchoolName} as a driver on RideWatch.

Click the link below to accept the invitation and create your driver account:

${invitationLink}

This invitation will expire ${expirationText}.

If you have any questions, please contact ${safeSchoolName} directly.

Best regards,
The RideWatch Team`,
      },
      {
        type: 'text/html',
        value: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #2563eb, #1d4ed8); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Driver Invitation</h1>
            </div>
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hi there,</p>
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                <strong>${safeInviterName}</strong> has invited you to join <strong>${safeSchoolName}</strong> as a driver on RideWatch.
              </p>
              <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
                RideWatch helps schools track student transportation in real-time, ensuring safety and peace of mind for parents and administrators.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationLink}"
                   style="background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                  Accept Invitation
                </a>
              </div>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
                <p style="font-size: 14px; color: #374151; margin-bottom: 15px; font-weight: bold;">
                  Or scan this QR code:
                </p>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invitationLink)}"
                     alt="QR Code for Driver Invitation"
                     style="width: 200px; height: 200px; margin: 0 auto; display: block;" />
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                This invitation will expire ${expirationText}. If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; color: #2563eb; word-break: break-all; margin-top: 10px;">
                ${invitationLink}
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                If you have any questions about this invitation, please contact ${safeSchoolName} directly.
              </p>
            </div>
            <div style="background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 12px; color: #6b7280; margin: 0;">
                © ${new Date().getFullYear()} RideWatch. All rights reserved.
              </p>
            </div>
          </div>
        `,
      },
    ],
  };

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailContent),
    });

    if (response.ok || response.status === 202) {
      return res.status(200).json({ success: true, message: 'Invitation email sent' });
    } else {
      const errorData = await response.text();
      console.error('SendGrid error:', errorData);
      return res.status(500).json({ error: 'Failed to send invitation email' });
    }
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
