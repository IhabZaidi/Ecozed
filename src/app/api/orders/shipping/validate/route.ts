import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
      where: { id: { in: ids }, storeId: { in: userStoreIds }, sentToEcotrack: true, ecotrackRef: { not: null } },
      include: { store: { select: { id: true } } },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "No sent orders found to validate" }, { status: 400 });
    }

    // Group by store
    const storeOrders = new Map<string, typeof orders>();
    for (const order of orders) {
      const group = storeOrders.get(order.storeId) || [];
      group.push(order);
      storeOrders.set(order.storeId, group);
    }

    const results: { id: string; ref: string; success: boolean }[] = [];

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
        console.error(`[POST /api/orders/shipping/validate] No config for store ${storeId}, skipping ${storeOrds.length} orders`);
        continue;
      }

      for (let i = 0; i < storeOrds.length; i++) {
        const order = storeOrds[i];

        // Rate limit: 50 req/min = 1 per 1.2s; delay 1.5s between requests
        if (i > 0) {
          await delay(1500);
        }

        const validateUrl = `${config.baseUrl.replace(/\/+$/, "")}/api/v1/valid/order?tracking=${order.ecotrackRef}&ask_collection=0`;
        console.log("[POST /api/orders/shipping/validate] Validating:", order.ecotrackRef);

        try {
          const apiRes = await fetch(validateUrl, {
            method: "POST",
            headers: { "Authorization": `Bearer ${config.apiKey}` },
          });

          const apiData = await apiRes.json();
          console.log("[POST /api/orders/shipping/validate] Response:", apiData);

          if (apiRes.ok) {
            await prisma.order.update({
              where: { id: order.id },
              data: { ecotrackValidated: true, ecotrackValidatedAt: new Date() },
            });
            results.push({ id: order.id, ref: order.ecotrackRef!, success: true });
          } else {
            if (apiRes.status === 429) {
              return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment and try again.", rateLimited: true }, { status: 429 });
            }
            results.push({ id: order.id, ref: order.ecotrackRef!, success: false });
          }
        } catch (err) {
          console.error("[POST /api/orders/shipping/validate] Error for", order.ecotrackRef, err);
          results.push({ id: order.id, ref: order.ecotrackRef!, success: false });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    return NextResponse.json({ success: true, total: results.length, validated: successCount, results });
  } catch (error) {
    console.error("[POST /api/orders/shipping/validate] Error:", error);
    return NextResponse.json({ error: "Failed to validate orders" }, { status: 500 });
  }
}
