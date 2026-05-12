import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const backupData = await req.json();

    if (!backupData.stores || !backupData.products) {
      return NextResponse.json({ error: "Invalid backup file" }, { status: 400 });
    }

    // Execute restore in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Clear existing data in reverse order
      await tx.order.deleteMany();
      await tx.product.deleteMany();
      
      // Delete user relations first
      await tx.$executeRaw`DELETE FROM "_UserStores"`;
      await tx.user.deleteMany();
      await tx.store.deleteMany();
      await tx.blacklist.deleteMany();

      // 2. Insert data in dependency order
      // Insert Stores
      for (const store of backupData.stores) {
        await tx.store.create({ data: store });
      }

      // Insert Users
      for (const u of backupData.users) {
        const { stores, ...userData } = u;
        const createdUser = await tx.user.create({ data: userData });
        
        // Connect stores
        if (stores && stores.length > 0) {
          for (const s of stores) {
            await tx.user.update({
              where: { id: createdUser.id },
              data: {
                stores: { connect: { id: s.id } }
              }
            });
          }
        }
      }

      // Insert Products
      for (const p of backupData.products) {
        await tx.product.create({ data: p });
      }

      // Insert Orders
      for (const o of backupData.orders) {
        await tx.order.create({ data: o });
      }

      // Insert Blacklist
      for (const b of backupData.blacklist) {
        await tx.blacklist.create({ data: b });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Failed to restore data: " + (error as any).message }, { status: 500 });
  }
}
