const multer = require('multer');

const ALLOWED_TYPES = [
  'image/jpeg','image/png','image/webp','application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
  storage   : multer.memoryStorage(),
  fileFilter: (req, file, cb) =>
    ALLOWED_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`File type ${file.mimetype} not allowed.`), false),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

module.exports = { upload };
