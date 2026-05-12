const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Create or get default store
  let store = await prisma.store.findFirst();
  if (!store) {
    store = await prisma.store.create({
      data: {
        name: "Ecozed Main Store",
      },
    });
    console.log("Default store created: Ecozed Main Store");
  } else {
    console.log("Store already exists: " + store.name);
  }

  // 2. Create or update admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      password: hashedPassword,
      stores: {
        connect: { id: store.id }
      }
    },
    create: {
      username: "admin",
      password: hashedPassword,
      role: "ADMIN",
      stores: {
        connect: { id: store.id },
      },
    },
  });

  console.log("Admin user provisioned: admin / admin123");
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
