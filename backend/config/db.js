const prisma = require('./prisma');

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL (Neon) connected');
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
