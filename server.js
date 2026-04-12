const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Resend } = require('resend');
const Stripe = require('stripe');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Option 1: Use FIREBASE_SERVICE_ACCOUNT env var (JSON string) - recommended for Railway
// Option 2: Use serviceAccountKey.json file (for local development)
if (!admin.apps.length) {
  try {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Parse from environment variable (Railway deployment)
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('Firebase Admin: Using credentials from environment variable');
    } else {
      // Fall back to local file (local development)
      serviceAccount = require('./serviceAccountKey.json');
      console.log('Firebase Admin: Using credentials from serviceAccountKey.json');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (e) {
    console.error('Firebase Admin initialization error:', e.message);
    console.error('For Railway: Set FIREBASE_SERVICE_ACCOUNT env var with your service account JSON');
    console.error('For local: Save serviceAccountKey.json in the project root');
  }
}

// Stripe Configuration - Toggle between sandbox and production
const STRIPE_MODE = process.env.STRIPE_MODE || 'sandbox'; // 'sandbox' or 'production'
const isProduction = STRIPE_MODE === 'production';

// Select keys based on mode
const STRIPE_SECRET_KEY = isProduction
  ? process.env.STRIPE_LIVE_SECRET_KEY
  : process.env.STRIPE_TEST_SECRET_KEY;

const STRIPE_PUBLISHABLE_KEY = isProduction
  ? process.env.STRIPE_LIVE_PUBLISHABLE_KEY
  : process.env.STRIPE_TEST_PUBLISHABLE_KEY;

const STRIPE_PRICES = {
  monthly: isProduction
    ? process.env.STRIPE_LIVE_MONTHLY_PRICE_ID
    : process.env.STRIPE_TEST_MONTHLY_PRICE_ID,
  yearly: isProduction
    ? process.env.STRIPE_LIVE_YEARLY_PRICE_ID
    : process.env.STRIPE_TEST_YEARLY_PRICE_ID,
};

const STRIPE_WEBHOOK_SECRET = isProduction
  ? process.env.STRIPE_LIVE_WEBHOOK_SECRET
  : process.env.STRIPE_TEST_WEBHOOK_SECRET;

// Initialize Stripe with selected key
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

console.log(`Stripe running in ${STRIPE_MODE.toUpperCase()} mode`);

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

// ============================================
// RATE LIMITING - Protect against bot attacks
// ============================================

// General API rate limit: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for email endpoints: 5 requests per 15 minutes per IP
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many email requests. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limit: 10 attempts per 15 minutes per IP (for password reset, etc.)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general limiter to all API routes
app.use('/api/', generalLimiter);

// Special handling for Stripe webhook (needs raw body)
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));

// JSON parsing for all other routes
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

