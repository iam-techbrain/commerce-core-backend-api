const verifyToken = require('./Auth.middleware');
const errorHandler = require('./ErrorHandler.middleware');

module.exports = {
  verifyToken,
  errorHandler
};
