require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  supportEmail: process.env.SUPPORT_EMAIL || 'afzal@schooldigitalised.com',
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key_123',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_U8x8IJzoiGUV9Q',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'E0SuPWhDjPy4w6kAmibbmEAA'
  }
};
