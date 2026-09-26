const { connectPrisma } = require('./Prisma.database');
const MongoDatabase = require('./Mongo.database');
const RedisDatabase = require('./Redis.database');

const initDatabases = async () => {
  await connectPrisma();
  await MongoDatabase.connect();
  await RedisDatabase.connect();
};

module.exports = initDatabases;
