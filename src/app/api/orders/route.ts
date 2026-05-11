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

  try {
    const orders = await prisma.order.findMany({
      where: status ? { status: status as any } : {},
      include: {
        product: {
          select: { name: true }
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
      productId, quantity, notes 
    } = body;

    if (!clientName || !clientPhone1 || !productId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
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
        quantity: parseInt(quantity) || 1,
        notes,
        status: "PENDING",
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
