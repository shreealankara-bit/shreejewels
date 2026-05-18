import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const westernOld = await prisma.category.findFirst({ where: { name: 'Western' } });
  const westernNew = await prisma.category.findFirst({ where: { name: 'Western Collection' } });

  if (westernOld && westernNew) {
    // Re-assign products
    await prisma.product.updateMany({
      where: { categoryId: westernOld.id },
      data: { categoryId: westernNew.id }
    });

    // Delete old category
    await prisma.category.delete({
      where: { id: westernOld.id }
    });
    console.log('Fixed DB: Deleted old Western and moved products.');
  } else {
    console.log('No fix needed or categories not found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
