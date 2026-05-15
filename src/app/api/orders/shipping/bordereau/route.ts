import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const COL_WIDTHS = [30, 90, 75, 100, 100, 55, 55, 115];
const ROW_HEIGHT = 18;
const HEADER_HEIGHT = 22;
const MARGIN_LEFT = 30;
const MARGIN_TOP = 50;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

interface RowData {
  cells: string[];
}

function chunkRows(rows: RowData[], maxPerPage: number): RowData[][] {
  const chunks: RowData[][] = [];
  for (let i = 0; i < rows.length; i += maxPerPage) {
    chunks.push(rows.slice(i, i + maxPerPage));
  }
  return chunks;
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
      where: { id: { in: ids }, storeId: { in: userStoreIds }, ecotrackRef: { not: null } },
      include: {
        product: { select: { name: true, sellingPrice: true } },
        store: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "No sent orders found" }, { status: 400 });
    }

    const totalAmount = orders.reduce((sum, o) => {
      return sum + (o.totalPrice || (o.product.sellingPrice * o.quantity) + o.shippingCost);
    }, 0);

    const rows: RowData[] = orders.map((o) => {
      const total = o.totalPrice || (o.product.sellingPrice * o.quantity) + o.shippingCost;
      return {
        cells: [
          "", // number filled during render
          o.clientName || "",
          o.clientPhone1 || "",
          `${o.state || ""} - ${o.city || ""}`,
          `${o.product.name} x${o.quantity}`,
          String(total),
          o.shippingType === "STOP_DESK" ? "Stop Desk" : "Home",
          o.ecotrackRef || "",
        ],
      };
    });

    const rowsPerPage = Math.floor((PAGE_HEIGHT - MARGIN_TOP - 80) / ROW_HEIGHT);
    const pages = chunkRows(rows, rowsPerPage);

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    for (let p = 0; p < pages.length; p++) {
      const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      const { height } = page.getSize();
      let y = height - MARGIN_TOP;

      // Title
      page.drawText("Bordereau d'expédition", {
        x: MARGIN_LEFT, y, size: 16, font: boldFont, color: rgb(0.12, 0.16, 0.23),
      });
      y -= 20;

      // Meta
      const metaText = `Date: ${new Date().toLocaleDateString()} | Page ${p + 1}/${pages.length} | Ordres: ${orders.length} | Total: ${totalAmount.toFixed(0)} DA`;
      page.drawText(metaText, {
        x: MARGIN_LEFT, y, size: 8, font, color: rgb(0.4, 0.4, 0.4),
      });
      y -= 16;

      // Table header
      const headers = ["#", "Client", "Téléphone", "Adresse", "Produit", "Montant", "Type", "Tracking"];
      let x = MARGIN_LEFT;
      page.drawRectangle({
        x: MARGIN_LEFT, y: y - HEADER_HEIGHT, width: PAGE_WIDTH - MARGIN_LEFT * 2, height: HEADER_HEIGHT,
        color: rgb(0.12, 0.16, 0.23),
      });
      for (let h = 0; h < headers.length; h++) {
        page.drawText(headers[h], {
          x: x + 4, y: y - HEADER_HEIGHT + 6, size: 7, font: boldFont, color: rgb(1, 1, 1),
        });
        x += COL_WIDTHS[h];
      }
      y -= HEADER_HEIGHT;

      // Table rows
      for (const row of pages[p]) {
        const idx = p * rowsPerPage + pages[p].indexOf(row) + 1;
        row.cells[0] = String(idx);
        x = MARGIN_LEFT;
        const isEven = idx % 2 === 0;
        if (isEven) {
          page.drawRectangle({
            x: MARGIN_LEFT, y: y - ROW_HEIGHT, width: PAGE_WIDTH - MARGIN_LEFT * 2, height: ROW_HEIGHT,
            color: rgb(0.95, 0.95, 0.97),
          });
        }
        for (let c = 0; c < row.cells.length; c++) {
          const text = row.cells[c].length > 20 ? row.cells[c].slice(0, 20) + "..." : row.cells[c];
          page.drawText(text, {
            x: x + 4, y: y - ROW_HEIGHT + 5, size: 7, font, color: rgb(0.13, 0.13, 0.13),
          });
          x += COL_WIDTHS[c];
        }
        y -= ROW_HEIGHT;
      }

      // Total at bottom
      if (p === pages.length - 1) {
        y -= 10;
        page.drawText(`Total: ${totalAmount.toFixed(0)} DA`, {
          x: PAGE_WIDTH - MARGIN_LEFT - 120, y, size: 11, font: boldFont, color: rgb(0.12, 0.16, 0.23),
        });
      }
    }

    const pdfBytes = await doc.save();
    const body = Buffer.from(pdfBytes);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bordereau-${orders.length}-orders.pdf"`,
      },
    });
  } catch (error) {
    console.error("[POST /api/orders/shipping/bordereau] Error:", error);
    return NextResponse.json({ error: "Failed to generate bordereau" }, { status: 500 });
  }
}
