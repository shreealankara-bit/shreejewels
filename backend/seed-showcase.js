import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const SECTIONS = [
  {
    key: 'western',
    title: 'Western Collection',
    subtitle: 'Modern everyday styles inspired by your client category list',
    categories: [
      {
        name: 'Earrings',
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop',
        subcategories: ['Anti Tarnish', 'Combo Sets', 'Korean Earrings', 'Hoops', 'Office Wear Studs'],
        products: [
          { title: 'Korean Pearl Hoop', price: '₹899', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&h=900&fit=crop', label: 'Trending' },
          { title: 'Office Stud Duo', price: '₹699', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=700&h=900&fit=crop' },
          { title: 'Anti Tarnish Mini Hoops', price: '₹799', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&h=900&fit=crop' },
          { title: 'Korean Drop Earrings', price: '₹899', image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Chains',
        image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop',
        subcategories: ['Anti Tarnish', 'Fancy Chains'],
        products: [
          { title: 'Layered Gold Chain', price: '₹1,099', image: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=700&h=900&fit=crop' },
          { title: 'Minimal Pendant Chain', price: '₹999', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&h=900&fit=crop', label: 'Best Seller' },
          { title: 'Anti Tarnish Snake Chain', price: '₹1,199', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=700&h=900&fit=crop' },
          { title: 'Fancy Layer Chain', price: '₹1,299', image: 'https://images.unsplash.com/photo-1601821765780-754fa98637c1?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Rings',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop',
        subcategories: ['Statement Rings', 'Stackable Rings', 'Daily Wear Rings'],
        products: [
          { title: 'Crystal Stack Ring', price: '₹749', image: 'https://images.unsplash.com/photo-1603561596112-db7f8b7f4f88?w=700&h=900&fit=crop' },
          { title: 'Classic Dome Ring', price: '₹799', image: 'https://images.unsplash.com/photo-1588444650700-6f00df8a82f6?w=700&h=900&fit=crop' },
          { title: 'Daily Wear Solitaire Ring', price: '₹699', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=700&h=900&fit=crop' },
          { title: 'Stacked Statement Ring Set', price: '₹999', image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Bracelets',
        image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop',
        subcategories: ['Daily Wear', 'Party Wear', 'Combo Packs'],
        products: [
          { title: 'Charm Link Bracelet', price: '₹899', image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=700&h=900&fit=crop' },
          { title: 'Crystal Tennis Bracelet', price: '₹1,299', image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=700&h=900&fit=crop' },
          { title: 'Party Wear Bracelet Stack', price: '₹1,099', image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=700&h=900&fit=crop' },
          { title: 'Daily Gold Touch Bracelet', price: '₹849', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Clutches',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop',
        subcategories: ['Daily Wear', 'Party Wear', 'Fancy Hair Pins'],
        products: [
          { title: 'Party Clutch Gold', price: '₹1,499', image: 'https://images.unsplash.com/photo-1590159763121-ce484e9f2081?w=700&h=900&fit=crop' },
          { title: 'Crystal Evening Clutch', price: '₹1,799', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=700&h=900&fit=crop' },
          { title: 'Daily Carry Mini Clutch', price: '₹1,099', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&h=900&fit=crop' },
          { title: 'Wedding Party Clutch', price: '₹1,999', image: 'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Hair Accessories',
        image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=600&fit=crop',
        subcategories: ['Clips', 'Hair Stickers', 'Hair Flowers', 'Flower Clips', 'Scrunchies'],
        products: [
          { title: 'Pearl Flower Clip', price: '₹499', image: 'https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?w=700&h=900&fit=crop' },
          { title: 'Satin Bow Set', price: '₹399', image: 'https://images.unsplash.com/photo-1596704017254-9a8f652f2ed9?w=700&h=900&fit=crop' },
          { title: 'Party Wear Scrunchie Pack', price: '₹449', image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=700&h=900&fit=crop' },
          { title: 'Floral Clip Combo', price: '₹549', image: 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=700&h=900&fit=crop' },
        ],
      },
    ],
  },
  {
    key: 'traditional',
    title: 'Traditional / Indo Western',
    subtitle: 'Curated from the long-form list shared by your client',
    categories: [
      {
        name: 'Necklace',
        image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&h=600&fit=crop',
        subcategories: ['Victorian', 'Rajwadi Kundan', 'Jadau Kundan', 'Kundan', 'Moissanite', 'A.D. Stone', 'Chowkars', '1 Gram Gold Sets', 'Simple Chains'],
        products: [
          { title: 'Rajwadi Kundan Set', price: '₹2,499', image: 'https://images.unsplash.com/photo-1601821765780-754fa98637c1?w=700&h=900&fit=crop', label: 'Bridal Pick' },
          { title: 'Victorian Stone Necklace', price: '₹2,199', image: 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=700&h=900&fit=crop' },
          { title: 'Moissanite Layer Necklace', price: '₹2,899', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=700&h=900&fit=crop' },
          { title: 'A.D. Stone Choker', price: '₹2,099', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Bangles',
        image: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b2?w=600&h=600&fit=crop',
        subcategories: ['Kankanalu', 'Daily Wear Bangles', 'Stone Bangles', 'Diamond Bangles', 'Antic Bangles'],
        products: [
          { title: 'Temple Stone Bangles', price: '₹1,699', image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=700&h=900&fit=crop' },
          { title: 'Diamond Look Bangles', price: '₹1,899', image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=700&h=900&fit=crop' },
          { title: 'Daily Kankanalu Pair', price: '₹1,299', image: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b2?w=700&h=900&fit=crop' },
          { title: 'Antic Gold Bangles', price: '₹1,999', image: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Earrings ',
        image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&h=600&fit=crop',
        subcategories: ['Buttalu', 'Statement Earrings', 'Chandbalis', 'Indo Western Earrings', 'Studs', 'Changeables', 'Earrings with Cuffs', 'Cuffs', 'Bugadis'],
        products: [
          { title: 'Chandbali Drop Pair', price: '₹1,299', image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=700&h=900&fit=crop' },
          { title: 'Temple Buttalu', price: '₹1,499', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=700&h=900&fit=crop' },
          { title: 'Changeable Cuff Earrings', price: '₹1,399', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&h=900&fit=crop' },
          { title: 'Indo Western Studs', price: '₹999', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&h=900&fit=crop' },
        ],
      },
      {
        name: 'Classic Add-ons',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop',
        subcategories: ['Black Beads', 'Beads Chains', 'Moti Chains', 'Hip Belt', 'Nose Pins', 'Anklets', 'Bracelets', 'Saree Pins', 'Lokets / Pendant with Earrings', 'Tikas', 'Kids Accessories', 'Kumkum Boxes'],
        products: [
          { title: 'Moti Chain Pair', price: '₹1,199', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=700&h=900&fit=crop' },
          { title: 'Traditional Nose Pin', price: '₹699', image: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=700&h=900&fit=crop' },
          { title: 'Stone Saree Pin', price: '₹599', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=700&h=900&fit=crop' },
          { title: 'Kids Accessory Combo', price: '₹899', image: 'https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?w=700&h=900&fit=crop' },
        ],
      },
    ],
  },
];

async function main() {
  console.log('Migrating hardcoded showcase to DB...');

  for (let sIdx = 0; sIdx < SECTIONS.length; sIdx++) {
    const sec = SECTIONS[sIdx];
    // Create Root Category
    let root = await prisma.category.findFirst({ where: { name: sec.title } });
    if (!root) {
      root = await prisma.category.create({
        data: {
          name: sec.title,
          slug: `section-${sec.key}-${Date.now()}`,
          description: sec.subtitle,
          order: sIdx + 1,
        }
      });
    }

    for (let cIdx = 0; cIdx < sec.categories.length; cIdx++) {
      const cat = sec.categories[cIdx];
      // Create Sub Category
      let subCat = await prisma.category.findFirst({ where: { name: cat.name, parentCategoryId: root.id } });
      if (!subCat) {
        subCat = await prisma.category.create({
          data: {
            name: cat.name,
            slug: `cat-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
            image: cat.image,
            parentCategoryId: root.id,
            order: cIdx + 1,
            // storing tags/subcategories in metaDescription just for easy retrieval in the UI if needed
            metaDescription: cat.subcategories.join(','), 
          }
        });
      }

      // Create Products
      for (let pIdx = 0; pIdx < cat.products.length; pIdx++) {
        const prod = cat.products[pIdx];
        const numPrice = parseInt(prod.price.replace(/[^0-9]/g, ''));
        
        let existingProd = await prisma.product.findFirst({ where: { title: prod.title } });
        if (!existingProd) {
          await prisma.product.create({
            data: {
              title: prod.title,
              slug: `prod-${prod.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
              price: numPrice + 500,
              discountPrice: numPrice,
              stock: 50,
              categoryId: root.id,
              subCategoryId: subCat.id,
              images: [{ url: prod.image, isDefault: true }],
              tags: prod.label ? [prod.label] : [],
              isActive: true,
            }
          });
        }
      }
    }
  }

  console.log('Successfully migrated to DB!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
