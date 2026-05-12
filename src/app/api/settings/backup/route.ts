import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = {
      stores: await prisma.store.findMany(),
      users: await prisma.user.findMany({
        include: { stores: { select: { id: true } } }
      }),
      products: await prisma.product.findMany(),
      orders: await prisma.order.findMany(),
      blacklist: await prisma.blacklist.findMany(),
      timestamp: new Date().toISOString(),
      version: "1.0"
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
  }
}
