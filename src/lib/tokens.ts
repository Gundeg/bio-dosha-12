import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import type { AuthTokenType, OrgMemberRole, Role } from "../generated/prisma/client";
import { normalizeEmail } from "./credentials";

/**
 * One-time links for invitations and password resets. The raw token appears
 * only in the link; the database keeps a SHA-256 hash, so a database leak does
 * not expose usable links.
 */

export const INVITE_TTL_HOURS = 7 * 24;
export const RESET_TTL_HOURS = 2;

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export interface CreateTokenInput {
  type: AuthTokenType;
  email: string;
  userId?: string | null;
  platformRole?: Role | null;
  organizationId?: string | null;
  orgRole?: OrgMemberRole | null;
  createdById?: string | null;
  ttlHours?: number;
}

export async function createAuthToken(input: CreateTokenInput) {
  const raw = randomBytes(32).toString("base64url");
  const ttl = input.ttlHours ?? (input.type === "RESET" ? RESET_TTL_HOURS : INVITE_TTL_HOURS);
  const record = await prisma.authToken.create({
    data: {
      type: input.type,
      tokenHash: hashToken(raw),
      email: normalizeEmail(input.email),
      userId: input.userId ?? null,
      platformRole: input.platformRole ?? null,
      organizationId: input.organizationId ?? null,
      orgRole: input.orgRole ?? null,
      createdById: input.createdById ?? null,
      expiresAt: new Date(Date.now() + ttl * 60 * 60 * 1000),
    },
  });
  return { raw, record };
}

/** Finds a usable token: right type, not used, not revoked, not expired. */
export async function findValidToken(raw: string, type: AuthTokenType) {
  if (!raw || raw.length < 20 || raw.length > 200) return null;
  const record = await prisma.authToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { organization: { select: { id: true, name: true, status: true } } },
  });
  if (!record || record.type !== type) return null;
  if (record.usedAt || record.revokedAt || record.expiresAt.getTime() < Date.now()) return null;
  return record;
}

export type TokenState = "pending" | "used" | "revoked" | "expired";

export function tokenState(t: { usedAt: Date | null; revokedAt: Date | null; expiresAt: Date }): TokenState {
  if (t.usedAt) return "used";
  if (t.revokedAt) return "revoked";
  if (t.expiresAt.getTime() < Date.now()) return "expired";
  return "pending";
}

/**
 * Absolute link to a page of this site. Configured addresses come first
 * (APP_URL, then the auth URL, then Netlify's own site URL); the request's
 * origin is only a last resort, because a forwarded Host header could point a
 * reset link at someone else's server.
 */
export function buildAppUrl(path: string, requestUrl?: string): string {
  const base =
    process.env.APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.URL ??
    (requestUrl ? new URL(requestUrl).origin : "http://localhost:3000");
  return new URL(path, base.replace(/\/api\/auth\/?$/, "")).toString();
}

export function inviteUrl(raw: string, requestUrl?: string): string {
  return buildAppUrl(`/invite/${raw}`, requestUrl);
}

export function resetUrl(raw: string, requestUrl?: string): string {
  return buildAppUrl(`/reset/${raw}`, requestUrl);
}
