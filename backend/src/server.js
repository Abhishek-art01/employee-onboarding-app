const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQL

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database connection
const pool = new Pool({
  user: 'dbuser',
  host: 'localhost',
  database: 'onboarding',
  password: 'password',
  port: 5432,
});

// Authentication routes
app.post('/auth/register', async (req, res) => {
  const { email, mobile, role } = req.body;
  // Generate OTP, store user, send OTP via email/SMS
  res.json({ message: 'OTP sent' });
});

app.post('/auth/verify', async (req, res) => {
  const { otp } = req.body;
  // Verify OTP logic
  res.json({ message: 'User verified' });
});

// Aadhaar, PAN, Bank verification (stubbed)
app.post('/verify/aadhaar', (req, res) => {
  // Call UIDAI API
  res.json({ status: 'verified' });
});

app.post('/verify/pan', (req, res) => {
  // Call NSDL API
  res.json({ status: 'verified' });
});

app.post('/verify/bank', (req, res) => {
  // Call Razorpay/Paytm API
  res.json({ status: 'verified' });
});

// Document upload
app.post('/documents/upload', (req, res) => {
  // Upload to AWS S3/Azure Blob
  res.json({ message: 'Document uploaded' });
});

// Onboarding form
app.post('/onboarding/form', async (req, res) => {
  const { employeeId, details } = req.body;
  await pool.query('INSERT INTO forms(employee_id, details) VALUES($1,$2)', [employeeId, details]);
  res.json({ message: 'Form saved' });
});

app.listen(5000, () => console.log('Server running on port 5000'));
