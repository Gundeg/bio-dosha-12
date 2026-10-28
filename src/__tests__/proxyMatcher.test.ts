import { describe, expect, it, vi } from "vitest";

// Only the matcher is under test; the auth() wrapper is replaced by a pass-through.
vi.mock("next-auth", () => ({ default: () => ({ auth: (handler: unknown) => handler }) }));

const { config } = await import("../proxy");

/** The matcher as Next.js applies it: the whole path must match the pattern. */
function proxyRunsOn(pathname: string): boolean {
  return config.matcher.some((pattern) => new RegExp(`^${pattern}$`).test(pathname));
}

describe("proxy matcher", () => {
  it("never runs on Auth.js endpoints, so it cannot re-issue a cookie they clear or replace", () => {
    for (const path of ["/api/auth/signout", "/api/auth/session", "/api/auth/callback/credentials", "/api/auth/csrf"]) {
      expect(proxyRunsOn(path), path).toBe(false);
    }
  });

  it("still runs on pages and the app's own API routes", () => {
    for (const path of ["/", "/login", "/dashboard", "/admin/users", "/api/profiles", "/api/bedi"]) {
      expect(proxyRunsOn(path), path).toBe(true);
    }
  });

  it("skips static assets", () => {
    for (const path of ["/_next/static/chunks/app.js", "/_next/image", "/favicon.ico"]) {
      expect(proxyRunsOn(path), path).toBe(false);
    }
  });
});
