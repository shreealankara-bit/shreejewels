const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@shreejewels.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const name = 'Admin';

  console.log(`\n🔧 Setting up admin user: ${email}`);

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hash,
      role: 'superadmin',
      isActive: true,
      name,
    },
    create: {
      email,
      password: hash,
      name,
      role: 'superadmin',
      isActive: true,
    },
  });

  console.log(`✅ Admin user ready!`);
  console.log(`   Email   : ${user.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role    : ${user.role}`);
  console.log(`   ID      : ${user.id}`);
  console.log(`\n🌐 Login at: http://localhost:3000/auth/login\n`);

  await prisma.$disconnect();
}

require('dotenv').config();
createAdmin().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
