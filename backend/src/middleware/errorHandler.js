/**
 * middleware/errorHandler.js — Global error + 404 handlers.
 */
const logger = require('../utils/logger');

const notFoundHandler = (req, res) => {
  res.status(404).json({ success:false, message:`Route ${req.method} ${req.originalUrl} not found.` });
};

const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled error on ${req.method} ${req.path}:`, err);

  // Validation errors
  if (err.name === 'ValidationError' || err.type === 'entity.parse.failed') {
    return res.status(400).json({ success:false, message: err.message });
  }
  // DB unique constraint
  if (err.code === '23505') {
    return res.status(409).json({ success:false, message:'A record with this value already exists.' });
  }
  // DB foreign key
  if (err.code === '23503') {
    return res.status(400).json({ success:false, message:'Referenced record does not exist.' });
  }

  const status  = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error.'
    : err.message || 'Internal server error.';

  res.status(status).json({ success:false, message });
};

module.exports = { notFoundHandler, errorHandler };
