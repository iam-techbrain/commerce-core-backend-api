const fs = require('fs');

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

module.exports = {
  formatResponse,
  deleteUploadedFile
};
