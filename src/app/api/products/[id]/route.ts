import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, weight, cost, sellingPrice, status, adsCost, extraCharges, imageUrl } = body;

    const data: any = {};
    if (name) data.name = name;
    if (weight !== undefined) data.weight = weight ? parseFloat(weight) : null;
    if (cost !== undefined) data.cost = parseFloat(cost);
    if (sellingPrice !== undefined) data.sellingPrice = parseFloat(sellingPrice);
    if (adsCost !== undefined) data.adsCost = parseFloat(adsCost);
    if (extraCharges !== undefined) data.extraCharges = parseFloat(extraCharges);
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (status) data.status = status;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.product.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
