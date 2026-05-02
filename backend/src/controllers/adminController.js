/**
 * controllers/adminController.js — User management, role changes, bulk ops
 */
const User   = require('../models/User');
const { query } = require('../utils/db');
const logger = require('../utils/logger');

exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, department, page=1, limit=20 } = req.query;
    const users = await User.findAll({ role, department, page:+page, limit:+limit });
    res.json({ success:true, count:users.length, page:+page, users });
  } catch(err) { next(err); }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success:false, message:'User not found.' });
    res.json({ success:true, user: User.sanitize(user) });
  } catch(err) { next(err); }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowed  = ['employee','manager','hr_executive','hr_admin','super_admin'];
    if (!allowed.includes(role))
      return res.status(400).json({ success:false, message:`Role must be one of: ${allowed.join(',')}` });

    await User.updateRole(req.params.id, role);
    logger.info(`User ${req.params.id} role updated to ${role} by ${req.user.id}`);
    res.json({ success:true, message:`Role updated to ${role}.` });
  } catch(err) { next(err); }
};

exports.deactivateUser = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user.id))
      return res.status(400).json({ success:false, message:'Cannot deactivate yourself.' });
    await User.deactivate(req.params.id);
    res.json({ success:true, message:'User deactivated.' });
  } catch(err) { next(err); }
};

exports.getSystemStats = async (req, res, next) => {
  try {
    const [users, forms, docs, audits] = await Promise.all([
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER(WHERE is_active) AS active,
             COUNT(*) FILTER(WHERE created_at>=NOW()-INTERVAL '30 days') AS new_this_month FROM users`),
      query(`SELECT COUNT(*) AS total,
             COUNT(*) FILTER(WHERE status='approved') AS approved,
             COUNT(*) FILTER(WHERE status='submitted') AS pending FROM onboarding_forms`),
      query(`SELECT COUNT(*) AS total,
             COUNT(*) FILTER(WHERE verification_status='verified') AS verified FROM documents`),
      query(`SELECT COUNT(*) AS total FROM audit_logs WHERE created_at>=NOW()-INTERVAL '24 hours'`),
    ]);
    res.json({
      success: true,
      stats  : { users: users.rows[0], forms: forms.rows[0], documents: docs.rows[0], auditLast24h: audits.rows[0] }
    });
  } catch(err) { next(err); }
};
