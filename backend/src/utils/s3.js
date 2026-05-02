/**
 * utils/s3.js — AWS S3 helper for document upload, download, delete.
 */
const { S3Client, PutObjectCommand, GetObjectCommand,
        DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 }   = require('uuid');
const path             = require('path');
const logger           = require('./logger');

const s3 = new S3Client({
  region         : process.env.AWS_REGION || 'ap-south-1',
  credentials    : {
    accessKeyId    : process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME || 'employee-onboarding-docs';

/** Upload buffer/stream to S3, returns { key, url } */
const uploadFile = async (file, employeeId, docType) => {
  const ext      = path.extname(file.originalname).toLowerCase();
  const key      = `documents/${employeeId}/${docType}/${uuidv4()}${ext}`;
  const command  = new PutObjectCommand({
    Bucket     : BUCKET,
    Key        : key,
    Body       : file.buffer,
    ContentType: file.mimetype,
    ServerSideEncryption: 'AES256',
    Metadata   : {
      employeeId,
      docType,
      uploadedAt: new Date().toISOString(),
    },
  });
  await s3.send(command);
  logger.info(`S3 upload: s3://${BUCKET}/${key}`);
  return { key, bucket: BUCKET };
};

/** Generate a pre-signed URL valid for `expiresIn` seconds (default 15 min) */
const getPresignedUrl = async (key, expiresIn = 900) => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
};

/** Delete an object */
const deleteFile = async (key) => {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  logger.info(`S3 delete: s3://${BUCKET}/${key}`);
};

/** Check if object exists */
const fileExists = async (key) => {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch { return false; }
};

module.exports = { uploadFile, getPresignedUrl, deleteFile, fileExists };
