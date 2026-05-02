/**
 * routes/admin.js
 */
const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const ADMIN = ['hr_admin','super_admin'];

router.get('/users',              authenticate, authorize(...ADMIN), ctrl.getAllUsers);
router.get('/users/:id',          authenticate, authorize(...ADMIN), ctrl.getUserById);
router.patch('/users/:id/role',   authenticate, authorize('super_admin'),
  [body('role').notEmpty()], validate, ctrl.updateUserRole);
router.patch('/users/:id/deactivate', authenticate, authorize(...ADMIN), ctrl.deactivateUser);
router.get('/stats',              authenticate, authorize(...ADMIN), ctrl.getSystemStats);

module.exports = router;
