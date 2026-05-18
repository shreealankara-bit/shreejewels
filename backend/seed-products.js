import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const SAMPLE_IMAGES = [
  'https://res.cloudinary.com/demo/image/upload/v1688123114/jewelry/necklace1.jpg',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop'
];

async function main() {
  console.log('Seeding 19 realistic products...');

  // 1. Get or create a default category
  let category = await prisma.category.findFirst({ where: { name: 'Western' } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Western',
        slug: 'western-' + Date.now(),
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop',
        isActive: true
      }
    });
  }

  const productsData = Array.from({ length: 19 }).map((_, i) => ({
    title: `Premium Collection Item ${i + 1}`,
    slug: `premium-collection-item-${i + 1}-${Date.now()}`,
    description: 'Beautifully crafted jewelry piece perfect for all occasions. Made with high quality materials.',
    price: 1000 + (Math.floor(Math.random() * 50) * 100),
    discountPrice: 800 + (Math.floor(Math.random() * 40) * 100),
    stock: 50,
    categoryId: category.id,
    images: [{
      url: SAMPLE_IMAGES[i % SAMPLE_IMAGES.length],
      publicId: `sample_${i}`,
      isDefault: true
    }],
    tags: ['premium', i % 2 === 0 ? 'earring' : 'necklace'],
    isBestseller: i < 5,
    isNewArrival: i > 10,
    isActive: true,
  }));

  for (const p of productsData) {
    await prisma.product.create({
      data: p
    });
  }

  console.log('Successfully added 19 products to the database!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
