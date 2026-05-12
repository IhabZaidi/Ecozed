import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids, action, data } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    const userStoreIds = user.storeIds || [];

    if (action === "delete") {
      await prisma.product.deleteMany({
        where: { 
          id: { in: ids },
          storeId: { in: userStoreIds }
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "update") {
      const updateData: any = {};
      if (data.status) updateData.status = data.status;
      if (data.cost !== undefined) updateData.cost = parseFloat(data.cost);
      if (data.sellingPrice !== undefined) updateData.sellingPrice = parseFloat(data.sellingPrice);

      await prisma.product.updateMany({
        where: { 
          id: { in: ids },
          storeId: { in: userStoreIds }
        },
        data: updateData,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Bulk action error:", error);
    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}
