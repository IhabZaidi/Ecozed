import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, websiteUrl } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const updatedStore = await prisma.store.update({
      where: { id },
      data: { name, description, websiteUrl }
    });

    return NextResponse.json(updatedStore);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update store" }, { status: 500 });
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
    // Check if store is empty before deleting (optional but safer)
    const store = await prisma.store.findUnique({
      where: { id },
      include: { _count: { select: { products: true, orders: true } } }
    });

    if (store && (store._count.products > 0 || store._count.orders > 0)) {
       // Allow deleting if user insists, but maybe show a warning in UI
    }

    await prisma.store.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete store" }, { status: 500 });
  }
}
