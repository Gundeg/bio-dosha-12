import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CLINICAL_ROLES, actorOf, requireAuth, requireOrgManager } from "@/lib/authz";
import { HttpError, handle, readJson } from "@/lib/http";
import { normalizeEmail } from "@/lib/credentials";
import { ORG_MEMBER_ROLES } from "@/lib/schemas/organization";
import { createAuthToken, inviteUrl, tokenState } from "@/lib/tokens";
import { inviteEmail, sendEmail } from "@/lib/email";
import { assertWithinLimit, countClinicalMembers, getEffectivePlan } from "@/lib/entitlements";
import { audit } from "@/lib/audit";
import { consumeRateLimit } from "@/lib/rateLimit";
import { findUserIdsByEmail } from "@/lib/users";

export const runtime = "nodejs";

type Params = { params: Promise<{ orgId: string }> };

const ROLE_LABEL_MN: Record<string, string> = { OWNER: "эзэн", ADMIN: "менежер", PRACTITIONER: "эмч" };

const DAY_MS = 24 * 60 * 60 * 1000;
const INVITES_PER_DAY = { organization: 30, user: 30 } as const;

/** Invitations of the organization (managers only). */
export const GET = handle(async (_req: NextRequest, { params }: Params) => {
  const ctx = await requireAuth();
  const { orgId } = await params;
  requireOrgManager(ctx, orgId, { allowSuspended: true });

  const invites = await prisma.authToken.findMany({
    where: { organizationId: orgId, type: "INVITE" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(
    invites.map((t) => ({
      id: t.id,
      email: t.email,
      role: t.orgRole,
      state: tokenState(t),
      expiresAt: t.expiresAt,
      createdAt: t.createdAt,
    }))
  );
});

const createSchema = z.object({
  email: z.email().trim().max(200).transform(normalizeEmail),
  role: z.enum(ORG_MEMBER_ROLES).default("PRACTITIONER"),
});

/**
 * Invites a person to the organization. Returns a one-time link to share; it
 * is also emailed when email delivery is configured and the organization is
 * verified. Only an OWNER can grant access to patient records (OWNER or
 * PRACTITIONER); managers invite managers.
 */
export const POST = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireAuth();
  const { orgId } = await params;
  const me = requireOrgManager(ctx, orgId);
  const { email, role } = createSchema.parse(await readJson(req));
  if (CLINICAL_ROLES.includes(role) && me.role !== "OWNER") {
    throw new HttpError(403, "clinical_grant_owner_only", "Өвчтөний мэдээлэлд хандах эрхийг зөвхөн эзэн олгоно.");
  }

  const [orgOk, userOk] = await Promise.all([
    consumeRateLimit(`invite:org:${orgId}`, INVITES_PER_DAY.organization, DAY_MS),
    consumeRateLimit(`invite:user:${ctx.userId}`, INVITES_PER_DAY.user, DAY_MS),
  ]);
  if (!orgOk || !userOk) throw new HttpError(429, "rate_limited", "Өнөөдөр хэт олон урилга илгээлээ. Маргааш дахин оролдоно уу.");

  const existingIds = await findUserIdsByEmail(email);
  const existingMember = existingIds.length
    ? await prisma.organizationMember.findFirst({ where: { organizationId: orgId, userId: { in: existingIds } } })
    : null;
  if (existingMember) throw new HttpError(409, "already_member", "Энэ хүн аль хэдийн гишүүн байна.");

  if (role !== "ADMIN") {
    const plan = await getEffectivePlan({ organizationId: orgId });
    assertWithinLimit(plan, "maxPractitioners", await countClinicalMembers(orgId), "эмчийн тоо");
  }

  // One live invitation per person: revoke older pending ones.
  await prisma.authToken.updateMany({
    where: { organizationId: orgId, type: "INVITE", email, usedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  const { raw, record } = await createAuthToken({
    type: "INVITE",
    email,
    organizationId: orgId,
    orgRole: role,
    createdById: ctx.userId,
  });
  const link = inviteUrl(raw, req.url);
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, status: true } });
  // Unverified organizations share links themselves: the platform's sender
  // never carries an unverified organization's name to arbitrary addresses.
  const { sent } =
    org?.status === "ACTIVE"
      ? await sendEmail({ to: email, ...inviteEmail({ link, organizationName: org.name, roleLabel: ROLE_LABEL_MN[role] ?? role }) })
      : { sent: false };

  await audit({
    action: "org.member.invited",
    actor: actorOf(ctx),
    organizationId: orgId,
    targetType: "invite",
    targetId: record.id,
    meta: { role, emailSent: sent },
    headers: req.headers,
  });
  return NextResponse.json(
    { id: record.id, inviteUrl: link, emailSent: sent, expiresAt: record.expiresAt },
    { status: 201, headers: { "cache-control": "private, no-store" } }
  );
});
