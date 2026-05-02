/**
 * middleware/auth.js — JWT verification + Role-Based Access Control (RBAC)
 * Roles: super_admin > hr_admin > hr_executive > manager > employee
 */
const jwt    = require('jsonwebtoken');
const { query } = require('../utils/db');
const logger = require('../utils/logger');

const ROLE_HIERARCHY = { super_admin:5, hr_admin:4, hr_executive:3, manager:2, employee:1 };

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'No token provided.' });

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result  = await query(
      'SELECT id,email,role,full_name,is_active,is_verified FROM users WHERE id=$1',
      [decoded.userId]);

    if (!result.rows.length)
      return res.status(401).json({ success:false, message:'User not found.' });

    const user = result.rows[0];
    if (!user.is_active)
      return res.status(403).json({ success:false, message:'Account deactivated.' });

    req.user = user;
    next();
  } catch(err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ success:false, message:'Token expired.' });
    if (err.name === 'JsonWebTokenError')
      return res.status(401).json({ success:false, message:'Invalid token.' });
    next(err);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success:false, message:'Auth required.' });
  if (!roles.includes(req.user.role)) {
    logger.warn(`RBAC denied: ${req.user.role} => ${req.path}`);
    return res.status(403).json({ success:false, message:`Requires role: ${roles.join('/')}` });
  }
  next();
};

const authorizeOwnerOrAdmin = (getOwnerId) => async (req, res, next) => {
  try {
    const ownerId = await getOwnerId(req);
    const isOwner = String(req.user.id) === String(ownerId);
    const isAdmin = ['hr_admin','super_admin','hr_executive'].includes(req.user.role);
    if (!isOwner && !isAdmin)
      return res.status(403).json({ success:false, message:'Access denied.' });
    next();
  } catch(err) { next(err); }
};

module.exports = { authenticate, authorize, authorizeOwnerOrAdmin };
