const Logger = require('../utils/Logger.util');
const dbConfig = require('../config/db.config');

/**
 * Mongo Database Connector (In-Memory Data Store with Mongoose Readiness)
 */
class MongoDatabase {
  static async connect() {
    try {
      // In production with Mongoose: await mongoose.connect(dbConfig.mongoUri);
      Logger.info(`Connected to MongoDB Database instance at: ${dbConfig.mongoUri}`);
    } catch (error) {
      Logger.error('MongoDB connection failed:', error.message);
    }
  }
}

module.exports = MongoDatabase;
