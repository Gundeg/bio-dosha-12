import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findValidToken } from "@/lib/tokens";
import { findUserIdsByEmail } from "@/lib/users";
import { getAuthContext } from "@/lib/authz";
import { HttpError, handle, notFound, readJson } from "@/lib/http";
import { normalizeEmail, passwordSchema } from "@/lib/credentials";
import { assertWithinLimit, getEffectivePlan, lockLimit } from "@/lib/entitlements";
import { REGISTER_LIMIT, clientIp, consumeRateLimit } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Params = { params: Promise<{ token: string }> };

async function loadInvite(token: string) {
  const invite = await findValidToken(token, "INVITE");
  if (!invite) throw notFound("Урилгын холбоос хүчингүй эсвэл хугацаа нь дууссан байна.");
  return invite;
}

/** What the invitation offers (shown before the person accepts). */
export const GET = handle(async (_req: NextRequest, { params }: Params) => {
  const { token } = await params;
  const invite = await loadInvite(token);
  const accountIds = await findUserIdsByEmail(invite.email);
  return NextResponse.json({
    email: invite.email,
    kind: invite.platformRole ? "staff" : "organization",
    platformRole: invite.platformRole,
    orgRole: invite.orgRole,
    organization: invite.organization ? { name: invite.organization.name, status: invite.organization.status } : null,
    accountExists: accountIds.length > 0,
    expiresAt: invite.expiresAt,
  });
});

const acceptSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  password: passwordSchema.optional(),
  acceptPrivacy: z.boolean().optional(),
});

/**
 * Accepts an invitation.
 *  - New person: creates the account with the invited email (name, password, consent).
 *  - Existing account: the person must be signed in with the invited email,
 *    and the grant goes to that signed-in account.
 * Then grants the platform role or organization membership the invite carries.
 * Everything happens in one transaction that first consumes the link, so two
 * simultaneous acceptances cannot both succeed, and the practitioner limit is
 * checked under a lock. An invitation never demotes an active member.
 */
export const POST = handle(async (req: NextRequest, { params }: Params) => {
  const { token } = await params;
  const allowed = await consumeRateLimit(`invite:ip:${clientIp(req.headers)}`, REGISTER_LIMIT.perIp * 3, REGISTER_LIMIT.windowMs);
  if (!allowed) throw new HttpError(429, "rate_limited", "Хэт олон оролдлого хийлээ. Түр хүлээнэ үү.");

  const invite = await loadInvite(token);
  const body = acceptSchema.parse(await readJson(req));
  const email = normalizeEmail(invite.email);

  const accountIds = await findUserIdsByEmail(email);
  let existingUserId: string | null = null;
  let newAccount: { name: string; passwordHash: string } | null = null;
  if (accountIds.length) {
    const ctx = await getAuthContext();
    if (!ctx || !accountIds.includes(ctx.userId) || normalizeEmail(ctx.email) !== email) {
      throw new HttpError(409, "login_required", "Энэ имэйлээр бүртгэл байна. Эхлээд тэр бүртгэлээр нэвтэрч, холбоосыг дахин нээнэ үү.");
    }
    existingUserId = ctx.userId;
  } else {
    if (!body.name || !body.password) {
      throw new HttpError(400, "invalid", "Нэр, нууц үгээ оруулна уу.");
    }
    if (body.acceptPrivacy !== true) {
      throw new HttpError(400, "privacy_required", "Нууцлалын бодлогыг зөвшөөрнө үү.");
    }
    newAccount = { name: body.name, passwordHash: await bcrypt.hash(body.password, 12) };
  }

  const orgId = invite.organizationId;
  const orgRole = invite.orgRole;
  const plan = orgId && orgRole && orgRole !== "ADMIN" ? await getEffectivePlan({ organizationId: orgId }) : null;

  const result = await prisma.$transaction(async (tx) => {
    const consumed = await tx.authToken.updateMany({
      where: { id: invite.id, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) throw notFound("Урилгын холбоос хүчингүй эсвэл хугацаа нь дууссан байна.");

    let user = existingUserId
      ? await tx.user.findUniqueOrThrow({ where: { id: existingUserId } })
      : await tx.user.create({
          data: {
            name: newAccount!.name,
            email,
            password: newAccount!.passwordHash,
            role: "INDIVIDUAL",
            privacyAcceptedAt: new Date(),
          },
        });

    if ((invite.platformRole === "ADMIN" || invite.platformRole === "SUPERADMIN") && user.role !== "SUPERADMIN") {
      user = await tx.user.update({ where: { id: user.id }, data: { role: invite.platformRole } });
    }

    let alreadyMember = false;
    if (orgId && orgRole) {
      const existing = await tx.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
      });
      if (existing?.status === "ACTIVE") {
        alreadyMember = true;
      } else {
        if (plan) {
          await lockLimit(tx, `practitioners:${orgId}`);
          const clinical = await tx.organizationMember.count({
            where: { organizationId: orgId, status: "ACTIVE", role: { in: ["OWNER", "PRACTITIONER"] } },
          });
          assertWithinLimit(plan, "maxPractitioners", clinical, "эмчийн тоо");
        }
        if (existing) {
          await tx.organizationMember.update({ where: { id: existing.id }, data: { role: orgRole, status: "ACTIVE" } });
        } else {
          await tx.organizationMember.create({ data: { organizationId: orgId, userId: user.id, role: orgRole } });
        }
      }
      await tx.user.update({ where: { id: user.id }, data: { activeOrganizationId: orgId } });
    }
    return { user, alreadyMember };
  });

  await audit({
    action: "auth.invite.accepted",
    actor: { id: result.user.id, email: result.user.email, role: result.user.role },
    organizationId: orgId,
    targetType: "invite",
    targetId: invite.id,
    meta: {
      platformRole: invite.platformRole ?? null,
      orgRole: orgRole ?? null,
      accountCreated: !existingUserId,
      alreadyMember: result.alreadyMember,
    },
    headers: req.headers,
  });

  return NextResponse.json({ ok: true, accountCreated: !existingUserId, alreadyMember: result.alreadyMember, email });
});
