/**
 * models/User.js — User model with static query methods.
 * Handles password hashing, JWT generation, and safe serialisation.
 */
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query, withTransaction } = require('../utils/db');
const { encrypt, decrypt, hashSHA256 } = require('../utils/encryption');

const SALT_ROUNDS = 12;

class User {
  // ─── Create ────────────────────────────────────────────────────
  static async create({ email, password, fullName, role = 'employee', phone, department, managerId }) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const emailHash      = hashSHA256(email.toLowerCase());

    const result = await query(
      `INSERT INTO users
         (email, email_hash, password_hash, full_name, role, phone, department, manager_id,
          is_active, is_verified, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,false,NOW(),NOW())
       RETURNING id, email, full_name, role, phone, department, is_active, is_verified, created_at`,
      [email.toLowerCase(), emailHash, hashedPassword, fullName, role, phone, department, managerId]
    );
    return result.rows[0];
  }

  // ─── Find ──────────────────────────────────────────────────────
  static async findById(id) {
    const r = await query('SELECT * FROM users WHERE id=$1', [id]);
    return r.rows[0] || null;
  }

  static async findByEmail(email) {
    const r = await query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
    return r.rows[0] || null;
  }

  static async findAll({ role, department, page = 1, limit = 20 }) {
    let sql    = `SELECT id,email,full_name,role,department,phone,is_active,is_verified,created_at FROM users WHERE 1=1`;
    const vals = [];
    if (role)       { vals.push(role);       sql += ` AND role=$${vals.length}`; }
    if (department) { vals.push(department); sql += ` AND department=$${vals.length}`; }
    sql += ` ORDER BY created_at DESC LIMIT $${vals.length+1} OFFSET $${vals.length+2}`;
    vals.push(limit, (page - 1) * limit);
    const r = await query(sql, vals);
    return r.rows;
  }

  // ─── Update ────────────────────────────────────────────────────
  static async updateVerified(id) {
    await query('UPDATE users SET is_verified=true, updated_at=NOW() WHERE id=$1', [id]);
  }

  static async updatePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, id]);
  }

  static async updateRole(id, role) {
    await query('UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2', [role, id]);
  }

  static async deactivate(id) {
    await query('UPDATE users SET is_active=false, updated_at=NOW() WHERE id=$1', [id]);
  }

  // ─── Auth helpers ──────────────────────────────────────────────
  static async verifyPassword(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
  }

  static generateToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
  }

  static generateRefreshToken(user) {
    return jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  // ─── Safe serialise (strip password) ──────────────────────────
  static sanitize(user) {
    const { password_hash, email_hash, ...safe } = user;
    return safe;
  }
}

module.exports = User;
