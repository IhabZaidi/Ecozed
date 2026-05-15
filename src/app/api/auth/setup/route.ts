import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    return NextResponse.json({ setupRequired: adminCount === 0 });
  } catch {
    return NextResponse.json({ error: "Failed to check setup status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount > 0) {
      return NextResponse.json({ error: "Admin already exists" }, { status: 409 });
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: "ADMIN",
        permissions: ["all"],
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
