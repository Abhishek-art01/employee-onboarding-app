/**
 * models/Document.js — File upload records linked to employees & onboarding forms.
 */
const { query } = require('../utils/db');

const DOCUMENT_TYPES = [
  'aadhaar_front','aadhaar_back','pan_card','passport','degree_certificate',
  'experience_letter','offer_letter','bank_passbook','photo','other'
];

class Document {
  static async create({ userId, formId, docType, originalName, s3Key, mimeType, sizeBytes, uploadedBy }) {
    const r = await query(
      `INSERT INTO documents
         (user_id, form_id, doc_type, original_name, s3_key, mime_type, size_bytes, uploaded_by,
          verification_status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',NOW()) RETURNING *`,
      [userId, formId, docType, originalName, s3Key, mimeType, sizeBytes, uploadedBy]
    );
    return r.rows[0];
  }

  static async findByUserId(userId) {
    const r = await query(
      'SELECT * FROM documents WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
    return r.rows;
  }

  static async findById(id) {
    const r = await query('SELECT * FROM documents WHERE id=$1', [id]);
    return r.rows[0] || null;
  }

  static async updateVerificationStatus(id, status, note, verifiedBy) {
    const r = await query(
      `UPDATE documents SET verification_status=$1, verification_note=$2,
       verified_by=$3, verified_at=NOW() WHERE id=$4 RETURNING *`,
      [status, note, verifiedBy, id]
    );
    return r.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM documents WHERE id=$1', [id]);
  }

  static get DOCUMENT_TYPES() { return DOCUMENT_TYPES; }
}

module.exports = Document;
