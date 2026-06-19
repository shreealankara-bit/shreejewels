const prisma = require('./prisma');

const connectDB = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ PostgreSQL (Neon) connected');
      return;
    } catch (error) {
      console.error(`❌ DB connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`   Retrying in ${delay / 1000}s... (Neon may be waking up)`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error('   Max retries reached. Exiting.');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
