/**
 * Helpers for the `?next=` and `?notice=` query parameters of the sign-in
 * pages. Plain functions, usable from server pages and client components.
 */

// Any origin works as long as no real request can come from it.
const PROBE_ORIGIN = "https://bio-dosha-12.invalid";

/**
 * Returns a same-site relative path to continue to after signing in, or null.
 *
 * Only paths that start with "/" are accepted, never "//" or "/\" (both mean
 * "another website" to a browser). Browsers also drop tabs and newlines and
 * read "\" as "/", so "/\t/evil.example" would become "//evil.example": the
 * value is therefore resolved the way a browser resolves it, and kept only if
 * it stays on this site. The normalized path is returned, so what we navigate
 * to is exactly what was checked.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;

  let url: URL;
  try {
    url = new URL(value, PROBE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PROBE_ORIGIN) return null;
  // API routes are never a page to land on.
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** The first value of a page `searchParams` entry. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Messages the sign-in page shows for `?notice=` (shared contract with settings and the control center). */
export const LOGIN_NOTICES = ["password_reset", "password_changed", "signed_out", "account_created"] as const;
export type LoginNotice = (typeof LOGIN_NOTICES)[number];

export function parseLoginNotice(value: string | undefined): LoginNotice | null {
  return LOGIN_NOTICES.includes(value as LoginNotice) ? (value as LoginNotice) : null;
}

/** "/login?next=…" for a page that needs the person to sign in first. */
export function loginHref(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
