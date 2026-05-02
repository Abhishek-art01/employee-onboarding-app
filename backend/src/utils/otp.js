/**
 * utils/otp.js — Secure OTP generation, storage, and email delivery.
 *
 * Flow:
 *  1. generateOTP()   — creates 6-digit OTP
 *  2. storeOTP()      — saves hashed OTP + expiry to DB
 *  3. sendOTPEmail()  — mails OTP via Nodemailer
 *  4. verifyOTP()     — compares hash, checks expiry, marks used
 */

const crypto       = require('crypto');
const nodemailer   = require('nodemailer');
const { query }    = require('./db');
const logger       = require('./logger');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES) || 10;

// ─── Nodemailer transporter ────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host  : process.env.SMTP_HOST || 'smtp.gmail.com',
  port  : parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth  : {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * generateOTP — cryptographically random 6-digit OTP
 */
const generateOTP = () => {
  return String(crypto.randomInt(100000, 999999));
};

/**
 * hashOTP — SHA-256 hash of OTP (never store plaintext)
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * storeOTP — upsert OTP record for a user/purpose pair
 */
const storeOTP = async (userId, purpose, otp) => {
  const hashedOtp = hashOTP(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await query(
    `INSERT INTO otp_tokens (user_id, purpose, otp_hash, expires_at, used, created_at)
     VALUES ($1, $2, $3, $4, false, NOW())
     ON CONFLICT (user_id, purpose)
     DO UPDATE SET otp_hash = $3, expires_at = $4, used = false, created_at = NOW()`,
    [userId, purpose, hashedOtp, expiresAt]
  );
};

/**
 * verifyOTP — check OTP hash, expiry, and mark as used
 * @returns {{ valid: boolean, message: string }}
 */
const verifyOTP = async (userId, purpose, otp) => {
  const result = await query(
    `SELECT * FROM otp_tokens
     WHERE user_id = $1 AND purpose = $2 AND used = false
     ORDER BY created_at DESC LIMIT 1`,
    [userId, purpose]
  );

  if (result.rows.length === 0) {
    return { valid: false, message: 'OTP not found or already used.' };
  }

  const record = result.rows[0];

  if (new Date() > new Date(record.expires_at)) {
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (hashOTP(otp) !== record.otp_hash) {
    return { valid: false, message: 'Invalid OTP.' };
  }

  // Mark as used
  await query(
    `UPDATE otp_tokens SET used = true, used_at = NOW() WHERE id = $1`,
    [record.id]
  );

  return { valid: true, message: 'OTP verified successfully.' };
};

/**
 * sendOTPEmail — dispatch OTP via email
 */
const sendOTPEmail = async (toEmail, otp, purpose = 'verification') => {
  const purposeLabel = {
    register     : 'Email Verification',
    login        : 'Login Verification',
    password_reset: 'Password Reset',
  }[purpose] || 'Verification';

  const mailOptions = {
    from   : process.env.SMTP_FROM || '"Onboarding System" <noreply@company.com>',
    to     : toEmail,
    subject: `Your ${purposeLabel} OTP — Employee Onboarding`,
    html   : `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px;">
        <h2 style="color:#1a3660;">Employee Onboarding System</h2>
        <p>Your One-Time Password for <strong>${purposeLabel}</strong> is:</p>
        <div style="background:#f4f6f9;border-radius:6px;padding:20px;text-align:center;margin:16px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#2e6da4;">${otp}</span>
        </div>
        <p style="color:#666;font-size:13px;">This OTP is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
        <p style="color:#666;font-size:13px;">Do not share this OTP with anyone. Our team will never ask for your OTP.</p>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0;">
        <p style="color:#999;font-size:11px;">If you did not request this, please ignore this email.</p>
      </div>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${toEmail} [${info.messageId}]`);
    return true;
  } catch (err) {
    logger.error(`Failed to send OTP email to ${toEmail}: ${err.message}`);
    // In dev, log the OTP to console instead of failing
    if (process.env.NODE_ENV !== 'production') {
      logger.warn(`[DEV] OTP for ${toEmail}: ${otp}`);
      return true;
    }
    throw err;
  }
};

module.exports = { generateOTP, storeOTP, verifyOTP, sendOTPEmail };
