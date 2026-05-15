import { NextRequest, NextResponse } from "next/server";
import communes from "@/data/communes.json";
import wilayas from "@/data/wilayas.json";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wilayaCode = searchParams.get("wilayaCode");

  let filtered = communes;
  if (wilayaCode) {
    filtered = communes.filter((c) => c.wilaya_code === wilayaCode);
  }

  return NextResponse.json({ communes: filtered, wilayas });
}
