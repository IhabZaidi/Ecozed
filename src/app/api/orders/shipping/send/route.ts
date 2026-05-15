import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import communes from "@/data/communes.json";

function normalizePhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("00213")) cleaned = cleaned.slice(2);
  if (cleaned.startsWith("213") && cleaned.length > 10) cleaned = cleaned.slice(3);
  if (cleaned.length === 9) cleaned = "0" + cleaned;
  return cleaned.slice(0, 10);
}

export async function POST(req: NextRequest) {
  console.log("[SEND] ==================== START send orders ====================");

  // STEP 1: Authenticate user
  console.log("[SEND] Step 1: Authenticating user...");
  const user = await getAuthUser();
  console.log("[SEND] Step 1 result: user =", user ? { id: user.id, username: user.username, role: user.role, storeIds: user.storeIds } : "null");
  if (!user) {
    console.log("[SEND] Step 1 FAILED: No authenticated user, returning 401");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("[SEND] Step 1 PASSED: User authenticated");

  try {
    // STEP 2: Parse request body
    console.log("[SEND] Step 2: Parsing request body...");
    let ids: string[];
    try {
      const body = await req.json();
      ids = body?.ids;
      console.log("[SEND] Step 2 result: ids =", ids);
    } catch (parseErr) {
      console.log("[SEND] Step 2 FAILED: Could not parse JSON body:", parseErr);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      console.log("[SEND] Step 2 FAILED: ids is empty, not an array, or missing. ids =", ids);
      return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });
    }
    console.log("[SEND] Step 2 PASSED: Received", ids.length, "order ID(s):", ids);

    // STEP 3: Get user's accessible store IDs
    console.log("[SEND] Step 3: Getting user's accessible store IDs...");
    const userStoreIds = user.storeIds || [];
    console.log("[SEND] Step 3 result: userStoreIds =", userStoreIds);

    // STEP 4: Fetch orders from DB
    console.log("[SEND] Step 4: Fetching orders from DB with ids=", ids, "and storeIds=", userStoreIds);
    const orders = await prisma.order.findMany({
      where: { id: { in: ids }, storeId: { in: userStoreIds } },
      include: {
        product: { select: { name: true, weight: true } },
      },
    });
    console.log("[SEND] Step 4 result: Found", orders.length, "order(s)");
    for (const o of orders) {
      console.log("[SEND] Step 4 order:", JSON.stringify({ id: o.id, storeId: o.storeId, status: o.status, clientName: o.clientName, ecotrackRef: o.ecotrackRef, sentToEcotrack: o.sentToEcotrack }));
    }

    if (orders.length === 0) {
      console.log("[SEND] Step 4 FAILED: No orders found for these IDs and user's stores");
      return NextResponse.json({ error: "Orders not found" }, { status: 404 });
    }
    console.log("[SEND] Step 4 PASSED: Orders retrieved");

    // STEP 5: Group orders by store
    console.log("[SEND] Step 5: Grouping orders by store...");
    const storeOrders = new Map<string, typeof orders>();
    for (const order of orders) {
      const group = storeOrders.get(order.storeId) || [];
      group.push(order);
      storeOrders.set(order.storeId, group);
    }
    console.log("[SEND] Step 5 result: Groups =", Array.from(storeOrders.entries()).map(([sid, ords]) => `${sid}: ${ords.length} order(s)`));

    // STEP 6: Map state names to wilaya codes
    console.log("[SEND] Step 6: Loading shipping config (wilaya codes)...");
    const stateToCode: Record<string, string> = {};
    const shippingConfigs = await prisma.shippingConfig.findMany();
    for (const sc of shippingConfigs) {
      stateToCode[sc.stateName] = sc.stateCode;
    }
    console.log("[SEND] Step 6 result: Loaded", Object.keys(stateToCode).length, "wilaya mappings");

    // STEP 6b: Build commune lookup (Arabic -> Latin)
    console.log("[SEND] Step 6b: Building commune lookup map...");
    const arabicToLatin: Record<string, string> = {};
    for (const c of communes) {
      arabicToLatin[c.commune_ar] = c.commune_latin;
    }
    console.log("[SEND] Step 6b result: Loaded", Object.keys(arabicToLatin).length, "commune mappings");

    const overallRefs: string[] = [];

    // STEP 7: Process each store group
    console.log("[SEND] Step 7: Processing", storeOrders.size, "store group(s)...");
    for (const [storeId, storeOrds] of storeOrders) {
      console.log("[SEND] Step 7a: Processing store:", storeId, "with", storeOrds.length, "order(s)");

      // STEP 7b: Find Ecotrack config for this store
      console.log("[SEND] Step 7b: Looking for active Ecotrack config for storeId =", storeId);
      let config = await prisma.ecotrackConfig.findFirst({
        where: { storeId, isActive: true },
      });
      console.log("[SEND] Step 7b store-specific config:", config ? { id: config.id, prefix: config.prefix, baseUrl: config.baseUrl, company: config.company } : "NOT FOUND");

      if (!config) {
        console.log("[SEND] Step 7b: No store-specific config, trying global config (storeId = null)...");
        config = await prisma.ecotrackConfig.findFirst({
          where: { storeId: null, isActive: true },
        });
        console.log("[SEND] Step 7b global config:", config ? { id: config.id, prefix: config.prefix, baseUrl: config.baseUrl, company: config.company } : "NOT FOUND");
      }

      if (!config) {
        console.log("[SEND] Step 7b FAILED: No active config (store-specific or global) for store", storeId, "- skipping", storeOrds.length, "orders");
        continue;
      }
      console.log("[SEND] Step 7b PASSED: Using config - prefix:", config.prefix, ", baseUrl:", config.baseUrl);

      // STEP 7c: Chunk orders by 100
      console.log("[SEND] Step 7c: Chunking", storeOrds.length, "orders into groups of max 100...");
      for (let i = 0; i < storeOrds.length; i += 100) {
        const chunk = storeOrds.slice(i, i + 100);
        console.log("[SEND] Step 7c chunk", Math.floor(i / 100) + 1, ":", chunk.length, "orders (indices", i, "to", i + chunk.length - 1, ")");

        // STEP 7d: Build Ecotrack payload for this chunk
        console.log("[SEND] Step 7d: Building Ecotrack order payload for chunk of", chunk.length, "order(s)...");
        const ecotrackOrders: Record<string, any> = {};

        for (let j = 0; j < chunk.length; j++) {
          const order = chunk[j];
          const ref = `${config.prefix}-${order.id.slice(-8)}`;
          const codeWilaya = stateToCode[order.state] || order.state;
          console.log("[SEND] Step 7d order", j, ": id=", order.id, "ref=", ref, "state=", order.state, "codeWilaya=", codeWilaya, "product=", order.product.name, "phone=", order.clientPhone1);

          const normalizedPhone = normalizePhone(order.clientPhone1);
          const normalizedPhone2 = normalizePhone(order.clientPhone2 || "");
          console.log("[SEND] Step 7d normalized phones:", { original: order.clientPhone1, normalized: normalizedPhone, original2: order.clientPhone2, normalized2: normalizedPhone2 });

          const parsedWilaya = parseInt(codeWilaya, 10);
          console.log("[SEND] Step 7d parseInt check:", { codeWilaya, parsedWilaya, type: typeof parsedWilaya, isNaN: isNaN(parsedWilaya) });

          ecotrackOrders[String(j)] = {
            reference: ref,
            nom_client: order.clientName,
            telephone: normalizedPhone,
            telephone_2: normalizedPhone2,
            adresse: order.address || "",
            code_postal: "",
            commune: arabicToLatin[order.city] || order.city,
            code_wilaya: parsedWilaya,
            montant: Number(order.totalPrice || 0),
            remarque: order.notes || "",
            produit: order.product.name,
            stock: 0,
            quantite: 0,
            produit_a_recuperer: "",
            boutique: "",
            type: order.shippingType === "STOP_DESK" ? 2 : 1,
            stop_desk: order.shippingType === "STOP_DESK" ? 1 : 0,
            weight: 0,
          };
        }
        console.log("[SEND] Step 7d PASSED: Built payload with", Object.keys(ecotrackOrders).length, "order(s)");

        // STEP 7e: Send to Ecotrack API
        const cleanBaseUrl = config.baseUrl.replace(/\/+$/, "");
        const apiUrl = `${cleanBaseUrl}/api/v1/create/orders`;
        console.log("[SEND] Step 7e: Sending POST request to Ecotrack API...");
        console.log("[SEND] Step 7e URL:", apiUrl);
        console.log("[SEND] Step 7e baseUrl (cleaned):", cleanBaseUrl);
        console.log("[SEND] Step 7e original baseUrl:", config.baseUrl);
        console.log("[SEND] Step 7e Authorization header: Bearer", config.apiKey.slice(0, 8) + "...");
        console.log("[SEND] Step 7e Payload keys:", Object.keys(ecotrackOrders));
        console.log("[SEND] Step 7e Full payload preview:", JSON.stringify({ orders: ecotrackOrders }).slice(0, 3000));

        const apiRes = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({ orders: ecotrackOrders }),
        });

        console.log("[SEND] Step 7e RESPONSE status:", apiRes.status, apiRes.statusText);
        console.log("[SEND] Step 7e RESPONSE headers:", JSON.stringify(Object.fromEntries(apiRes.headers.entries())));

        const responseText = await apiRes.text();
        console.log("[SEND] Step 7e RESPONSE body length:", responseText.length, "characters");
        console.log("[SEND] Step 7e RESPONSE body:", responseText);

        if (!apiRes.ok) {
          console.log("[SEND] Step 7e FAILED: Ecotrack returned non-OK status", apiRes.status);
          console.log("[SEND] Step 7e FAILED body:", responseText);
          if (apiRes.status === 429) {
            return NextResponse.json({ error: "Rate limit exceeded (50 req/min). Please wait a moment and try again.", rateLimited: true }, { status: 429 });
          }
          continue;
        }

        // STEP 7f: Parse Ecotrack response
        console.log("[SEND] Step 7f: Parsing Ecotrack response JSON...");
        let apiData: any;
        try {
          apiData = JSON.parse(responseText);
          console.log("[SEND] Step 7f PASSED: Parsed response:", JSON.stringify(apiData).slice(0, 1000));
        } catch (parseErr) {
          console.log("[SEND] Step 7f FAILED: Could not parse response as JSON:", parseErr);
          console.log("[SEND] Step 7f Raw response was:", responseText);
          continue;
        }

        // STEP 7g: Update orders in DB — only if Ecotrack returned success: true
        console.log("[SEND] Step 7g: Checking", chunk.length, "order(s) results for success flag...");
        const succeeded: string[] = [];
        const failed: { ref: string; error: string }[] = [];
        for (const order of chunk) {
          const ref = `${config.prefix}-${order.id.slice(-8)}`;
          const result = apiData.results?.[ref];
          if (result?.success === true) {
            const trackingCode = result.tracking || ref;
            overallRefs.push(ref);
            succeeded.push(order.id);
            console.log("[SEND] Step 7g SUCCESS order:", order.id, "-> tracking:", trackingCode, "(ref:", ref, ")");
            await prisma.order.update({
              where: { id: order.id },
              data: {
                ecotrackRef: trackingCode,
                sentToEcotrack: true,
                sentToEcotrackAt: new Date(),
              },
            });
          } else {
            const errMsg = result?.errors || "Unknown error";
            failed.push({ ref, error: errMsg });
            console.log("[SEND] Step 7g FAILED order:", order.id, "-> ref:", ref, "error:", errMsg);
          }
        }
        console.log("[SEND] Step 7g result: succeeded:", succeeded.length, "failed:", failed.length, "details:", failed);
      }
      console.log("[SEND] Step 7 Done processing store:", storeId);
    }

    // STEP 8: Return success
    console.log("[SEND] Step 8: Returning success. Total refs generated:", overallRefs.length, "refs:", overallRefs);
    console.log("[SEND] ==================== END send orders (SUCCESS) ====================");
    return NextResponse.json({ success: true, count: overallRefs.length, refs: overallRefs });
  } catch (error) {
    console.log("[SEND] ==================== END send orders (ERROR) ====================");
    console.error("[SEND] UNEXPECTED ERROR:", error);
    if (error instanceof Error) {
      console.log("[SEND] Error name:", error.name);
      console.log("[SEND] Error message:", error.message);
      console.log("[SEND] Error stack:", error.stack);
    }
    return NextResponse.json({ error: "Failed to send orders" }, { status: 500 });
  }
}
