/**
 * Logger Utility
 * Provides formatted console logging with timestamps and log levels.
 */
class Logger {
  static info(message, meta = '') {
    console.log(`[INFO] [${new Date().toISOString()}]: ${message}`, meta ? JSON.stringify(meta) : '');
  }

  static warn(message, meta = '') {
    console.warn(`[WARN] [${new Date().toISOString()}]: ${message}`, meta ? JSON.stringify(meta) : '');
  }

  static error(message, meta = '') {
    console.error(`[ERROR] [${new Date().toISOString()}]: ${message}`, meta ? JSON.stringify(meta) : '');
  }
}

module.exports = Logger;
