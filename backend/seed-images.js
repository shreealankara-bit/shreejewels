require('dotenv').config();
const prisma = require('./config/prisma');
const connectDB = require('./config/db');

// ── Beautiful curated jewelry images for each category ──
const CATEGORY_IMAGES = {
  'Western':               'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop&q=80',
  'Earrings':              'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop&q=80',
  'Anti Tarnish':          'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop&q=80',
  'Combo Sets':            'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=600&fit=crop&q=80',
  'Korean Earrings':       'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop&q=80',
  'Hoops':                 'https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?w=600&h=600&fit=crop&q=80',
  'Office Wear Studs':     'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&h=600&fit=crop&q=80',
  'Chains':                'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop&q=80',
  'Anti Tarnish Chains':   'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop&q=80',
  'Fancy Chains':          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop&q=80',
  'Rings':                 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop&q=80',
  'Bracelets':             'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&h=600&fit=crop&q=80',
  'Clutches':              'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop&q=80',
  'Hair Accessories':      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=600&fit=crop&q=80',
  'Traditional / Indo Western': 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&h=600&fit=crop&q=80',
  'Necklace':              'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&h=600&fit=crop&q=80',
  'Bangles':               'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b2?w=600&h=600&fit=crop&q=80',
  'Traditional Earrings':  'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&h=600&fit=crop&q=80',
  'Others':                'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop&q=80',
};

