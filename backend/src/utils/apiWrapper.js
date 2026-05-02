/**
 * utils/apiWrapper.js — Centralised HTTP client for external API calls.
 * Wraps Axios with retry logic, timeout, and structured error responses.
 */

const axios  = require('axios');
const logger = require('./logger');

const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES     = 3;
const RETRY_DELAY_MS  = 500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const apiCall = async (config, retries = MAX_RETRIES) => {
  const { method = 'GET', url, headers = {}, data, params, timeout = DEFAULT_TIMEOUT, label = 'External API' } = config;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`[${label}] ${method} ${url} — attempt ${attempt}`);
      const response = await axios({ method, url, headers, data, params, timeout });
      return { success: true, data: response.data, status: response.status };
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message || err.message;
      logger.warn(`[${label}] Attempt ${attempt} failed: ${status} — ${message}`);
      if (status && status >= 400 && status < 500) return { success: false, error: message, status };
      if (attempt < retries) await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  return { success: false, error: 'Service unavailable after retries.', status: 503 };
};

const verifyAadhaar = async (aadhaarNumber) => {
  if (process.env.NODE_ENV !== 'production') {
    const isValid = /^[1-9]\d{11}$/.test(aadhaarNumber);
    return { success: isValid, verified: isValid, name: isValid ? 'As Per Aadhaar Records' : null,
      message: isValid ? 'Aadhaar verified successfully' : 'Invalid Aadhaar number', txnId: `TXN${Date.now()}` };
  }
  return apiCall({ method: 'POST', url: process.env.AADHAAR_API_URL,
    headers: { Authorization: `Bearer ${process.env.AADHAAR_API_KEY}` },
    data: { aadhaarNumber }, label: 'Aadhaar Verify' });
};

const verifyPAN = async (panNumber) => {
  if (process.env.NODE_ENV !== 'production') {
    const isValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase());
    return { success: isValid, verified: isValid, status: isValid ? 'VALID' : 'INVALID',
      message: isValid ? 'PAN verified successfully' : 'Invalid PAN format' };
  }
  return apiCall({ method: 'POST', url: process.env.PAN_API_URL,
    headers: { 'x-api-key': process.env.PAN_API_KEY }, data: { pan: panNumber }, label: 'PAN Verify' });
};

const verifyBankAccount = async (accountNumber, ifscCode, accountHolder) => {
  if (process.env.NODE_ENV !== 'production') {
    const ifscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase());
    return { success: ifscValid, verified: ifscValid, accountHolder: ifscValid ? accountHolder : null,
      bankName: ifscValid ? 'State Bank of India' : null, message: ifscValid ? 'Bank account verified' : 'Invalid IFSC' };
  }
  return apiCall({ method: 'POST', url: process.env.BANK_API_URL,
    headers: { 'x-api-key': process.env.BANK_API_KEY }, data: { accountNumber, ifscCode, accountHolder }, label: 'Bank Verify' });
};

module.exports = { apiCall, verifyAadhaar, verifyPAN, verifyBankAccount };
