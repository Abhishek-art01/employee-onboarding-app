/**
 * controllers/documentController.js — S3 upload, list, download, verify
 */
const multer       = require('multer');
const Document     = require('../models/Document');
const { uploadDocument, getSignedDownloadUrl, deleteDocument, validateFile } = require('../utils/s3Upload');
const logger       = require('../utils/logger');

// Multer — store in memory for S3 stream upload
const upload = multer({
  storage : multer.memoryStorage(),
  limits  : { fileSize: 10 * 1024 * 1024 },
}).single('document');

/* ── Upload ────────────────────────────────────────────────────── */
exports.uploadDocument = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ success:false, message: err.message });
    try {
      if (!req.file) return res.status(400).json({ success:false, message:'No file provided.' });

      const validation = validateFile(req.file);
      if (!validation.valid) return res.status(400).json({ success:false, message: validation.message });

      const { docType, formId } = req.body;
      if (!Document.DOCUMENT_TYPES.includes(docType))
        return res.status(400).json({ success:false, message:`Invalid docType. Allowed: ${Document.DOCUMENT_TYPES.join(',')}` });

      const s3Result = await uploadDocument(
        req.file.buffer, req.file.originalname, req.file.mimetype,
        req.user.id, docType
      );

      const doc = await Document.create({
        userId      : req.user.id,
        formId      : formId || null,
        docType,
        originalName: req.file.originalname,
        s3Key       : s3Result.key,
        mimeType    : req.file.mimetype,
        sizeBytes   : req.file.size,
        uploadedBy  : req.user.id,
      });

      logger.info(`Document uploaded: ${doc.id} by user ${req.user.id}`);
      res.status(201).json({ success:true, message:'Document uploaded.', document: doc });
    } catch(err) { next(err); }
  });
};

/* ── List user documents ───────────────────────────────────────── */
exports.listDocuments = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    const docs   = await Document.findByUserId(userId);
    res.json({ success:true, count:docs.length, documents:docs });
  } catch(err) { next(err); }
};

/* ── Download (pre-signed URL) ─────────────────────────────────── */
exports.downloadDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success:false, message:'Document not found.' });

    // Employees can only download their own docs
    if (req.user.role === 'employee' && doc.user_id !== req.user.id)
      return res.status(403).json({ success:false, message:'Access denied.' });

    const url = await getSignedDownloadUrl(doc.s3_key);
    res.json({ success:true, url, expiresIn:'15 minutes', document: doc });
  } catch(err) { next(err); }
};

/* ── HR: verify/reject a document ─────────────────────────────── */
exports.verifyDocument = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!['verified','rejected'].includes(status))
      return res.status(400).json({ success:false, message:"Status must be 'verified' or 'rejected'." });

    const doc = await Document.updateVerificationStatus(req.params.id, status, note, req.user.id);
    if (!doc) return res.status(404).json({ success:false, message:'Document not found.' });

    res.json({ success:true, message:`Document ${status}.`, document: doc });
  } catch(err) { next(err); }
};

/* ── Delete ────────────────────────────────────────────────────── */
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success:false, message:'Document not found.' });

    if (req.user.role === 'employee' && doc.user_id !== req.user.id)
      return res.status(403).json({ success:false, message:'Access denied.' });

    await deleteDocument(doc.s3_key);
    await Document.delete(req.params.id);
    res.json({ success:true, message:'Document deleted.' });
  } catch(err) { next(err); }
};
