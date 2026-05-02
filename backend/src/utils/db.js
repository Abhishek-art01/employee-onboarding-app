/**
 * utils/db.js — PostgreSQL connection pool (pg)
 * Exports `pool` for direct queries and `connectDB` for startup validation.
 */

const { Pool } = require('pg');
const logger   = require('./logger');

const pool = new Pool({
  host    : process.env.DB_HOST     || 'localhost',
  port    : parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'onboarding_db',
  user    : process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  max     : 20,          // max connections in pool
  idleTimeoutMillis   : 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  logger.error('Unexpected PG pool error:', err);
});

/**
 * connectDB — validate DB connectivity on startup
 */
const connectDB = async () => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() AS now');
    logger.info(`PostgreSQL connected at ${res.rows[0].now}`);
  } finally {
    client.release();
  }
};

/**
 * query — thin wrapper with logging
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    logger.debug(`Query executed in ${Date.now() - start}ms: ${text.slice(0, 80)}`);
    return res;
  } catch (err) {
    logger.error(`Query error: ${err.message}\nSQL: ${text}`);
    throw err;
  }
};

/**
 * withTransaction — run multiple queries in a single transaction
 */
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, connectDB, query, withTransaction };
