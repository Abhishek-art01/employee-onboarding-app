/**
 * routes/documents.js
 */
const router = require('express').Router();
const ctrl   = require('../controllers/documentController');
const { authenticate, authorize } = require('../middleware/auth');

const HR_ROLES = ['hr_admin','hr_executive','super_admin'];

router.post('/upload',            authenticate, ctrl.uploadDocument);
router.get('/my',                 authenticate, ctrl.listDocuments);
router.get('/user/:userId',       authenticate, authorize(...HR_ROLES), ctrl.listDocuments);
router.get('/:id/download',       authenticate, ctrl.downloadDocument);
router.patch('/:id/verify',       authenticate, authorize(...HR_ROLES), ctrl.verifyDocument);
router.delete('/:id',             authenticate, ctrl.deleteDocument);

module.exports = router;
