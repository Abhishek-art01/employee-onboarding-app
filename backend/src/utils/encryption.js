/**
 * utils/encryption.js — AES-256-CBC encrypt / decrypt helpers.
 * Used for Aadhaar numbers, PAN, bank account details at rest.
 *
 * Key length  : 32 bytes (256-bit)
 * IV length   : 16 bytes (128-bit block size)
 * Output      : hex-encoded  "iv:ciphertext"
 */

const crypto = require('crypto');

const ALGORITHM  = 'aes-256-cbc';
const KEY_HEX    = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
const KEY        = Buffer.from(KEY_HEX, 'hex');   // must be 32 bytes

if (KEY.length !== 32) {
  throw new Error(`ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars). Got ${KEY.length} bytes.`);
}

/**
 * encrypt — AES-256-CBC encrypt plaintext string
 * @param {string} plaintext
 * @returns {string}  "ivHex:ciphertextHex"
 */
const encrypt = (plaintext) => {
  if (!plaintext) return plaintext;
  const iv         = crypto.randomBytes(16);                   // fresh IV per encryption
  const cipher     = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted  = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * decrypt — reverse of encrypt
 * @param {string} encryptedText  "ivHex:ciphertextHex"
 * @returns {string} original plaintext
 */
const decrypt = (encryptedText) => {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  const [ivHex, ciphertextHex] = encryptedText.split(':');
  const iv         = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');
  const decipher   = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  const decrypted  = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
};

/**
 * hashSHA256 — one-way hash (for indexing encrypted fields)
 */
const hashSHA256 = (data) => {
  return crypto.createHash('sha256').update(String(data)).digest('hex');
};

/**
 * maskPAN — show only last 4 digits: XXXXXXXX1234
 */
const maskPAN = (pan) => {
  if (!pan || pan.length < 4) return '****';
  return 'X'.repeat(pan.length - 4) + pan.slice(-4);
};

/**
 * maskAadhaar — show only last 4 digits: XXXX-XXXX-1234
 */
const maskAadhaar = (aadhaar) => {
  if (!aadhaar) return '****';
  const clean = String(aadhaar).replace(/\D/g, '');
  return `XXXX-XXXX-${clean.slice(-4)}`;
};

module.exports = { encrypt, decrypt, hashSHA256, maskPAN, maskAadhaar };
