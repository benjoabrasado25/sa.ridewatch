const express = require('express');
const path = require('path');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - only allow ridewatch.org and app.ridewatch.org
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://ridewatch.org',
      'https://www.ridewatch.org',
      'https://app.ridewatch.org'
    ];

    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
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

  // Resend configuration
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'RideWatch <noreply@ridewatch.org>';

  if (!RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const resend = new Resend(RESEND_API_KEY);

  // verificationToken is now the 6-digit code
  const verificationCode = verificationToken;
  const safeName = sanitizeHtml(displayName.trim());

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #2563eb, #1d4ed8); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to RideWatch!</h1>
      </div>
      <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hi ${safeName},</p>
        <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
          Thank you for creating a RideWatch account. To complete your registration, please enter this verification code:
        </p>
        <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f0f4ff; border-radius: 12px;">
          <p style="font-size: 14px; color: #374151; margin-bottom: 10px; font-weight: 600;">Your Verification Code</p>
          <p style="font-size: 48px; color: #2563eb; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
            ${verificationCode}
          </p>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px; text-align: center;">
          This code will expire in <strong>15 minutes</strong>.
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
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email.trim()],
      subject: 'Verify Your RideWatch Account',
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    return res.status(200).json({ success: true, message: 'Verification email sent', id: data.id });
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

  // Resend configuration
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'RideWatch <noreply@ridewatch.org>';

  if (!RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const resend = new Resend(RESEND_API_KEY);

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

  const htmlContent = `
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
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email.trim()],
      subject: `You've been invited to join ${safeSchoolName} on RideWatch`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send invitation email' });
    }

    return res.status(200).json({ success: true, message: 'Invitation email sent', id: data.id });
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

// Contact form endpoint (for marketing site)
app.post('/api/send-contact-email', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Resend configuration
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.CONTACT_EMAIL || 'support@ridewatch.org';
  const FROM_EMAIL = process.env.FROM_EMAIL || 'RideWatch <noreply@ridewatch.org>';

  if (!RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const resend = new Resend(RESEND_API_KEY);

  const safeName = sanitizeHtml(name.trim());
  const safeEmail = sanitizeHtml(email.trim());
  const safePhone = sanitizeHtml(phone?.trim() || '');
  const safeSubject = sanitizeHtml(subject.trim());
  const safeMessage = sanitizeHtml(message.trim());

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #2563eb, #1d4ed8); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151; width: 120px;">Name:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Email:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">
              <a href="mailto:${safeEmail}" style="color: #2563eb;">${safeEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Phone:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${safePhone || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Subject:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${safeSubject}</td>
          </tr>
        </table>
        <div style="margin-top: 20px;">
          <h3 style="color: #374151; margin-bottom: 10px;">Message:</h3>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; color: #1f2937; white-space: pre-wrap;">${safeMessage}</div>
        </div>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      replyTo: email.trim(),
      subject: `[RideWatch Contact] ${safeSubject}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send contact email' });
    }

    return res.status(200).json({ success: true, message: 'Contact email sent', id: data.id });
  } catch (error) {
    console.error('Error sending contact email:', error);
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
