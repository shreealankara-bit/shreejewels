require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const connectDB = require('../config/db');

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

const CATEGORIES_SEED = [
  { name: 'Western', parentName: null, order: 1 },
  { name: 'Earrings', parentName: 'Western', order: 1 },
  { name: 'Anti Tarnish', parentName: 'Earrings (Western)', order: 1 },
  { name: 'Combo Sets', parentName: 'Earrings (Western)', order: 2 },
  { name: 'Korean Earrings', parentName: 'Earrings (Western)', order: 3 },
  { name: 'Hoops', parentName: 'Earrings (Western)', order: 4 },
  { name: 'Office Wear Studs', parentName: 'Earrings (Western)', order: 5 },
  { name: 'Chains', parentName: 'Western', order: 2 },
  { name: 'Anti Tarnish Chains', parentName: 'Chains', order: 1 },
  { name: 'Fancy Chains', parentName: 'Chains', order: 2 },
  { name: 'Rings', parentName: 'Western', order: 3 },
  { name: 'Bracelets', parentName: 'Western', order: 4 },
  { name: 'Clutches', parentName: 'Western', order: 5 },
  { name: 'Hair Accessories', parentName: 'Western', order: 7 },
  { name: 'Traditional / Indo Western', parentName: null, order: 2 },
  { name: 'Necklace', parentName: 'Traditional / Indo Western', order: 1 },
  { name: 'Bangles', parentName: 'Traditional / Indo Western', order: 6 },
  { name: 'Traditional Earrings', parentName: 'Traditional / Indo Western', order: 7 },
  { name: 'Others', parentName: 'Traditional / Indo Western', order: 8 },
];

async function seed() {
  try {
    await connectDB();

    await prisma.productReview.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.banner.deleteMany();
    await prisma.category.deleteMany();

    const nameToId = {};
    const aliases = { 'Earrings (Western)': 'Earrings' };

    for (const cat of CATEGORIES_SEED) {
      const baseSlug = slugify(cat.name);
      let slug = baseSlug;
      let idx = 1;
      while (await prisma.category.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${idx++}`;
      }

      const parentLookup = cat.parentName ? aliases[cat.parentName] || cat.parentName : null;
      const parentId = parentLookup ? nameToId[parentLookup] || null : null;

      const created = await prisma.category.create({
        data: {
          name: cat.name,
          slug,
          parentCategoryId: parentId,
          order: cat.order,
          isActive: true,
        },
      });
      nameToId[cat.name] = created.id;
      process.stdout.write('.');
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shreejewels.com';
    await prisma.user.deleteMany({ where: { email: adminEmail } });

    await prisma.user.create({
      data: {
        name: 'ShreeJewels Admin',
        email: adminEmail,
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12),
        role: 'superadmin',
      },
    });

    console.log('\n✅ Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
