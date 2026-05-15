import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const configId = body.configId;

    // Find config: specified, or first global active
    const config = configId
      ? await prisma.ecotrackConfig.findFirst({ where: { id: configId, isActive: true } })
      : await prisma.ecotrackConfig.findFirst({ where: { storeId: null, isActive: true } });

    if (!config) {
      return NextResponse.json({ error: "No active Ecotrack config found" }, { status: 400 });
    }

    const cleanBaseUrl = config.baseUrl.replace(/\/+$/, "");
    const apiUrl = `${cleanBaseUrl}/api/v1/get/communes`;

    const apiRes = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return NextResponse.json({ error: "Ecotrack API error", details: errText }, { status: 502 });
    }

    const apiData = await apiRes.json();

    const entries = Object.values(apiData).filter(
      (c: any) => c && typeof c === "object" && c.nom
    ) as { nom: string; wilaya_id: number; code_postal?: string; has_stop_desk: number }[];

    // Delete old data for this config and insert new
    await prisma.$transaction(async (tx) => {
      await tx.stopDeskCommune.deleteMany({ where: { configId: config.id } });

      for (const entry of entries) {
        await tx.stopDeskCommune.create({
          data: {
            nom: entry.nom,
            wilayaId: entry.wilaya_id,
            codePostal: String(entry.code_postal ?? ""),
            hasStopDesk: entry.has_stop_desk === 1,
            configId: config.id,
          },
        });
      }

      await tx.ecotrackConfig.update({
        where: { id: config.id },
        data: { lastStopDeskSync: new Date() },
      });
    });

    return NextResponse.json({
      success: true,
      count: entries.length,
      lastSync: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[stop-desk-communes/sync] Error:", error);
    return NextResponse.json({ error: "Failed to sync stop-desk communes" }, { status: 500 });
  }
}
