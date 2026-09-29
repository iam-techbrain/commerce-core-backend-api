const fs = require('fs');
const path = require('path');

/**
 * =========================================================================
 * 🎯 UNIFIED API RESPONSE FORMATTER
 * Ensures 100% consistent JSON response structure across ALL endpoints!
 * =========================================================================
 */
const formatResponse = (success, message, data = null, error = null, pagination = null) => {
  return {
    success,
    message,
    ...(data !== null && { data }),
    ...(error !== null && { error }),
    ...(pagination !== null && { pagination })
  };
};

// Safe file deletion helper (Cleans up orphan uploaded images on error/validation failure)
const deleteUploadedFile = (file) => {
  if (!file || !file.path) return;
  fs.unlink(file.path, (err) => {
    if (err) {
      console.error(`Failed to delete uploaded file: ${file.path}`, err.message);
    } else {
      console.log(`🧹 Cleaned up orphan uploaded file: ${file.filename}`);
    }
  });
};

/**
 * Download external image URL and save locally in public/uploads to prevent external link dependency
 * If download succeeds -> returns "/uploads/cached_<timestamp>_<rand>.jpg"
 * If download fails -> gracefully returns original url
 */
const downloadImageToLocal = async (url) => {
  try {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return url; // Already local path or empty
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Image Downloader]: HTTP ${res.status} when fetching ${url}. Keeping original URL.`);
      return url;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadsDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `cached_${Date.now()}_${Math.floor(Math.random() * 1000000)}.webp`;
    const filePath = path.join(uploadsDir, filename);

    try {
      const sharp = require('sharp');
      await sharp(buffer)
        .resize({ width: 1000, height: 1000, fit: sharp.fit.inside, withoutEnlargement: true })
        .webp({ quality: 78, effort: 4 })
        .toFile(filePath);
      const stats = fs.statSync(filePath);
      console.log(`[Image Downloader]: Compressed & stored: /uploads/${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (sharpErr) {
      await fs.promises.writeFile(filePath, buffer);
      console.log(`[Image Downloader]: Stored fallback: /uploads/${filename}`);
    }

    return `/uploads/${filename}`;
  } catch (err) {
    console.warn(`[Image Downloader]: Failed to download image from ${url} (${err.message}). Falling back to original URL.`);
    return url;
  }
};

module.exports = {
  formatResponse,
  deleteUploadedFile,
  downloadImageToLocal
};
