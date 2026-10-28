import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actorOf, requireStaff } from "@/lib/authz";
import { conflict, handle, readJson } from "@/lib/http";
import { inviteListQuery, pageArgs, staffInviteSchema } from "@/lib/schemas/admin";
import { createAuthToken, inviteUrl, tokenState, type TokenState } from "@/lib/tokens";
import { inviteEmail, sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";
import { findUserIdsByEmail } from "@/lib/users";
import type { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";

function stateWhere(state: TokenState | undefined, now: Date): Prisma.AuthTokenWhereInput {
  switch (state) {
    case "pending":
      return { usedAt: null, revokedAt: null, expiresAt: { gt: now } };
    case "used":
      return { usedAt: { not: null } };
    case "revoked":
      return { usedAt: null, revokedAt: { not: null } };
    case "expired":
      return { usedAt: null, revokedAt: null, expiresAt: { lte: now } };
    default:
      return {};
  }
}

/** Invitations across the platform: staff invitations and organization invitations. */
export const GET = handle(async (req: NextRequest) => {
  await requireStaff();
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const { kind, state, page, pageSize } = inviteListQuery.parse(params);
  const now = new Date();

  const where: Prisma.AuthTokenWhereInput = {
    type: "INVITE",
    ...(kind === "staff" ? { platformRole: { not: null } } : kind === "organization" ? { organizationId: { not: null } } : {}),
    ...stateWhere(state, now),
  };

  const [total, invites] = await Promise.all([
    prisma.authToken.count({ where }),
    prisma.authToken.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...pageArgs(page, pageSize),
      select: {
        id: true,
        email: true,
        platformRole: true,
        orgRole: true,
        expiresAt: true,
        usedAt: true,
        revokedAt: true,
        createdAt: true,
        createdById: true,
        organization: { select: { id: true, name: true, status: true } },
      },
    }),
  ]);

  const creatorIds = [...new Set(invites.map((i) => i.createdById).filter((id): id is string => !!id))];
  const creators = creatorIds.length
    ? await prisma.user.findMany({ where: { id: { in: creatorIds } }, select: { id: true, name: true, email: true } })
    : [];
  const creatorById = new Map(creators.map((c) => [c.id, c]));

  return NextResponse.json({
    total,
    page,
    pageSize,
    items: invites.map((i) => ({
      id: i.id,
      email: i.email,
      kind: i.platformRole ? "staff" : "organization",
      platformRole: i.platformRole,
      orgRole: i.orgRole,
      organization: i.organization,
      state: tokenState(i),
      expiresAt: i.expiresAt,
      usedAt: i.usedAt,
      createdAt: i.createdAt,
      createdBy: i.createdById ? (creatorById.get(i.createdById) ?? null) : null,
    })),
  });
});

/** Invites a new platform staff member (ADMIN). Superadmin only. */
export const POST = handle(async (req: NextRequest) => {
  const ctx = await requireStaff("SUPERADMIN");
  const { email, role } = staffInviteSchema.parse(await readJson(req));

  const existingIds = await findUserIdsByEmail(email);
  const existing = existingIds.length
    ? await prisma.user.findFirst({ where: { id: { in: existingIds }, role: { in: ["ADMIN", "SUPERADMIN"] } }, select: { role: true } })
    : null;
  if (existing) {
    throw conflict("already_staff", "Энэ хүн аль хэдийн ажилтны эрхтэй байна.");
  }

  await prisma.authToken.updateMany({
    where: { type: "INVITE", email, platformRole: { not: null }, usedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  const { raw, record } = await createAuthToken({ type: "INVITE", email, platformRole: role, createdById: ctx.userId });
  const link = inviteUrl(raw, req.url);
  const { sent } = await sendEmail({ to: email, ...inviteEmail({ link, roleLabel: "платформын админ · platform admin" }) });

  await audit({
    action: "admin.invite.created",
    actor: actorOf(ctx),
    targetType: "invite",
    targetId: record.id,
    meta: { platformRole: role, emailSent: sent },
    headers: req.headers,
  });
  return NextResponse.json(
    { id: record.id, inviteUrl: link, emailSent: sent, expiresAt: record.expiresAt },
    { status: 201, headers: { "cache-control": "private, no-store" } }
  );
});
