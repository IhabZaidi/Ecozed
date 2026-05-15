import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const DELIVERED_STATUSES = new Set(["livred", "encaissed", "payed"]);
const RETURNED_STATUSES = new Set(["return_asked", "return_in_transit", "Return_received"]);

function classifyActivities(activities: { status: string }[]): string {
  for (const act of activities) {
    const s = act.status?.toLowerCase() || "";
    if (DELIVERED_STATUSES.has(s)) return "DELIVERED";
  }
  for (const act of activities) {
    const s = act.status?.toLowerCase() || "";
    if (RETURNED_STATUSES.has(s)) return "RETURNED";
  }
  return "CONFIRMED";
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  console.log("[SYNC-TRACKING] ==================== START ====================");
  const user = await getAuthUser();
  if (!user) {
    console.log("[SYNC-TRACKING] FAILED: Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("[SYNC-TRACKING] User authenticated:", { id: user.id, username: user.username, role: user.role, storeIds: user.storeIds });

  try {
    const body = await req.json().catch(() => ({}));
    const ids: string[] | undefined = body?.ids;
    console.log("[SYNC-TRACKING] Request body:", JSON.stringify(body));

    const userStoreIds = user.storeIds || [];

    const where: any = {
      storeId: { in: userStoreIds },
      sentToEcotrack: true,
      ecotrackRef: { not: null },
    };
    if (ids && Array.isArray(ids) && ids.length > 0) {
      where.id = { in: ids };
      console.log("[SYNC-TRACKING] Filtering by specific IDs:", ids);
    }

    console.log("[SYNC-TRACKING] DB query where:", JSON.stringify(where));
    const orders = await prisma.order.findMany({
      where,
      select: { id: true, storeId: true, ecotrackRef: true, status: true },
    });
    console.log("[SYNC-TRACKING] Found", orders.length, "sent order(s):", orders.map(o => ({ id: o.id, storeId: o.storeId, ref: o.ecotrackRef, status: o.status })));

    if (orders.length === 0) {
      console.log("[SYNC-TRACKING] No sent orders found, returning early");
      return NextResponse.json({ success: true, total: 0, updated: 0, message: "No sent orders found" });
    }

    // Group by store
    const storeMap = new Map<string, { config: any; orders: typeof orders }>();
    let globalConfig: any = null;
    for (const order of orders) {
      if (!storeMap.has(order.storeId)) {
        let config = await prisma.ecotrackConfig.findFirst({
          where: { storeId: order.storeId, isActive: true },
        });
        console.log("[SYNC-TRACKING] Store", order.storeId, "config:", config ? { id: config.id, prefix: config.prefix, baseUrl: config.baseUrl } : "NOT FOUND");
        if (!config) {
          if (!globalConfig) {
            globalConfig = await prisma.ecotrackConfig.findFirst({
              where: { storeId: null, isActive: true },
            });
            console.log("[SYNC-TRACKING] Global config:", globalConfig ? { id: globalConfig.id, prefix: globalConfig.prefix, baseUrl: globalConfig.baseUrl } : "NOT FOUND");
          }
          config = globalConfig;
        }
        if (!config) {
          console.log("[SYNC-TRACKING] No config for store", order.storeId, "- skipping");
          continue;
        }
        storeMap.set(order.storeId, { config, orders: [] });
      }
      storeMap.get(order.storeId)!.orders.push(order);
    }
    console.log("[SYNC-TRACKING] Grouped into", storeMap.size, "store group(s):", Array.from(storeMap.entries()).map(([sid, g]) => `${sid}: ${g.orders.length} order(s)`));

    const allResults: { id: string; ecotrackRef: string; status: string; newOrderStatus: string }[] = [];

    for (const [storeId, { config, orders: storeOrders }] of storeMap) {
      console.log("[SYNC-TRACKING] Processing store:", storeId, "with", storeOrders.length, "order(s)");
      const cleanBaseUrl = config.baseUrl.replace(/\/+$/, "");

      for (let i = 0; i < storeOrders.length; i++) {
        const order = storeOrders[i];

        // Rate limit: 50 req/min = 1 per 1.2s; delay 1.5s between requests
        if (i > 0) {
          await delay(1500);
        }

        const url = `${cleanBaseUrl}/api/v1/get/tracking/info?tracking=${order.ecotrackRef}`;
        console.log("[SYNC-TRACKING] Fetching tracking", i + 1, "of", storeOrders.length, "| URL:", url);

        try {
          const apiRes = await fetch(url, {
            headers: { "Authorization": `Bearer ${config.apiKey}` },
          });

          const responseText = await apiRes.text();
          console.log("[SYNC-TRACKING] Response status:", apiRes.status, "| body:", responseText.slice(0, 500));

          if (!apiRes.ok) {
            if (apiRes.status === 429) {
              return NextResponse.json({ error: "Rate limit exceeded (50 req/min). Please wait a moment and try again.", rateLimited: true }, { status: 429 });
            }
            console.log("[SYNC-TRACKING] Skipping order", order.id, "- API error");
            allResults.push({ id: order.id, ecotrackRef: order.ecotrackRef!, status: "error", newOrderStatus: "CONFIRMED" });
            continue;
          }

          let apiData: any;
          try {
            apiData = JSON.parse(responseText);
          } catch (parseErr) {
            console.error("[SYNC-TRACKING] Failed to parse response:", parseErr);
            continue;
          }

          console.log("[SYNC-TRACKING] Parsed data:", JSON.stringify(apiData).slice(0, 300));

          const activities: { status: string }[] = apiData.activity || [];
          console.log("[SYNC-TRACKING] Ref:", order.ecotrackRef, "| Activities:", activities.map(a => a.status).join(" -> "));

          const newOrderStatus = classifyActivities(activities);
          console.log("[SYNC-TRACKING] Ref:", order.ecotrackRef, "| classified as:", newOrderStatus, "| current status:", order.status);

          if (newOrderStatus !== order.status && newOrderStatus !== "CONFIRMED") {
            console.log("[SYNC-TRACKING] UPDATING order", order.id, "from", order.status, "to", newOrderStatus);
            await prisma.order.update({
              where: { id: order.id },
              data: { status: newOrderStatus as any },
            });
          } else {
            console.log("[SYNC-TRACKING] No update for order", order.id, "(current:", order.status, "-> new:", newOrderStatus, ")");
          }

          // Get latest activity status for reporting
          const latestStatus = activities.length > 0 ? activities[activities.length - 1].status : "unknown";

          allResults.push({
            id: order.id,
            ecotrackRef: order.ecotrackRef!,
            status: latestStatus,
            newOrderStatus,
          });
        } catch (err) {
          console.error("[SYNC-TRACKING] Fetch error for", order.ecotrackRef, ":", err);
        }
      }
    }

    const updated = allResults.filter(r => r.newOrderStatus !== "CONFIRMED").length;
    console.log("[SYNC-TRACKING] Done. total:", orders.length, "processed:", allResults.length, "updated:", updated);
    console.log("[SYNC-TRACKING] Results:", JSON.stringify(allResults));
    console.log("[SYNC-TRACKING] ==================== END SUCCESS ====================");

    return NextResponse.json({
      success: true,
      total: orders.length,
      processed: allResults.length,
      updated,
      results: allResults,
    });
  } catch (error) {
    console.log("[SYNC-TRACKING] ==================== END ERROR ====================");
    console.error("[SYNC-TRACKING] Error:", error);
    if (error instanceof Error) {
      console.log("[SYNC-TRACKING] Error name:", error.name);
      console.log("[SYNC-TRACKING] Error message:", error.message);
      console.log("[SYNC-TRACKING] Error stack:", error.stack);
    }
    return NextResponse.json({ error: "Failed to sync tracking" }, { status: 500 });
  }
}
