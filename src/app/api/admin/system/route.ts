import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/authz";
import { handle } from "@/lib/http";
import { encryptionKeyStatus } from "@/lib/crypto/fieldEncryption";
import { ENCRYPTED_FIELDS, ENCRYPTED_JSON_FIELDS } from "@/lib/crypto/encryptedFields";
import { isEmailEnabled } from "@/lib/email";
import { BEDI_PRECISION, BEDI_THRESHOLDS } from "@/lib/bediConfig";
import { SEASON_COEFFICIENTS } from "@/lib/seasonFactors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MigrationRow = { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null };

/**
 * Counts sensitive values still stored as plaintext (rows written before
 * encryption was switched on). Identifiers come from the constant field map,
 * never from the request.
 */
async function plaintextCounts() {
  const out: { model: string; field: string; count: number }[] = [];
  for (const [model, fields] of Object.entries(ENCRYPTED_FIELDS)) {
    for (const field of fields) {
      const rows = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
        `SELECT count(*)::bigint AS n FROM "${model}" WHERE "${field}" IS NOT NULL AND "${field}" <> '' AND "${field}" NOT LIKE 'enc:v1:%' AND "${field}" NOT LIKE 'encj:v1:%'`
      );
      out.push({ model, field, count: Number(rows[0]?.n ?? 0) });
    }
  }
  for (const [model, fields] of Object.entries(ENCRYPTED_JSON_FIELDS)) {
    for (const field of fields) {
      const rows = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
        `SELECT count(*)::bigint AS n FROM "${model}" WHERE "${field}" IS NOT NULL AND "${field}" <> 'null'::jsonb AND NOT (jsonb_typeof("${field}") = 'string' AND ("${field}" #>> '{}') LIKE 'encj:v1:%')`
      );
      out.push({ model, field, count: Number(rows[0]?.n ?? 0) });
    }
  }
  return out;
}

/** Configuration and health checks for the platform owner. Never shows secret values. */
export const GET = handle(async () => {
  await requireStaff("SUPERADMIN");

  const started = Date.now();
  let dbOk = true;
  let dbError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbOk = false;
    dbError = err instanceof Error ? err.message.slice(0, 200) : "unknown";
  }
  const dbLatencyMs = Date.now() - started;

  const [migrations, plaintext, auditRows, pendingInvites, staffWithoutMfa] = dbOk
    ? await Promise.all([
        prisma.$queryRaw<MigrationRow[]>`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at DESC LIMIT 20`.catch(
          () => [] as MigrationRow[]
        ),
        encryptionKeyStatus() === "ok" ? plaintextCounts() : Promise.resolve(null),
        prisma.auditLog.count(),
        prisma.authToken.count({ where: { type: "INVITE", usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } } }),
        prisma.user.count({ where: { role: { in: ["ADMIN", "SUPERADMIN"] }, totpEnabledAt: null } }),
      ])
    : [[] as MigrationRow[], null, 0, 0, 0];

  return NextResponse.json(
    {
      checks: {
        encryptionKey: encryptionKeyStatus(),
        authSecret: Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
        appUrl: process.env.APP_URL ?? process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? null,
        email: { enabled: isEmailEnabled(), from: process.env.EMAIL_FROM ?? null },
        database: { ok: dbOk, latencyMs: dbLatencyMs, error: dbError },
      },
      security: {
        plaintextSensitiveValues: plaintext,
        staffWithoutMfa,
        pendingInvites,
        auditLogRows: auditRows,
      },
      migrations: migrations.map((m) => ({
        name: m.migration_name,
        finishedAt: m.finished_at,
        rolledBack: !!m.rolled_back_at,
      })),
      formula: {
        locked: true,
        expression: "BEDI = (W · Kg · Ks · Kc) / (H · Age · Kt),  Δ = BEDI − 1",
        thresholds: BEDI_THRESHOLDS,
        precision: BEDI_PRECISION,
        seasonCoefficients: SEASON_COEFFICIENTS,
      },
      runtime: {
        node: process.version,
        commit: process.env.COMMIT_REF ?? null,
        deployContext: process.env.CONTEXT ?? (process.env.NODE_ENV === "production" ? "production" : "development"),
        region: process.env.AWS_REGION ?? null,
      },
    },
    { headers: { "cache-control": "private, no-store" } }
  );
});
