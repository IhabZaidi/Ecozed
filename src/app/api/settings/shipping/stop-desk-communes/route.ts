import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import communesData from "@/data/communes.json";

function normalize(s: string): string {
  return s.replace(/[\s\-.]+/g, "").trim().toLowerCase().replace(/[eéèêë]/g, "e").replace(/[aàâä]/g, "a");
}

const commonMismatches: Record<string, string> = {
  "bordjbouarreridj": "bbarreridj",
  "ainoulmane": "ainoulmene",
  "ainsafra": "ainsefra",
  "insalah": "ainsalah",
};

function findCommuneLatin(nom: string, wilayaId: number): string | null {
  const wilayaCode = wilayaId.toString().padStart(2, "0");
  const normNom = normalize(nom);
  const mappedNom = commonMismatches[normNom] || normNom;

  // Try exact match first
  const exact = communesData.find(
    (c: any) => (c.wilaya_code === wilayaCode || parseInt(c.wilaya_code, 10) === wilayaId) &&
      c.commune_latin === nom
  );
  if (exact) return exact.commune_latin;

  // Try normalized match (ignore hyphens, spaces, dots, case, accents)
  const match = communesData.find(
    (c: any) => (c.wilaya_code === wilayaCode || parseInt(c.wilaya_code, 10) === wilayaId) &&
      normalize(c.commune_latin) === normNom
  );
  if (match) return match.commune_latin;

  // Try with common mismatches mapping
  if (mappedNom !== normNom) {
    const mappedMatch = communesData.find(
      (c: any) => (c.wilaya_code === wilayaCode || parseInt(c.wilaya_code, 10) === wilayaId) &&
        normalize(c.commune_latin) === mappedNom
    );
    if (mappedMatch) return mappedMatch.commune_latin;
  }

  // Try contains match (e.g., "B. B. Arreridj" vs "Bordj Bou Arreridj")
  const contains = communesData.find(
    (c: any) => (c.wilaya_code === wilayaCode || parseInt(c.wilaya_code, 10) === wilayaId) &&
      (normalize(c.commune_latin).includes(normNom) || normNom.includes(normalize(c.commune_latin)))
  );
  if (contains) return contains.commune_latin;

  return null;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const wilayaId = searchParams.get("wilayaId");
  const storeId = searchParams.get("storeId");

  if (!wilayaId) {
    return NextResponse.json({ error: "Missing wilayaId" }, { status: 400 });
  }

  try {
    let config = storeId
      ? await prisma.ecotrackConfig.findFirst({ where: { storeId, isActive: true } })
      : null;
    if (!config) {
      config = await prisma.ecotrackConfig.findFirst({ where: { storeId: null, isActive: true } });
    }
    if (!config) {
      return NextResponse.json({ error: "No active Ecotrack config" }, { status: 400 });
    }

    const wilayaInt = parseInt(wilayaId, 10);

    const dbCommunes = await prisma.stopDeskCommune.findMany({
      where: { configId: config.id, wilayaId: wilayaInt },
      select: { nom: true, wilayaId: true, codePostal: true, hasStopDesk: true },
      orderBy: { nom: "asc" },
    });

    const communes = dbCommunes.map((c) => ({
      ...c,
      communeLatin: findCommuneLatin(c.nom, c.wilayaId),
    }));

    return NextResponse.json({
      communes,
      lastSync: config.lastStopDeskSync,
    });
  } catch (error) {
    console.error("[stop-desk-communes] Error:", error);
    return NextResponse.json({ error: "Failed to fetch stop-desk communes" }, { status: 500 });
  }
}