// Email verification endpoint (strict rate limit)
app.post('/api/send-verification-email', emailLimiter, async (req, res) => {
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

// Driver invitation endpoint (strict rate limit)
app.post('/api/send-driver-invitation', emailLimiter, async (req, res) => {
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

// Password reset endpoint - sends branded email via Resend (auth rate limit)
app.post('/api/send-password-reset', authLimiter, async (req, res) => {
  const { email } = req.body;

  // Validate required fields
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    // Generate password reset link using Firebase Admin
    const actionCodeSettings = {
      url: 'https://app.ridewatch.org/reset-password',
      handleCodeInApp: true,
    };

    console.log('Generating password reset link for:', email.toLowerCase().trim());
    const firebaseResetLink = await admin.auth().generatePasswordResetLink(email.toLowerCase().trim(), actionCodeSettings);
    console.log('Reset link generated successfully');

    // Extract the oobCode from Firebase link and create our custom link
    const url = new URL(firebaseResetLink);
    const oobCode = url.searchParams.get('oobCode');
    const resetLink = `https://app.ridewatch.org/reset-password?oobCode=${oobCode}`;

    // Resend configuration
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'RideWatch <noreply@ridewatch.org>';

    if (!RESEND_API_KEY) {
      console.error('Resend API key not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const resend = new Resend(RESEND_API_KEY);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
        </div>
        <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hi there,</p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
            We received a request to reset the password for your RideWatch account. Click the button below to create a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px; text-align: center;">
            This link will expire in <strong>1 hour</strong> for security reasons.
          </p>
          <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #667eea; word-break: break-all; margin-top: 10px;">
              ${resetLink}
            </p>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
        <div style="background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 12px; color: #6b7280; margin: 0;">
            © ${new Date().getFullYear()} RideWatch. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email.trim()],
      subject: 'Reset Your RideWatch Password',
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send password reset email' });
    }

    return res.status(200).json({ success: true, message: 'Password reset email sent', id: data.id });
  } catch (error) {
    console.error('Error sending password reset email:', error.code, error.message);

    // Handle Firebase errors
    if (error.code === 'auth/user-not-found') {
      // For security, don't reveal if user exists or not
      return res.status(200).json({ success: true, message: 'If an account exists, a reset email has been sent' });
    }

    if (error.code === 'auth/invalid-continue-uri') {
      console.error('Invalid continue URI - check actionCodeSettings');
    }

    return res.status(500).json({ error: 'Failed to send password reset email: ' + error.message });
  }
});

// Contact form endpoint (for marketing site - strict rate limit)
app.post('/api/send-contact-email', emailLimiter, async (req, res) => {
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

// ============================================
// STRIPE SUBSCRIPTION ENDPOINTS
// ============================================

// Create Payment Sheet for in-app subscription
app.post('/api/create-payment-sheet', async (req, res) => {
  const { uid, email, displayName, plan } = req.body;

  if (!uid || !plan) {
    return res.status(400).json({ error: 'Missing required fields: uid and plan' });
  }

  if (!['monthly', 'yearly'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan. Must be "monthly" or "yearly"' });
  }

  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    let customerId = userData?.subscription?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || userData?.email,
        name: displayName || userData?.displayName,
        metadata: {
          firebaseUID: uid,
        },
      });
      customerId = customer.id;

      // Save customer ID to Firestore
      await db.collection('users').doc(uid).set({
        subscription: {
          stripeCustomerId: customerId,
        },
      }, { merge: true });
    }

    // Create ephemeral key for the customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    );

    // Create subscription with incomplete payment
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: STRIPE_PRICES[plan] }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        firebaseUID: uid,
        plan: plan,
      },
    });

    const paymentIntent = subscription.latest_invoice.payment_intent;

    return res.status(200).json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customerId,
      subscriptionId: subscription.id,
      publishableKey: STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    console.error('Error creating payment sheet:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Stripe Webhook Handler
app.post('/api/stripe-webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = admin.firestore();

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      await handleSubscriptionUpdate(db, subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await handleSubscriptionDeleted(db, subscription);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        await handleSubscriptionUpdate(db, subscription);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      await handlePaymentFailed(db, invoice);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Helper: Update subscription in Firestore
async function handleSubscriptionUpdate(db, subscription) {
  const customerId = subscription.customer;

  const usersSnapshot = await db
    .collection('users')
    .where('subscription.stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error('No user found for customer:', customerId);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const plan = subscription.metadata?.plan ||
    (subscription.items.data[0]?.price?.id === STRIPE_PRICES.yearly ? 'yearly' : 'monthly');

  let status;
  switch (subscription.status) {
    case 'active':
    case 'trialing':
      status = 'active';
      break;
    case 'past_due':
      status = 'past_due';
      break;
    case 'canceled':
    case 'unpaid':
      status = 'canceled';
      break;
    default:
      status = subscription.status;
  }

  await userDoc.ref.set({
    subscription: {
      status: status,
      stripeSubscriptionId: subscription.id,
      plan: plan,
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  }, { merge: true });

  console.log(`Updated subscription for user ${userDoc.id}: ${status}`);
}

// Helper: Handle subscription deletion
async function handleSubscriptionDeleted(db, subscription) {
  const customerId = subscription.customer;

  const usersSnapshot = await db
    .collection('users')
    .where('subscription.stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error('No user found for customer:', customerId);
    return;
  }

  const userDoc = usersSnapshot.docs[0];

  await userDoc.ref.set({
    subscription: {
      status: 'expired',
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  }, { merge: true });

  console.log(`Subscription expired for user ${userDoc.id}`);
}

// Helper: Handle payment failure
async function handlePaymentFailed(db, invoice) {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const customerId = subscription.customer;

  const usersSnapshot = await db
    .collection('users')
    .where('subscription.stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) return;

  const userDoc = usersSnapshot.docs[0];

  await userDoc.ref.set({
    subscription: {
      status: 'past_due',
    },
  }, { merge: true });

  console.log(`Payment failed for user ${userDoc.id}`);
}

// Cancel subscription endpoint
app.post('/api/cancel-subscription', async (req, res) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    const subscriptionId = userDoc.data()?.subscription?.stripeSubscriptionId;

    if (!subscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel at period end
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update Firestore
    await db.collection('users').doc(uid).set({
      subscription: {
        status: 'canceled',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
      },
    }, { merge: true });

    return res.status(200).json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAt: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Reactivate subscription endpoint
app.post('/api/reactivate-subscription', async (req, res) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    const subscriptionId = userDoc.data()?.subscription?.stripeSubscriptionId;

    if (!subscriptionId) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Remove cancellation
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    // Update Firestore
    await db.collection('users').doc(uid).set({
      subscription: {
        status: 'active',
        cancelAtPeriodEnd: false,
      },
    }, { merge: true });

    return res.status(200).json({ success: true, message: 'Subscription reactivated' });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================
// SUPER ADMIN ENDPOINTS
// ============================================

// Middleware to verify super admin
async function verifySuperAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists || userDoc.data()?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Super admin access required' });
    }

    req.callerUid = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Delete user (both Auth and Firestore)
app.delete('/api/admin/users/:uid', verifySuperAdmin, async (req, res) => {
  const { uid } = req.params;

  if (!uid) {
    return res.status(400).json({ error: 'Missing user uid' });
  }

  try {
    const db = admin.firestore();

    // Check if target user is super_admin (prevent deleting other super admins)
    const targetUserDoc = await db.collection('users').doc(uid).get();
    if (targetUserDoc.exists && targetUserDoc.data()?.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot delete super admin accounts' });
    }

    // Delete from Firebase Authentication
    try {
      await admin.auth().deleteUser(uid);
      console.log(`Deleted user from Firebase Auth: ${uid}`);
    } catch (authError) {
      // User might not exist in Auth (e.g., already deleted)
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
      console.log(`User not found in Firebase Auth: ${uid}`);
    }

    // Delete from Firestore
    await db.collection('users').doc(uid).delete();
    console.log(`Deleted user from Firestore: ${uid}`);

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================
// STATIC FILES
// ============================================

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
