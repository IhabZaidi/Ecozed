import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.ecotrackRef) {
      return NextResponse.json({ error: "Order has no tracking reference" }, { status: 400 });
    }

    let config = await prisma.ecotrackConfig.findFirst({
      where: { storeId: order.storeId, isActive: true },
    });
    if (!config) {
      config = await prisma.ecotrackConfig.findFirst({
        where: { storeId: null, isActive: true },
      });
    }

    if (!config) {
      return NextResponse.json({ error: "No active shipping provider" }, { status: 400 });
    }

    // Fetch label PDF from Ecotrack
    const labelUrl = `${config.baseUrl.replace(/\/+$/, "")}/api/v1/get/order/label?tracking=${order.ecotrackRef}`;
    console.log("[GET /api/orders/shipping/label] Fetching label from:", labelUrl);

    const apiRes = await fetch(labelUrl, {
      headers: { "Authorization": `Bearer ${config.apiKey}` },
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return NextResponse.json({ error: "Failed to fetch label", details: errText }, { status: 502 });
    }

    const pdfBuffer = await apiRes.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="label-${order.ecotrackRef}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/orders/shipping/label] Error:", error);
    return NextResponse.json({ error: "Failed to get label" }, { status: 500 });
  }
}
