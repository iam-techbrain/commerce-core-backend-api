require('dotenv').config();

module.exports = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/saas_ecommerce',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
};
