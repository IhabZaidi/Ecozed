import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const algerianStates = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar",
  "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger",
  "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma",
  "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh",
  "Illizi", "Bordj Bou Arreridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued",
  "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa",
  "Relizane", "El M'Ghair", "El Menia", "Ouled Djellal", "Bordj Baji Mokhtar", "Béni Abbès",
  "Timimoun", "Touggourt", "Djanet", "In Salah", "In Guezzam",
];

export async function POST() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    for (let i = 0; i < algerianStates.length; i++) {
      const code = (i + 1).toString().padStart(2, "0");
      await prisma.shippingConfig.upsert({
        where: { stateCode: code },
        update: {},
        create: {
          stateCode: code,
          stateName: algerianStates[i],
          homeCost: 600,
          stopDeskCost: 400,
          returnCost: 200,
          changeCost: 300,
        },
      });
    }

    return NextResponse.json({ success: true, count: algerianStates.length });
  } catch (error) {
    console.error("[SEED SHIPPING] Error:", error);
    return NextResponse.json({ error: "Failed to seed shipping configs" }, { status: 500 });
  }
}
