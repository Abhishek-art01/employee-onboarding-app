/**
 * controllers/onboardingController.js
 * Multi-step form: create, getForm, saveStep, submit, getAll (HR)
 */
const OnboardingForm = require('../models/OnboardingForm');
const logger         = require('../utils/logger');

/* ── Create blank form for new employee ───────────────────────── */
exports.createForm = async (req, res, next) => {
  try {
    const userId  = req.user.id;
    const existing = await OnboardingForm.findByUserId(userId);
    if (existing) return res.status(409).json({ success:false, message:'Onboarding form already exists.' });
    const form = await OnboardingForm.create(userId);
    res.status(201).json({ success:true, message:'Onboarding form created.', form });
  } catch(err) { next(err); }
};

/* ── Get own form ─────────────────────────────────────────────── */
exports.getMyForm = async (req, res, next) => {
  try {
    const form = await OnboardingForm.findByUserId(req.user.id);
    if (!form) return res.status(404).json({ success:false, message:'No onboarding form found.' });
    res.json({ success:true, form, steps: OnboardingForm.STEPS });
  } catch(err) { next(err); }
};

/* ── Save a single step ───────────────────────────────────────── */
exports.saveStep = async (req, res, next) => {
  try {
    const { step } = req.params;
    if (!OnboardingForm.STEPS.includes(step))
      return res.status(400).json({ success:false, message:`Invalid step. Valid: ${OnboardingForm.STEPS.join(',')}` });

    const form = await OnboardingForm.updateStep(req.user.id, step, req.body);
    res.json({ success:true, message:`Step '${step}' saved.`, form });
  } catch(err) { next(err); }
};

/* ── HR: get all forms with filters ──────────────────────────── */
exports.getAllForms = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const forms = await OnboardingForm.findAll({ status, page:+page, limit:+limit });
    res.json({ success:true, count:forms.length, page:+page, forms });
  } catch(err) { next(err); }
};

/* ── HR: get single form with decrypted sensitive data ───────── */
exports.getFormById = async (req, res, next) => {
  try {
    const form = await OnboardingForm.findById(req.params.id);
    if (!form) return res.status(404).json({ success:false, message:'Form not found.' });
    // Decrypt sensitive fields only for HR+
    const decrypted = OnboardingForm.decryptSensitive(form);
    res.json({ success:true, form: decrypted });
  } catch(err) { next(err); }
};

/* ── HR: approve / reject form ───────────────────────────────── */
exports.reviewForm = async (req, res, next) => {
  try {
    const { status, reviewerNote } = req.body;
    const allowed = ['approved','rejected','under_review','requires_correction'];
    if (!allowed.includes(status))
      return res.status(400).json({ success:false, message:`Status must be one of: ${allowed.join(',')}` });

    const form = await OnboardingForm.updateStatus(req.params.id, status, reviewerNote, req.user.id);
    if (!form) return res.status(404).json({ success:false, message:'Form not found.' });

    logger.info(`Form ${req.params.id} ${status} by HR user ${req.user.id}`);
    res.json({ success:true, message:`Form ${status}.`, form });
  } catch(err) { next(err); }
};

/* ── Dashboard stats ──────────────────────────────────────────── */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { query } = require('../utils/db');
    const stats = await query(`
      SELECT
        COUNT(*)                                          AS total,
        COUNT(*) FILTER(WHERE status='draft')             AS draft,
        COUNT(*) FILTER(WHERE status='submitted')         AS submitted,
        COUNT(*) FILTER(WHERE status='under_review')      AS under_review,
        COUNT(*) FILTER(WHERE status='approved')          AS approved,
        COUNT(*) FILTER(WHERE status='rejected')          AS rejected,
        COUNT(*) FILTER(WHERE created_at >= NOW()-INTERVAL '7 days') AS this_week
      FROM onboarding_forms`);
    res.json({ success:true, stats: stats.rows[0] });
  } catch(err) { next(err); }
};
