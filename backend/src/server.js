/**
 * server.js — Application entry point
 * Bootstraps Express, connects to PostgreSQL, registers all middleware & routes.
 */

require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const helmet        = require('helmet');
const compression   = require('compression');
const morgan        = require('morgan');
const rateLimit     = require('express-rate-limit');
const path          = require('path');

const { connectDB }         = require('./utils/db');
const { requestLogger }     = require('./middleware/auditLogger');
const { errorHandler }      = require('./middleware/errorHandler');
const { notFoundHandler }   = require('./middleware/errorHandler');

// ─── Route Imports ────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const onboardingRoutes = require('./routes/onboarding');
const documentRoutes  = require('./routes/documents');
const verificationRoutes = require('./routes/verification');
const adminRoutes     = require('./routes/admin');
const auditRoutes     = require('./routes/audit');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      scriptSrc:  ["'self'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// ─── Request Parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}
app.use(requestLogger);   // custom audit logger (DB + file)

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs : parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max      : parseInt(process.env.RATE_LIMIT_MAX)       || 100,
  standardHeaders: true,
  legacyHeaders  : false,
  message : { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', globalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status  : 'OK',
    service : 'employee-onboarding-backend',
    version : '1.0.0',
    uptime  : process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/onboarding',   onboardingRoutes);
app.use('/api/documents',    documentRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/audit',        auditRoutes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 Employee Onboarding Backend`);
      console.log(`   ENV  : ${process.env.NODE_ENV}`);
      console.log(`   PORT : ${PORT}`);
      console.log(`   DB   : ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

start();

module.exports = app;   // exported for testing
