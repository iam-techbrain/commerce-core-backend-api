const { PrismaClient } = require('@prisma/client');
const Logger = require('../utils/Logger.util');

const prisma = new PrismaClient();

const connectPrisma = async () => {
  try {
    await prisma.$connect();
    Logger.info('Prisma ORM connected to SQLite Database successfully!');
  } catch (error) {
    Logger.error('Prisma connection error:', error.message);
  }
};

module.exports = { prisma, connectPrisma };
