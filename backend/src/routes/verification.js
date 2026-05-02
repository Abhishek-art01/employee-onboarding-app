/**
 * routes/verification.js
 */
const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/verificationController');
const { authenticate } = require('../middleware/auth');
const { validate }     = require('../middleware/validate');
const rateLimit        = require('express-rate-limit');

const verifyLimiter = rateLimit({ windowMs:60*60*1000, max:5, message:'Too many verification attempts.' });

router.post('/aadhaar', authenticate, verifyLimiter,
  [body('aadhaarNumber').isLength({min:12,max:12})], validate, ctrl.verifyAadhaar);
router.post('/pan',     authenticate, verifyLimiter,
  [body('panNumber').isLength({min:10,max:10})], validate, ctrl.verifyPAN);
router.post('/bank',    authenticate, verifyLimiter,
  [body('accountNumber').notEmpty(), body('ifscCode').notEmpty(), body('accountHolder').notEmpty()],
  validate, ctrl.verifyBank);
router.get('/status',   authenticate, ctrl.getVerificationStatus);

module.exports = router;
