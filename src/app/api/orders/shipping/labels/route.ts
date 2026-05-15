import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });
    }

    const userStoreIds = user.storeIds || [];

    const orders = await prisma.order.findMany({
      where: { id: { in: ids }, storeId: { in: userStoreIds }, ecotrackRef: { not: null } },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "No orders with tracking found" }, { status: 400 });
    }

    // Group by store
    const storeOrders = new Map<string, typeof orders>();
    for (const order of orders) {
      const group = storeOrders.get(order.storeId) || [];
      group.push(order);
      storeOrders.set(order.storeId, group);
    }

    // Fetch all labels from Ecotrack, grouped by store
    const pdfBuffers: Uint8Array[] = [];
    for (const [storeId, storeOrds] of storeOrders) {
      // Try store-specific config, then fall back to global (storeId: null)
      let config = await prisma.ecotrackConfig.findFirst({
        where: { storeId, isActive: true },
      });
      if (!config) {
        config = await prisma.ecotrackConfig.findFirst({
          where: { storeId: null, isActive: true },
        });
      }

      if (!config) {
        console.error(`[POST /api/orders/shipping/labels] No config for store ${storeId}, skipping ${storeOrds.length} orders`);
        continue;
      }

      for (const order of storeOrds) {
        const labelUrl = `${config.baseUrl.replace(/\/+$/, "")}/api/v1/get/order/label?tracking=${order.ecotrackRef}`;
        console.log("[POST /api/orders/shipping/labels] Fetching label:", labelUrl);

        try {
          const apiRes = await fetch(labelUrl, {
            headers: { "Authorization": `Bearer ${config.apiKey}` },
          });
          if (apiRes.ok) {
            const buf = await apiRes.arrayBuffer();
            pdfBuffers.push(new Uint8Array(buf));
          }
        } catch (err) {
          console.error("[POST /api/orders/shipping/labels] Error for", order.ecotrackRef, err);
        }
      }
    }

    if (pdfBuffers.length === 0) {
      return NextResponse.json({ error: "Failed to fetch any labels" }, { status: 502 });
    }

    // Merge all PDFs into one document
    const mergedPdf = await PDFDocument.create();
    for (const buf of pdfBuffers) {
      try {
        const subDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await mergedPdf.copyPages(subDoc, subDoc.getPageIndices());
        for (const page of pages) {
          mergedPdf.addPage(page);
        }
      } catch (err) {
        console.error("[POST /api/orders/shipping/labels] Error merging PDF:", err);
      }
    }

    const mergedBytes = await mergedPdf.save();
    const body = Buffer.from(mergedBytes);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="labels-${orders.length}-orders.pdf"`,
      },
    });
  } catch (error) {
    console.error("[POST /api/orders/shipping/labels] Error:", error);
    return NextResponse.json({ error: "Failed to get labels" }, { status: 500 });
  }
}
