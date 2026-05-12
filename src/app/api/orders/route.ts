import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const storeIdsParam = searchParams.get("storeIds");
  
  const userStoreIds = user.storeIds || [];

  // Filter store IDs by user permissions
  let targetStoreIds = userStoreIds;
  if (storeIdsParam && storeIdsParam !== "undefined") {
    const requestedIds = storeIdsParam.split(",");
    targetStoreIds = requestedIds.filter(id => userStoreIds.includes(id));
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        AND: [
          status ? { status: status as any } : {},
          { storeId: { in: targetStoreIds } }
        ]
      },
      include: {
        product: {
          select: { 
            name: true,
            sellingPrice: true,
            cost: true,
            adsCost: true,
            extraCharges: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Check for blacklisted clients
    const phones = orders.flatMap(o => [o.clientPhone1, o.clientPhone2].filter(Boolean));
    const blacklisted = await prisma.blacklist.findMany({
      where: { phone: { in: phones as string[] } }
    });
    const blacklistMap = new Set(blacklisted.map(b => b.phone));

    const ordersWithBlacklist = orders.map(order => ({
      ...order,
      isBlacklisted: blacklistMap.has(order.clientPhone1) || (order.clientPhone2 && blacklistMap.has(order.clientPhone2))
    }));

    return NextResponse.json(ordersWithBlacklist);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      clientName, clientPhone1, clientPhone2, 
      state, city, address, 
      productId, quantity, notes,
      adsCost, totalPrice, storeId
    } = body;

    if (!clientName || !clientPhone1 || !productId || !storeId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const userStoreIds = user.storeIds || [];

    // Verify user has access to this store
    if (!userStoreIds.includes(storeId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If totalPrice is not provided, calculate it from product price
    let finalTotalPrice = totalPrice ? parseFloat(totalPrice) : null;
    if (!finalTotalPrice) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (product) {
        finalTotalPrice = product.sellingPrice * (parseInt(quantity) || 1);
      }
    }

    const order = await prisma.order.create({
      data: {
        clientName,
        clientPhone1,
        clientPhone2,
        state,
        city,
        address,
        productId,
        storeId,
        quantity: parseInt(quantity) || 1,
        totalPrice: finalTotalPrice,
        adsCost: parseFloat(adsCost) || 0,
        notes,
        status: "PENDING",
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
