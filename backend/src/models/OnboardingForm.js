/**
 * models/OnboardingForm.js — Multi-step onboarding form (personal, education,
 * employment, bank, emergency contact) stored as JSONB in PostgreSQL.
 */
const { query, withTransaction } = require('../utils/db');
const { encrypt, decrypt }       = require('../utils/encryption');

const STEPS = ['personal','education','employment','bank','emergency','consent'];

class OnboardingForm {

  static async create(userId) {
    const r = await query(
      `INSERT INTO onboarding_forms (user_id, status, current_step, form_data, created_at, updated_at)
       VALUES ($1,'draft',$2,'{}',NOW(),NOW()) RETURNING *`,
      [userId, STEPS[0]]
    );
    return r.rows[0];
  }

  static async findByUserId(userId) {
    const r = await query('SELECT * FROM onboarding_forms WHERE user_id=$1', [userId]);
    return r.rows[0] || null;
  }

  static async findById(id) {
    const r = await query('SELECT * FROM onboarding_forms WHERE id=$1', [id]);
    return r.rows[0] || null;
  }

  static async findAll({ status, page = 1, limit = 20 }) {
    let sql  = `SELECT f.*, u.full_name, u.email, u.department
                FROM onboarding_forms f JOIN users u ON f.user_id=u.id WHERE 1=1`;
    const vals = [];
    if (status) { vals.push(status); sql += ` AND f.status=$${vals.length}`; }
    sql += ` ORDER BY f.updated_at DESC LIMIT $${vals.length+1} OFFSET $${vals.length+2}`;
    vals.push(limit, (page-1)*limit);
    const r = await query(sql, vals);
    return r.rows;
  }

  // ─── Upsert a step's data; encrypt sensitive fields ───────────
  static async updateStep(userId, step, stepData) {
    const existing = await OnboardingForm.findByUserId(userId);
    if (!existing) throw new Error('Onboarding form not found for user.');

    // Encrypt sensitive fields before storing
    const sanitized = { ...stepData };
    if (step === 'bank') {
      if (sanitized.accountNumber) sanitized.accountNumber = encrypt(sanitized.accountNumber);
      if (sanitized.ifscCode)      sanitized.ifscCode      = encrypt(sanitized.ifscCode);
    }
    if (step === 'personal') {
      if (sanitized.aadhaarNumber) sanitized.aadhaarNumber = encrypt(sanitized.aadhaarNumber);
      if (sanitized.panNumber)     sanitized.panNumber     = encrypt(sanitized.panNumber);
    }

    const currentData  = existing.form_data || {};
    const updatedData  = { ...currentData, [step]: sanitized };
    const stepIndex    = STEPS.indexOf(step);
    const nextStep     = STEPS[stepIndex + 1] || 'complete';
    const allDone      = STEPS.every(s => updatedData[s]);
    const newStatus    = allDone ? 'submitted' : 'draft';

    const r = await query(
      `UPDATE onboarding_forms
       SET form_data=$1, current_step=$2, status=$3, updated_at=NOW()
       WHERE user_id=$4 RETURNING *`,
      [JSON.stringify(updatedData), nextStep, newStatus, userId]
    );
    return r.rows[0];
  }

  // ─── HR review actions ─────────────────────────────────────────
  static async updateStatus(id, status, reviewerNote, reviewedBy) {
    const r = await query(
      `UPDATE onboarding_forms
       SET status=$1, reviewer_note=$2, reviewed_by=$3, reviewed_at=NOW(), updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [status, reviewerNote, reviewedBy, id]
    );
    return r.rows[0];
  }

  // ─── Decrypt sensitive fields for authorised access ────────────
  static decryptSensitive(form) {
    if (!form?.form_data) return form;
    const fd = { ...form.form_data };
    if (fd.personal?.aadhaarNumber) fd.personal.aadhaarNumber = decrypt(fd.personal.aadhaarNumber);
    if (fd.personal?.panNumber)     fd.personal.panNumber     = decrypt(fd.personal.panNumber);
    if (fd.bank?.accountNumber)     fd.bank.accountNumber     = decrypt(fd.bank.accountNumber);
    if (fd.bank?.ifscCode)          fd.bank.ifscCode          = decrypt(fd.bank.ifscCode);
    return { ...form, form_data: fd };
  }

  static get STEPS() { return STEPS; }
}

module.exports = OnboardingForm;
