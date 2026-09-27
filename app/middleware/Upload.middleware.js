const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload directory path
const uploadDir = path.join(__dirname, '../../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration for Images (Disk)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File Filter (Images Only: png, jpg, jpeg, webp)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Kripya sirf image files (JPG, PNG, WEBP) hi upload karein!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Memory Storage Configuration for Excel / CSV Bulk Upload
const excelFilter = (req, file, cb) => {
  const allowedExts = /\.(xlsx|xls|csv)$/i;
  if (allowedExts.test(file.originalname)) {
    return cb(null, true);
  } else {
    cb(new Error('Kripya sirf Excel ya CSV file (.xlsx, .xls, .csv) upload karein!'));
  }
};

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: excelFilter
});

module.exports = upload;
module.exports.upload = upload;
module.exports.uploadExcel = uploadExcel;
