import { prisma } from "./prisma";

/**
 * Fixed-window rate limiter backed by Postgres, so it works across serverless
 * instances without an external service. One atomic upsert per call.
 *
 * Returns true when the call is allowed, false when the limit is exceeded.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
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
  return (rows[0]?.count ?? 0) <= limit;
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

export const LOGIN_LIMIT = { perEmail: 10, perIp: 50, windowMs: 15 * 60 * 1000 } as const;
export const REGISTER_LIMIT = { perIp: 10, windowMs: 60 * 60 * 1000 } as const;
