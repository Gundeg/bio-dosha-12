import { createHash } from "node:crypto";
import { prisma } from "./prisma";

/**
 * Fixed-window rate limiter backed by Postgres, so it works across serverless
 * instances without an external service. One atomic upsert per call.
 * Windows must stay shorter than CLEANUP_AFTER_MS.
 */

const CLEANUP_AFTER_MS = 2 * 24 * 60 * 60 * 1000;
const CLEANUP_PROBABILITY = 0.02;

/**
 * Key for counters that contain user input (e.g. an email address): a
 * fixed-length digest, so attacker-chosen strings never grow the table's keys.
 */
export function limitKey(scope: string, ...parts: string[]): string {
  const digest = createHash("sha256").update(parts.join("\u0000")).digest("hex").slice(0, 32);
  return `${scope}:${digest}`;
}

/** Counts one attempt and returns how many were made in the current window. */
export async function hitRateLimit(key: string, windowMs: number): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${key}, 1, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowMs / 1000})
        THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowMs / 1000})
        THEN now() ELSE "RateLimit"."windowStart" END
    RETURNING "count"
  `;
  if (Math.random() < CLEANUP_PROBABILITY) {
    // Opportunistic cleanup so counters for one-off keys do not pile up.
    await prisma.rateLimit
      .deleteMany({ where: { windowStart: { lt: new Date(Date.now() - CLEANUP_AFTER_MS) } } })
      .catch(() => undefined);
  }
  return Number(rows[0]?.count ?? 0);
}

/** Returns true when the call is allowed, false when the limit is exceeded. */
export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  return (await hitRateLimit(key, windowMs)) <= limit;
}

/** Clears a counter, e.g. after a successful login so normal use never locks an account. */
export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

/**
 * Best-effort client IP. On Netlify `x-nf-client-connection-ip` is set by the
 * platform and cannot be spoofed; `x-forwarded-for` is only a fallback for
 * other hosts and is client-controlled there.
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-nf-client-connection-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Sign-in limits per 15 minutes. The tight limit is per email *and* IP, so a
 * stranger cannot lock someone out from another network; the looser per-email
 * ceiling slows distributed guessing; 2-step codes have their own small budget.
 */
export const LOGIN_LIMIT = {
  perEmailAndIp: 10,
  perEmail: 50,
  perIp: 50,
  mfaPerUser: 5,
  windowMs: 15 * 60 * 1000,
} as const;

/** Password re-checks inside the app (change password, delete account, 2-step changes). */
export const REAUTH_LIMIT = { perUser: 5, windowMs: 15 * 60 * 1000 } as const;
export const REGISTER_LIMIT = { perIp: 10, windowMs: 60 * 60 * 1000 } as const;
