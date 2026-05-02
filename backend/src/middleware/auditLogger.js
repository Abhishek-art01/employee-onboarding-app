/**
 * middleware/auditLogger.js — Records every API action to audit_logs table.
 * Stores: user, IP, method, path, status, duration, request body (sanitised).
 */
const { query } = require('../utils/db');
const logger    = require('../utils/logger');

const SENSITIVE_KEYS = ['password','otp','token','secret','key','aadhaarNumber','panNumber','accountNumber'];

const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  const clean = { ...body };
  SENSITIVE_KEYS.forEach(k => { if (clean[k]) clean[k] = '[REDACTED]'; });
  return clean;
};

const requestLogger = (req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end.bind(res);

  res.end = function(chunk, encoding) {
    originalEnd(chunk, encoding);
    const duration  = Date.now() - start;
    const userId    = req.user?.id || null;
    const sanitized = sanitizeBody(req.body);

    // Fire-and-forget audit log insert
    query(
      `INSERT INTO audit_logs
         (user_id, action, resource, method, path, status_code, ip_address, user_agent, request_body, duration_ms, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
      [
        userId,
        `${req.method} ${req.path}`,
        req.path.split('/')[2] || 'unknown',
        req.method,
        req.originalUrl,
        res.statusCode,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent']?.slice(0, 200),
        JSON.stringify(sanitized).slice(0, 2000),
        duration,
      ]
    ).catch(err => logger.error('Audit log write error:', err.message));
  };

  next();
};

module.exports = { requestLogger };
