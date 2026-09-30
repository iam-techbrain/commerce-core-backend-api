const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Base uploads directory path
const baseUploadsDir = path.join(__dirname, '../../public/uploads');

// Ensure folder exists helper
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Ensure base and standard subdirectories exist
ensureDirExists(baseUploadsDir);
ensureDirExists(path.join(baseUploadsDir, 'brands'));
ensureDirExists(path.join(baseUploadsDir, 'categories'));
ensureDirExists(path.join(baseUploadsDir, 'products'));

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
 * Determine subfolder based on options or request path / field name
 */
const resolveSubfolder = (req, explicitFolder) => {
  if (explicitFolder) return explicitFolder;
  const baseUrl = (req.baseUrl || req.originalUrl || '').toLowerCase();
  if (baseUrl.includes('brand')) return 'brands';
  if (baseUrl.includes('categor')) return 'categories';
  if (baseUrl.includes('product')) return 'products';
  return '';
};

/**
 * Compress a single image file with Sharp to WebP (~20 KB - 50 KB target)
 * and save it directly in the targeted subfolder (e.g. uploads/brands/)
 */
const compressSingleFile = async (file, targetSubfolder = '', customBaseName = '') => {
  if (!file || !file.buffer) return file;

  const targetDir = targetSubfolder
    ? path.join(baseUploadsDir, targetSubfolder)
    : baseUploadsDir;

  ensureDirExists(targetDir);

  const ext = path.extname(file.originalname).toLowerCase();
  let baseName = customBaseName
    ? customBaseName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-')
    : path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');

  if (!baseName) baseName = 'logo';

  // For brands and categories, save directly as <name>.webp (clean and memorable!)
  const isNamedFolder = targetSubfolder === 'brands' || targetSubfolder === 'categories';
  const filename = isNamedFolder
    ? `${baseName}.webp`
    : `${file.fieldname || 'img'}-${baseName}-${Date.now()}-${Math.round(Math.random() * 1E6)}.webp`;

  const outputPath = path.join(targetDir, filename);

  // SVG files are vectors; don't rasterize them, write directly
  if (file.mimetype === 'image/svg+xml' || ext === '.svg') {
    const svgFilename = isNamedFolder ? `${baseName}.svg` : `${file.fieldname || 'upload'}-${baseName}-${Date.now()}.svg`;
    const svgPath = path.join(targetDir, svgFilename);
    await fs.promises.writeFile(svgPath, file.buffer);
    const stats = fs.statSync(svgPath);

    file.filename = svgFilename;
    file.path = svgPath;
    file.destination = targetDir;
    file.subfolder = targetSubfolder;
    file.relativeUrl = targetSubfolder ? `/uploads/${targetSubfolder}/${svgFilename}` : `/uploads/${svgFilename}`;
    file.size = stats.size;
    return file;
  }

  // All bitmap images (JPG, PNG, WEBP, AVIF, etc.):
  // Resize max dimensions to 1000px, WebP quality 78 -> reduces size down to ~20-50 KB!
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
  console.log(`⚡ [Image Compressed]: ${file.originalname} -> ${targetSubfolder ? targetSubfolder + '/' : ''}${filename} (${(stats.size / 1024).toFixed(1)} KB)`);

  file.filename = filename;
  file.path = outputPath;
  file.destination = targetDir;
  file.subfolder = targetSubfolder;
  file.relativeUrl = targetSubfolder ? `/uploads/${targetSubfolder}/${filename}` : `/uploads/${filename}`;
  file.mimetype = 'image/webp';
  file.size = stats.size;

  return file;
};

/**
 * Middleware that intercepts multer memory upload and compresses files into designated subfolder
 */
const createCompressMiddleware = (subfolder) => {
  return async (req, res, next) => {
    try {
      const folder = resolveSubfolder(req, subfolder);
      const isNamed = folder === 'brands' || folder === 'categories';
      const customBaseName = isNamed && req.body && req.body.name ? req.body.name : '';

      if (req.file) {
        await compressSingleFile(req.file, folder, customBaseName);
      }
      if (req.files) {
        if (Array.isArray(req.files)) {
          for (const f of req.files) {
            await compressSingleFile(f, folder, customBaseName);
          }
        } else if (typeof req.files === 'object') {
          for (const field of Object.keys(req.files)) {
            for (const f of req.files[field]) {
              await compressSingleFile(f, folder, customBaseName);
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
};

/**
 * Helper to build multer + compress middlewares for specific subfolder
 */
const buildUploadHandlers = (folder = '') => ({
  single: (fieldName) => [internalMulter.single(fieldName), createCompressMiddleware(folder)],
  array: (fieldName, maxCount) => [internalMulter.array(fieldName, maxCount), createCompressMiddleware(folder)],
  fields: (fields) => [internalMulter.fields(fields), createCompressMiddleware(folder)],
  any: () => [internalMulter.any(), createCompressMiddleware(folder)],
  none: () => internalMulter.none()
});

// Default auto-detecting upload handlers
const upload = buildUploadHandlers();

// Dedicated subfolder-specific upload handlers
upload.brand = buildUploadHandlers('brands');
upload.category = buildUploadHandlers('categories');
upload.product = buildUploadHandlers('products');

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
