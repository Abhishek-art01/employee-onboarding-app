/**
 * controllers/authController.js
 * register → sendOTP → verifyOTP → login → refreshToken → logout
 */
const { body }   = require('express-validator');
const User       = require('../models/User');
const { query }  = require('../utils/db');
const { generateOTP, storeOTP, verifyOTP, sendOTPEmail } = require('../utils/otp');
const logger     = require('../utils/logger');

/* ── Register ─────────────────────────────────────────────────── */
exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, department, role } = req.body;

    const existing = await User.findByEmail(email);
    if (existing) return res.status(409).json({ success:false, message:'Email already registered.' });

    // Only super_admin can create non-employee accounts via API
    const assignedRole = (req.user?.role === 'super_admin') ? (role || 'employee') : 'employee';

    const user = await User.create({ email, password, fullName, phone, department, role: assignedRole });

    // Send verification OTP
    const otp = generateOTP();
    await storeOTP(user.id, 'register', otp);
    await sendOTPEmail(email, otp, 'register');

    res.status(201).json({
      success : true,
      message : 'Registration successful. Please verify your email with the OTP sent.',
      userId  : user.id,
    });
  } catch(err) { next(err); }
};

/* ── Verify OTP (email verification) ─────────────────────────── */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    const result = await verifyOTP(userId, 'register', otp);
    if (!result.valid) return res.status(400).json({ success:false, message: result.message });

    await User.updateVerified(userId);
    res.json({ success:true, message:'Email verified. You can now log in.' });
  } catch(err) { next(err); }
};

/* ── Login ────────────────────────────────────────────────────── */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user || !(await User.verifyPassword(password, user.password_hash)))
      return res.status(401).json({ success:false, message:'Invalid email or password.' });

    if (!user.is_active)
      return res.status(403).json({ success:false, message:'Account deactivated. Contact HR.' });

    if (!user.is_verified)
      return res.status(403).json({ success:false, message:'Please verify your email first.' });

    // Send login OTP for 2FA
    const otp = generateOTP();
    await storeOTP(user.id, 'login', otp);
    await sendOTPEmail(email, otp, 'login');

    res.json({ success:true, message:'OTP sent to registered email.', userId: user.id });
  } catch(err) { next(err); }
};

/* ── Verify Login OTP (2FA) → issue JWT ─────────────────────── */
exports.verifyLoginOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    const result = await verifyOTP(userId, 'login', otp);
    if (!result.valid) return res.status(400).json({ success:false, message: result.message });

    const user         = await User.findById(userId);
    const token        = User.generateToken(user);
    const refreshToken = User.generateRefreshToken(user);

    // Store refresh token hash in DB
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)
       ON CONFLICT (user_id) DO UPDATE SET token_hash=$2, expires_at=$3`,
      [user.id, require('crypto').createHash('sha256').update(refreshToken).digest('hex'),
       new Date(Date.now() + 7*24*60*60*1000)]
    );

    res.json({
      success      : true,
      message      : 'Login successful.',
      token,
      refreshToken,
      user         : User.sanitize(user),
    });
  } catch(err) { next(err); }
};

/* ── Refresh Token ────────────────────────────────────────────── */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success:false, message:'Refresh token required.' });

    const jwt     = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh')
      return res.status(401).json({ success:false, message:'Invalid refresh token.' });

    const hash   = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
    const stored = await query(
      'SELECT * FROM refresh_tokens WHERE user_id=$1 AND token_hash=$2 AND expires_at>NOW()',
      [decoded.userId, hash]
    );
    if (!stored.rows.length)
      return res.status(401).json({ success:false, message:'Refresh token expired or revoked.' });

    const user     = await User.findById(decoded.userId);
    const newToken = User.generateToken(user);
    res.json({ success:true, token: newToken });
  } catch(err) { next(err); }
};

/* ── Forgot Password ──────────────────────────────────────────── */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    // Always return success to prevent email enumeration
    if (user && user.is_active) {
      const otp = generateOTP();
      await storeOTP(user.id, 'password_reset', otp);
      await sendOTPEmail(email, otp, 'password_reset');
    }
    res.json({ success:true, message:'If that email is registered, an OTP has been sent.' });
  } catch(err) { next(err); }
};

/* ── Reset Password ───────────────────────────────────────────── */
exports.resetPassword = async (req, res, next) => {
  try {
    const { userId, otp, newPassword } = req.body;
    const result = await verifyOTP(userId, 'password_reset', otp);
    if (!result.valid) return res.status(400).json({ success:false, message: result.message });

    await User.updatePassword(userId, newPassword);
    // Revoke all refresh tokens
    await query('DELETE FROM refresh_tokens WHERE user_id=$1', [userId]);
    res.json({ success:true, message:'Password reset successful. Please log in.' });
  } catch(err) { next(err); }
};

/* ── Logout ───────────────────────────────────────────────────── */
exports.logout = async (req, res, next) => {
  try {
    await query('DELETE FROM refresh_tokens WHERE user_id=$1', [req.user.id]);
    res.json({ success:true, message:'Logged out successfully.' });
  } catch(err) { next(err); }
};

/* ── Get current user profile ─────────────────────────────────── */
exports.me = async (req, res) => {
  res.json({ success:true, user: User.sanitize(req.user) });
};
