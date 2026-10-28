import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

/**
 * Page routing from session claims. This is a convenience layer: every API
 * route and server page re-checks permissions against the database
 * (src/lib/authz.ts), so a stale cookie can never reveal data.
 */

const PUBLIC_EXACT = new Set(["/", "/login", "/register", "/privacy", "/forgot", "/about"]);
const PUBLIC_PREFIXES = ["/invite/", "/reset/", "/api/auth", "/api/register", "/api/public"];

// Pages a signed-in user may open before finishing the required 2-step setup
// (/login and /register offer to sign out and use another account).
const MFA_SETUP_ALLOWED = ["/mfa-setup", "/privacy", "/about", "/invite/", "/reset/", "/login", "/register"];

/** The path plus query string, so a redirect can bring the person back. */
function returnPath(url: URL): string {
  return url.pathname + url.search;
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;
  const isLoggedIn = !!user?.id;
  const isApi = pathname.startsWith("/api");

  // API routes answer with their own 401/403 JSON (apiFetch cannot parse an HTML redirect).
  if (isApi) return NextResponse.next();

  if (!isLoggedIn) {
    if (isPublicPath(pathname)) return NextResponse.next();
    const login = new URL("/login", req.url);
    if (pathname !== "/") login.searchParams.set("next", returnPath(req.nextUrl));
    return NextResponse.redirect(login);
  }

  const role = user.role;
  const isStaff = role === "ADMIN" || role === "SUPERADMIN";
  const org = user.org;
  const isClinical =
    !!org && org.orgStatus === "ACTIVE" && (org.role === "OWNER" || org.role === "PRACTITIONER");

  // Staff and organization members must finish 2-step setup first.
  if (user.mfaRequired && !user.mfaEnabled) {
    if (!MFA_SETUP_ALLOWED.some((p) => pathname === p || pathname.startsWith(p))) {
      const setup = new URL("/mfa-setup", req.url);
      if (pathname !== "/") setup.searchParams.set("next", returnPath(req.nextUrl));
      return NextResponse.redirect(setup);
    }
    return NextResponse.next();
  }
  if (pathname === "/mfa-setup" && user.mfaEnabled) {
    return NextResponse.redirect(new URL("/settings?tab=security", req.url));
  }

  // Signed-in visitors of the landing page go to their workspace. /login and
  // /register stay open: they show "signed in as …" with a way to switch accounts.
  if (pathname === "/" || pathname === "/forgot") {
    const home = isStaff ? "/admin" : isClinical ? "/patients" : org ? "/org" : "/dashboard";
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (pathname.startsWith("/admin") && !isStaff) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if ((pathname.startsWith("/patients") || pathname.startsWith("/reports")) && !isClinical) {
    return NextResponse.redirect(new URL(org ? "/org" : "/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
