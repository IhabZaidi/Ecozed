import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const storeIdsParam = searchParams.get("storeIds");
  
  const userStoreIds = user.storeIds || [];

  let targetStoreIds = userStoreIds;
  if (storeIdsParam && storeIdsParam !== "undefined") {
    const requestedIds = storeIdsParam.split(",");
    targetStoreIds = requestedIds.filter(id => userStoreIds.includes(id));
  }

  try {
    const [orderCount, pendingCount, productCount, orders] = await Promise.all([
      prisma.order.count({ where: { storeId: { in: targetStoreIds } } }),
      prisma.order.count({ where: { storeId: { in: targetStoreIds }, status: "PENDING" } }),
      prisma.product.count({ where: { storeId: { in: targetStoreIds } } }),
      prisma.order.findMany({
        where: { storeId: { in: targetStoreIds } },
        include: { product: true }
      })
    ]);

    // Calculate total sales/revenue
    const totalSales = orders.reduce((sum, order) => {
      const revenue = order.totalPrice || (order.product.sellingPrice * order.quantity);
      return sum + revenue;
    }, 0);

    return NextResponse.json({
      orderCount,
      pendingCount,
      productCount,
      totalSales
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
