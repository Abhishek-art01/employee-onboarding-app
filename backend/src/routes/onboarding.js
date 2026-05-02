/**
 * routes/onboarding.js
 */
const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/onboardingController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const HR_ROLES = ['hr_admin','hr_executive','super_admin'];

router.post('/',               authenticate, ctrl.createForm);
router.get('/my',              authenticate, ctrl.getMyForm);
router.patch('/step/:step',    authenticate, ctrl.saveStep);
router.get('/stats',           authenticate, authorize(...HR_ROLES), ctrl.getDashboardStats);
router.get('/all',             authenticate, authorize(...HR_ROLES), ctrl.getAllForms);
router.get('/:id',             authenticate, authorize(...HR_ROLES), ctrl.getFormById);
router.patch('/:id/review',    authenticate, authorize(...HR_ROLES),
  [body('status').notEmpty(), body('reviewerNote').optional().isString()], validate, ctrl.reviewForm);

module.exports = router;
