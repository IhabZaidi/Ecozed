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
    const { status, clientName, clientPhone1, clientPhone2, state, city, address, notes } = body;

    const data: any = {};
    if (status) data.status = status;
    if (clientName) data.clientName = clientName;
    if (clientPhone1) data.clientPhone1 = clientPhone1;
    if (clientPhone2 !== undefined) data.clientPhone2 = clientPhone2;
    if (state) data.state = state;
    if (city) data.city = city;
    if (address) data.address = address;
    if (notes !== undefined) data.notes = notes;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data,
    });

    // Automatically blacklist if status is RETURNED
    if (status === "RETURNED") {
      const order = await prisma.order.findUnique({ where: { id } });
      if (order) {
        await prisma.blacklist.upsert({
          where: { phone: order.clientPhone1 },
          create: { phone: order.clientPhone1, reason: "Order returned" },
          update: { reason: "Order returned" },
        });
        if (order.clientPhone2) {
          await prisma.blacklist.upsert({
            where: { phone: order.clientPhone2 },
            create: { phone: order.clientPhone2, reason: "Order returned" },
            update: { reason: "Order returned" },
          });
        }
      }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
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
    await prisma.order.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
