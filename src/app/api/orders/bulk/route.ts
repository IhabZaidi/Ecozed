import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || !status) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const userStoreIds = user.storeIds || [];

    const updatedOrders = await prisma.order.updateMany({
      where: { 
        id: { in: ids },
        storeId: { in: userStoreIds }
      },
      data: { status },
    });

    // If status is RETURNED, handle blacklisting for all affected orders
    if (status === "RETURNED") {
      const orders = await prisma.order.findMany({
        where: { 
          id: { in: ids },
          storeId: { in: userStoreIds }
        }
      });
      
      for (const order of orders) {
        await prisma.blacklist.upsert({
          where: { phone: order.clientPhone1 },
          create: { phone: order.clientPhone1, reason: "Bulk Order returned" },
          update: { reason: "Bulk Order returned" },
        });
        if (order.clientPhone2) {
          await prisma.blacklist.upsert({
            where: { phone: order.clientPhone2 },
            create: { phone: order.clientPhone2, reason: "Bulk Order returned" },
            update: { reason: "Bulk Order returned" },
          });
        }
      }
    }

    return NextResponse.json({ success: true, count: updatedOrders.count });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json({ error: "Failed to perform bulk update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const idsString = searchParams.get("ids");
    if (!idsString) return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
    
    const ids = idsString.split(",");
    const userStoreIds = user.storeIds || [];

    await prisma.order.deleteMany({
      where: { 
        id: { in: ids },
        storeId: { in: userStoreIds }
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to perform bulk delete" }, { status: 500 });
  }
}
