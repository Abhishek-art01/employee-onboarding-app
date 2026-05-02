/**
 * controllers/verificationController.js — Aadhaar, PAN, Bank verification
 */
const { verifyAadhaar, verifyPAN, verifyBankAccount } = require('../utils/apiWrapper');
const { query }   = require('../utils/db');
const { encrypt } = require('../utils/encryption');
const logger      = require('../utils/logger');

const logVerification = async (userId, type, result) => {
  await query(
    `INSERT INTO verification_logs (user_id, verification_type, success, response_summary, created_at)
     VALUES ($1,$2,$3,$4,NOW())`,
    [userId, type, result.success, JSON.stringify(result).slice(0, 500)]
  );
};

exports.verifyAadhaar = async (req, res, next) => {
  try {
    const { aadhaarNumber } = req.body;
    if (!aadhaarNumber || !/^[1-9]\d{11}$/.test(aadhaarNumber))
      return res.status(400).json({ success:false, message:'Invalid Aadhaar format (12 digits).' });

    const result = await verifyAadhaar(aadhaarNumber);
    await logVerification(req.user.id, 'aadhaar', result);

    if (result.verified) {
      await query(
        'UPDATE onboarding_forms SET form_data=jsonb_set(form_data,\'{personal,aadhaarVerified}\',\'true\') WHERE user_id=$1',
        [req.user.id]
      );
    }
    res.json({ success:true, verified: result.verified, message: result.message, txnId: result.txnId });
  } catch(err) { next(err); }
};

exports.verifyPAN = async (req, res, next) => {
  try {
    const { panNumber } = req.body;
    if (!panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber.toUpperCase()))
      return res.status(400).json({ success:false, message:'Invalid PAN format (e.g. ABCDE1234F).' });

    const result = await verifyPAN(panNumber.toUpperCase());
    await logVerification(req.user.id, 'pan', result);

    if (result.verified) {
      await query(
        'UPDATE onboarding_forms SET form_data=jsonb_set(form_data,\'{personal,panVerified}\',\'true\') WHERE user_id=$1',
        [req.user.id]
      );
    }
    res.json({ success:true, verified: result.verified, status: result.status, message: result.message });
  } catch(err) { next(err); }
};

exports.verifyBank = async (req, res, next) => {
  try {
    const { accountNumber, ifscCode, accountHolder } = req.body;
    if (!accountNumber || !ifscCode || !accountHolder)
      return res.status(400).json({ success:false, message:'accountNumber, ifscCode, and accountHolder are required.' });
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase()))
      return res.status(400).json({ success:false, message:'Invalid IFSC format (e.g. SBIN0001234).' });

    const result = await verifyBankAccount(accountNumber, ifscCode.toUpperCase(), accountHolder);
    await logVerification(req.user.id, 'bank', result);

    if (result.verified) {
      await query(
        'UPDATE onboarding_forms SET form_data=jsonb_set(form_data,\'{bank,bankVerified}\',\'true\') WHERE user_id=$1',
        [req.user.id]
      );
    }
    res.json({
      success  : true,
      verified : result.verified,
      bankName : result.bankName,
      message  : result.message,
    });
  } catch(err) { next(err); }
};

exports.getVerificationStatus = async (req, res, next) => {
  try {
    const r = await query(
      'SELECT verification_type, success, created_at FROM verification_logs WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success:true, verifications: r.rows });
  } catch(err) { next(err); }
};
