import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const publicPrefixes = ["/login", "/register", "/api/auth", "/api/register"];
  const isPublic = pathname === "/" || publicPrefixes.some((r) => pathname.startsWith(r));
  // API routes authenticate in their own handlers and return 401 JSON. Redirecting
  // them to the HTML login page breaks apiFetch (it would parse HTML as JSON), so
  // let them fall through and answer with their own status codes.
  const isApi = pathname.startsWith("/api");

  if (!isLoggedIn && !isPublic && !isApi) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Нэвтэрсэн хэрэглэгч нүүр хуудсанд — үүрэгт нь тохирсон самбар руу
  if (isLoggedIn && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
    const home =
      role === "PRACTITIONER" ? "/patients" : role === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(home, req.url));
  }

  // Practitioner-only routes
  if (pathname.startsWith("/patients") || pathname.startsWith("/reports")) {
    if (role !== "PRACTITIONER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Admin-only routes
  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
