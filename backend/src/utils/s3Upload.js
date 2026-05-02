/**
 * utils/s3Upload.js — AWS S3 document upload/download helpers.
 * Uses @aws-sdk/client-s3 v3 with pre-signed URLs for secure access.
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path   = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

const s3Client = new S3Client({
  region         : process.env.AWS_REGION || 'ap-south-1',
  credentials    : {
    accessKeyId    : process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME || 'employee-onboarding-docs';

/**
 * uploadDocument — upload a file buffer to S3
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @param {string} mimeType
 * @param {string} employeeId
 * @param {string} docType   e.g. 'aadhaar', 'pan', 'offer_letter'
 * @returns {object} { key, url, bucket, size }
 */
const uploadDocument = async (fileBuffer, originalName, mimeType, employeeId, docType) => {
  const ext      = path.extname(originalName).toLowerCase();
  const fileKey  = `employees/${employeeId}/${docType}/${uuidv4()}${ext}`;

  const command = new PutObjectCommand({
    Bucket     : BUCKET,
    Key        : fileKey,
    Body       : fileBuffer,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256',   // encrypt at rest
    Metadata   : {
      employeeId,
      docType,
      originalName,
      uploadedAt: new Date().toISOString(),
    },
  });

  await s3Client.send(command);
  logger.info(`S3 upload success: ${fileKey}`);

  return {
    key   : fileKey,
    bucket: BUCKET,
    size  : fileBuffer.length,
    path  : `s3://${BUCKET}/${fileKey}`,
  };
};

/**
 * getSignedDownloadUrl — generate a pre-signed GET URL (15-min expiry)
 */
const getSignedDownloadUrl = async (s3Key, expiresIn = 900) => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
  const url     = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
};

/**
 * deleteDocument — permanently remove a document from S3
 */
const deleteDocument = async (s3Key) => {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key });
  await s3Client.send(command);
  logger.info(`S3 delete success: ${s3Key}`);
};

/**
 * ALLOWED file types and max size (10 MB)
 */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png',
  'image/heic',
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;   // 10 MB

const validateFile = (file) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return { valid: false, message: `File type "${file.mimetype}" not allowed. Accepted: PDF, JPEG, PNG.` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, message: `File too large. Maximum size is 10 MB.` };
  }
  return { valid: true };
};

module.exports = { uploadDocument, getSignedDownloadUrl, deleteDocument, validateFile };
