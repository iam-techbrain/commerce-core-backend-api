const jwt = require('jsonwebtoken');
const appConfig = require('../config/app.config');
const { formatResponse } = require('../helpers/App.helper');

/**
 * Auth Middleware to verify JWT Tokens
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(
      formatResponse(false, 'Access Denied! No Authorization token provided.')
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, appConfig.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json(
      formatResponse(false, 'Invalid or Expired Token! Please login again.', null, error.message)
    );
  }
};

module.exports = verifyToken;
