const Logger = require('../utils/Logger.util');
const { formatResponse } = require('../helpers/App.helper');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  Logger.error(`Error on route ${req.originalUrl}:`, err.stack || err.message);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  return res.status(statusCode).json(
    formatResponse(false, err.message || 'Internal Server Error', null, process.env.NODE_ENV === 'development' ? err.stack : undefined)
  );
};

module.exports = errorHandler;
