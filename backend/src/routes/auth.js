/**
 * routes/auth.js
 * POST /api/auth/register
 * POST /api/auth/verify-email
 * POST /api/auth/login
 * POST /api/auth/verify-otp
 * POST /api/auth/refresh
 * POST /api/auth/forgot-password
 * POST /api/auth/reset-password
 * POST /api/auth/logout
 * GET  /api/auth/me
 */
const router      = require('express').Router();
const { body }    = require('express-validator');
const ctrl        = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate }     = require('../middleware/validate');
const rateLimit        = require('express-rate-limit');

const authLimiter = rateLimit({ windowMs:15*60*1000, max:10, message:{ success:false, message:'Too many auth attempts.' } });

const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').isLength({ min:8 }).withMessage('Password min 8 chars.')
    .matches(/^(?=.*[A-Z])(?=.*\d)/).withMessage('Must contain uppercase and number.'),
  body('fullName').trim().notEmpty().isLength({ max:100 }).withMessage('Full name required.'),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Valid Indian phone required.'),
];

router.post('/register',        authLimiter, registerRules, validate, ctrl.register);
router.post('/verify-email',    authLimiter, [body('userId').notEmpty(), body('otp').isLength({min:6,max:6})], validate, ctrl.verifyEmail);
router.post('/login',           authLimiter, [body('email').isEmail(), body('password').notEmpty()], validate, ctrl.login);
router.post('/verify-otp',      authLimiter, [body('userId').notEmpty(), body('otp').isLength({min:6,max:6})], validate, ctrl.verifyLoginOTP);
router.post('/refresh',         [body('refreshToken').notEmpty()], validate, ctrl.refreshToken);
router.post('/forgot-password', authLimiter, [body('email').isEmail()], validate, ctrl.forgotPassword);
router.post('/reset-password',  authLimiter, [body('userId').notEmpty(),body('otp').notEmpty(),body('newPassword').isLength({min:8})], validate, ctrl.resetPassword);
router.post('/logout',          authenticate, ctrl.logout);
router.get('/me',               authenticate, ctrl.me);

module.exports = router;
