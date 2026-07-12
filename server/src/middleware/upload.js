// Multer config for photo/document uploads → server/uploads/, served statically.
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 10);
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, base + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
});

// Public URL for an uploaded file.
function publicUrl(filename) {
  return filename ? `/uploads/${filename}` : null;
}

module.exports = { upload, publicUrl, UPLOAD_DIR };
