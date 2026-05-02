/**
 * routes/audit.js — Audit log access for admins
 */
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../utils/db');

router.get('/', authenticate, authorize('hr_admin','super_admin'), async (req, res, next) => {
  try {
    const { userId, method, from, to, page=1, limit=50 } = req.query;
    let sql   = 'SELECT * FROM audit_logs WHERE 1=1';
    const vals = [];
    if (userId) { vals.push(userId); sql += ` AND user_id=$${vals.length}`; }
    if (method) { vals.push(method.toUpperCase()); sql += ` AND method=$${vals.length}`; }
    if (from)   { vals.push(from);   sql += ` AND created_at>=$${vals.length}`; }
    if (to)     { vals.push(to);     sql += ` AND created_at<=$${vals.length}`; }
    sql += ` ORDER BY created_at DESC LIMIT $${vals.length+1} OFFSET $${vals.length+2}`;
    vals.push(+limit, (+page-1)*(+limit));
    const r = await query(sql, vals);
    res.json({ success:true, count:r.rows.length, page:+page, logs: r.rows });
  } catch(err) { next(err); }
});

module.exports = router;
