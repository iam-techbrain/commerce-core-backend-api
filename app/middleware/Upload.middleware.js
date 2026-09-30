const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Upload directory path
const uploadDir = path.join(__dirname, '../../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// File Filter (Images Only: png, jpg, jpeg, webp, avif, svg)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|avif|svg/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('image/');

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Please upload only valid image files (JPG, PNG, WEBP, AVIF, SVG)!'));
  }
};

// Memory Storage so Sharp can compress directly from memory buffer
const memoryStorage = multer.memoryStorage();

const internalMulter = multer({
  storage: memoryStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // Allows up to 15MB input before compression
  fileFilter: fileFilter
});

/**
 * Compress a single image file with Sharp to WebP (~30 KB - 50 KB target)
 */
const compressSingleFile = async (file) => {
  if (!file || !file.buffer) return file;

  const ext = path.extname(file.originalname).toLowerCase();
  const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);

  // SVG files are vectors; don't rasterize them, write directly
  if (file.mimetype === 'image/svg+xml' || ext === '.svg') {
    const filename = `${file.fieldname || 'upload'}-${baseName}-${uniqueSuffix}.svg`;
    const outputPath = path.join(uploadDir, filename);
    await fs.promises.writeFile(outputPath, file.buffer);
    const stats = fs.statSync(outputPath);

    file.filename = filename;
    file.path = outputPath;
    file.destination = uploadDir;
    file.size = stats.size;
    return file;
  }

  // All bitmap images (JPG, PNG, WEBP, AVIF, etc.):
  // Resize max dimensions to 1000px, WebP quality 78 -> reduces size down to ~30-50 KB!
  const filename = `${file.fieldname || 'img'}-${baseName}-${uniqueSuffix}.webp`;
  const outputPath = path.join(uploadDir, filename);

  await sharp(file.buffer)
    .resize({
      width: 1000,
      height: 1000,
      fit: sharp.fit.inside,
      withoutEnlargement: true
    })
    .webp({ quality: 78, effort: 4 })
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  console.log(`⚡ [Image Compressed]: ${file.originalname} -> ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);

  file.filename = filename;
  file.path = outputPath;
  file.destination = uploadDir;
  file.mimetype = 'image/webp';
  file.size = stats.size;

  return file;
};

/**
 * Middleware that intercepts multer memory upload and compresses files
 */
const compressUploadedImages = async (req, res, next) => {
  try {
    if (req.file) {
      await compressSingleFile(req.file);
    }
    if (req.files) {
      if (Array.isArray(req.files)) {
        for (const f of req.files) {
          await compressSingleFile(f);
        }
      } else if (typeof req.files === 'object') {
        for (const field of Object.keys(req.files)) {
          for (const f of req.files[field]) {
            await compressSingleFile(f);
          }
        }
      }
    }
    next();
  } catch (error) {
    console.error('Image compression middleware error:', error);
    next(error);
  }
};

/**
 * Exported Upload object matching multer API with automatic Sharp compression
 */
const upload = {
  single: (fieldName) => [internalMulter.single(fieldName), compressUploadedImages],
  array: (fieldName, maxCount) => [internalMulter.array(fieldName, maxCount), compressUploadedImages],
  fields: (fields) => [internalMulter.fields(fields), compressUploadedImages],
  any: () => [internalMulter.any(), compressUploadedImages],
  none: () => internalMulter.none()
};

// Memory Storage Configuration for Excel / CSV Bulk Upload
const excelFilter = (req, file, cb) => {
  const allowedExts = /\.(xlsx|xls|csv)$/i;
  if (allowedExts.test(file.originalname)) {
    return cb(null, true);
  } else {
    cb(new Error('Please upload only Excel or CSV files (.xlsx, .xls, .csv)!'));
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
module.exports.compressSingleFile = compressSingleFile;
