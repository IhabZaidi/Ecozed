import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

const publicPaths = ["/login", "/setup", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isProtectedApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/") && !isPublicPath(pathname);
}

function isProtectedPagePath(pathname: string): boolean {
  const protectedPages = [
    "/dashboard",
    "/orders",
    "/products",
    "/users",
    "/salary",
    "/stores",
    "/settings",
  ];
  return protectedPages.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname) || pathname === "/") {
    return NextResponse.next();
  }

  if (!isProtectedPagePath(pathname) && !isProtectedApiPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    if (isProtectedApiPath(pathname)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    if (isProtectedApiPath(pathname)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
