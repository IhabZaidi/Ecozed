import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.development" });

import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.log("Usage: npx tsx scripts/create-admin.ts <username> <password>");
    process.exit(1);
  }

  const hashedPassword = await hashPassword(password);

  try {
    const admin = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: "ADMIN",
        permissions: ["all"],
      },
    });
    console.log(`Admin account created: ${admin.username}`);
  } catch (error) {
    console.error("Error creating admin account:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
