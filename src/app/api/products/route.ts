import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, weight, cost, sellingPrice, status, adsCost, extraCharges, imageUrl } = body;

    if (!name || cost === undefined || sellingPrice === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        weight: weight ? parseFloat(weight) : null,
        cost: parseFloat(cost),
        sellingPrice: parseFloat(sellingPrice),
        adsCost: adsCost ? parseFloat(adsCost) : 0,
        extraCharges: extraCharges ? parseFloat(extraCharges) : 0,
        imageUrl: imageUrl || null,
        status: status || "DRAFT",
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