// ── Real jewelry product data with beautiful Unsplash images ──
const PRODUCTS = [
  // Western - Earrings
  { title: 'Korean Pearl Drop Earrings', tags: ['korean', 'earring', 'pearl'], price: 899, disc: 699, bestseller: true, newArrival: false,
    imgs: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&h=875&fit=crop&q=80','https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=700&h=875&fit=crop&q=80'] },
  { title: 'Anti Tarnish Gold Hoops', tags: ['anti-tarnish', 'earring', 'hoop'], price: 799, disc: 599, bestseller: true, newArrival: false,
    imgs: ['https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?w=700&h=875&fit=crop&q=80','https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=700&h=875&fit=crop&q=80'] },
  { title: 'Office Wear Crystal Studs', tags: ['office', 'earring', 'crystal'], price: 599, disc: 449, bestseller: false, newArrival: true,
    imgs: ['https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=700&h=875&fit=crop&q=80'] },
  { title: 'Dainty Floral Ear Studs', tags: ['earring', 'floral', 'daily'], price: 499, disc: 399, bestseller: false, newArrival: true,
    imgs: ['https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=700&h=875&fit=crop&q=80'] },
  { title: 'Rose Gold Hoop Combo Set', tags: ['combo', 'earring', 'hoop', 'rose-gold'], price: 1199, disc: 899, bestseller: true, newArrival: false,
    imgs: ['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=700&h=875&fit=crop&q=80','https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?w=700&h=875&fit=crop&q=80'] },

  // Western - Chains
  { title: 'Layered Gold Satellite Chain', tags: ['chain', 'layered', 'gold'], price: 1099, disc: 849, bestseller: true, newArrival: false,
    imgs: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=700&h=875&fit=crop&q=80','https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&h=875&fit=crop&q=80'] },
  { title: 'Anti Tarnish Snake Chain', tags: ['anti-tarnish', 'chain', 'snake'], price: 1299, disc: 999, bestseller: false, newArrival: true,
    imgs: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&h=875&fit=crop&q=80'] },
  { title: 'Minimal Pendant Necklace', tags: ['chain', 'pendant', 'minimal'], price: 899, disc: 699, bestseller: false, newArrival: true,
    imgs: ['https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=700&h=875&fit=crop&q=80'] },

  // Western - Rings
  { title: 'Crystal Stackable Ring Set', tags: ['ring', 'crystal', 'stackable'], price: 799, disc: 599, bestseller: true, newArrival: false,
    imgs: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=700&h=875&fit=crop&q=80','https://images.unsplash.com/photo-1603561596112-db7f8b7f4f88?w=700&h=875&fit=crop&q=80'] },
  { title: 'Daily Wear Solitaire Ring', tags: ['ring', 'solitaire', 'daily'], price: 699, disc: 549, bestseller: false, newArrival: true,
    imgs: ['https://images.unsplash.com/photo-1603561596112-db7f8b7f4f88?w=700&h=875&fit=crop&q=80'] },

  // Western - Bracelets
  { title: 'Crystal Tennis Bracelet', tags: ['bracelet', 'crystal', 'tennis'], price: 1299, disc: 999, bestseller: true, newArrival: false,
    imgs: ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=700&h=875&fit=crop&q=80','https://images.unsplash.com/photo-1630019852942-f89202989a59?w=700&h=875&fit=crop&q=80'] },
  { title: 'Charm Link Gold Bracelet', tags: ['bracelet', 'charm', 'gold'], price: 899, disc: 699, bestseller: false, newArrival: true,
    imgs: ['https://images.unsplash.com/photo-1630019852942-f89202989a59?w=700&h=875&fit=crop&q=80'] },

  // Traditional - Necklace
  { title: 'Rajwadi Kundan Choker Set', tags: ['kundan', 'necklace', 'traditional', 'bridal'], price: 2499, disc: 1999, bestseller: true, newArrival: false,
    imgs: ['https://images.unsplash.com/photo-1601821765780-754fa98637c1?w=700&h=875&fit=crop&q=80','https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=700&h=875&fit=crop&q=80'] },
  { title: 'Victorian AD Stone Necklace', tags: ['ad-stone', 'necklace', 'victorian'], price: 2199, disc: 1749, bestseller: false, newArrival: true,
    imgs: ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=700&h=875&fit=crop&q=80'] },
  { title: 'Moissanite Layer Necklace Set', tags: ['moissanite', 'necklace', 'festive'], price: 2899, disc: 2299, bestseller: true, newArrival: false,
    imgs: ['https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=700&h=875&fit=crop&q=80'] },
  { title: 'Jadau Kundan Bridal Set', tags: ['jadau', 'kundan', 'necklace', 'bridal'], price: 3499, disc: 2799, bestseller: true, newArrival: false,
    imgs: ['https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=700&h=875&fit=crop&q=80'] },

  // Traditional - Bangles
  { title: 'Temple Stone Bangle Set', tags: ['bangles', 'traditional', 'stone'], price: 1699, disc: 1349, bestseller: false, newArrival: true,
    imgs: ['https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b2?w=700&h=875&fit=crop&q=80'] },
  { title: 'Diamond Look Kankanalu Pair', tags: ['bangles', 'diamond', 'daily'], price: 1899, disc: 1499, bestseller: true, newArrival: false,
    imgs: ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=700&h=875&fit=crop&q=80'] },

  // Traditional - Earrings
  { title: 'Chandbali Drop Earrings', tags: ['chandbali', 'earring', 'traditional'], price: 1299, disc: 999, bestseller: true, newArrival: false,
    imgs: ['https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=700&h=875&fit=crop&q=80','https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=700&h=875&fit=crop&q=80'] },
  { title: 'Temple Buttalu Gold Earrings', tags: ['buttalu', 'earring', 'temple', 'traditional'], price: 1499, disc: 1199, bestseller: false, newArrival: true,
    imgs: ['https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=700&h=875&fit=crop&q=80'] },
  { title: 'Indo Western Changeable Studs', tags: ['earring', 'indo-western', 'changeable'], price: 1099, disc: 849, bestseller: false, newArrival: true,
    imgs: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&h=875&fit=crop&q=80'] },
];

const slugify = (t) => t.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

async function seed() {
  try {
    await connectDB();
    console.log('🌱 Starting image + product seed...\n');

    // 1. Update all category images
    const allCats = await prisma.category.findMany();
    let updated = 0;
    for (const cat of allCats) {
      const imgUrl = CATEGORY_IMAGES[cat.name];
      if (imgUrl && !cat.image) {
        await prisma.category.update({ where: { id: cat.id }, data: { image: imgUrl } });
        console.log(`  ✅ Updated image: ${cat.name}`);
        updated++;
      } else if (cat.image) {
        console.log(`  ⏭️  Already has image: ${cat.name}`);
      } else {
        console.log(`  ⚠️  No image mapping for: ${cat.name}`);
      }
    }
    console.log(`\n📷 Updated ${updated} category images\n`);

    // 2. Check if products already exist
    const existingCount = await prisma.product.count();
    if (existingCount > 0) {
      console.log(`ℹ️  ${existingCount} products already exist. Skipping product seed.`);
      console.log('   (Delete products from admin to re-seed)\n');
    } else {
      // 3. Seed products
      const western = await prisma.category.findFirst({ where: { name: 'Western', parentCategoryId: null } });
      const traditional = await prisma.category.findFirst({ where: { name: 'Traditional / Indo Western', parentCategoryId: null } });
      const earrings = await prisma.category.findFirst({ where: { name: 'Earrings', parentCategoryId: { not: null } } });
      const necklace = await prisma.category.findFirst({ where: { name: 'Necklace' } });
      const bangles = await prisma.category.findFirst({ where: { name: 'Bangles' } });
      const tradEarrings = await prisma.category.findFirst({ where: { name: 'Traditional Earrings' } });

      const catMap = {
        'earring': earrings?.id || western?.id,
        'chain': (await prisma.category.findFirst({ where: { name: 'Chains' } }))?.id || western?.id,
        'ring': (await prisma.category.findFirst({ where: { name: 'Rings' } }))?.id || western?.id,
        'bracelet': (await prisma.category.findFirst({ where: { name: 'Bracelets' } }))?.id || western?.id,
        'necklace': necklace?.id || traditional?.id,
        'bangles': bangles?.id || traditional?.id,
        'chandbali': tradEarrings?.id || traditional?.id,
        'buttalu': tradEarrings?.id || traditional?.id,
        'kundan': necklace?.id || traditional?.id,
      };

      const defaultCatId = western?.id;
      if (!defaultCatId) { console.log('❌ No categories found. Run the main seed first.'); process.exit(1); }

      let seeded = 0;
      for (const p of PRODUCTS) {
        // Pick best category by tag
        const catId = p.tags.map(t => catMap[t]).find(Boolean) || defaultCatId;
        const discPct = Math.round((1 - p.disc / p.price) * 100);

        await prisma.product.create({
          data: {
            title: p.title,
            slug: `${slugify(p.title)}-${Date.now()}-${seeded}`,
            description: `Beautifully crafted ${p.title}. Perfect for every occasion, made with premium quality materials. A must-have addition to your jewellery collection.`,
            price: p.price,
            discountPrice: p.disc,
            discountPercent: discPct,
            stock: Math.floor(Math.random() * 40) + 10,
            categoryId: catId,
            images: p.imgs.map((url, i) => ({ url, publicId: `seed_${seeded}_${i}`, isDefault: i === 0 })),
            tags: p.tags,
            isBestseller: p.bestseller,
            isNewArrival: p.newArrival,
            isFeatured: p.bestseller,
            isActive: true,
            ratingsAverage: parseFloat((3.8 + Math.random() * 1.2).toFixed(1)),
            ratingsCount: Math.floor(Math.random() * 80) + 5,
          },
        });
        process.stdout.write(`  ✅ ${p.title}\n`);
        seeded++;
      }
      console.log(`\n🎁 Seeded ${seeded} products!\n`);
    }

    console.log('✨ Done! Refresh http://localhost:3000 to see images and products.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
