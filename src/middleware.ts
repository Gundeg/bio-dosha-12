import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const publicPrefixes = ["/login", "/register", "/api/auth", "/api/register"];
  const isPublic = pathname === "/" || publicPrefixes.some((r) => pathname.startsWith(r));

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Practitioner-only routes
  if (pathname.startsWith("/patients") || pathname.startsWith("/reports")) {
    if (req.auth?.user?.role !== "PRACTITIONER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
