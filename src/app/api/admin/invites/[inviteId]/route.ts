import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actorOf, requireStaff, type AuthContext } from "@/lib/authz";
import { HttpError, conflict, forbidden, handle, notFound } from "@/lib/http";
import { createAuthToken, inviteUrl, tokenState } from "@/lib/tokens";
import { inviteEmail, isEmailEnabled, sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Params = { params: Promise<{ inviteId: string }> };

const ORG_ROLE_LABEL: Record<string, string> = { OWNER: "эзэн · owner", ADMIN: "менежер · manager", PRACTITIONER: "эмч · practitioner" };

async function loadInvite(ctx: AuthContext, inviteId: string) {
  const invite = await prisma.authToken.findUnique({
    where: { id: inviteId },
    include: { organization: { select: { name: true } } },
  });
  if (!invite || invite.type !== "INVITE") throw notFound();
  if (invite.platformRole && !ctx.isSuperadmin) throw forbidden("Ажилтны урилгыг зөвхөн супер админ удирдана.");
  return invite;
}

/**
 * Issues a fresh link for an invitation (the old link stops working). Used
 * when the person lost the link or it expired. Only the superadmin sees the
 * link itself; for platform admins it is emailed to the invited address, so
 * staff cannot accept an invitation themselves and join an organization.
 */
export const POST = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireStaff();
  const { inviteId } = await params;
  const invite = await loadInvite(ctx, inviteId);
  if (invite.usedAt) throw conflict("invite_used", "Урилгыг аль хэдийн хүлээн авсан байна.");
  if (!ctx.isSuperadmin && !isEmailEnabled()) {
    throw new HttpError(403, "email_required", "Имэйл илгээх тохиргоо идэвхгүй үед шинэ холбоосыг зөвхөн супер админ үүсгэнэ.");
  }

  const { raw, record } = await createAuthToken({
    type: "INVITE",
    email: invite.email,
    platformRole: invite.platformRole,
    organizationId: invite.organizationId,
    orgRole: invite.orgRole,
    createdById: ctx.userId,
  });
  const link = inviteUrl(raw, req.url);
  const roleLabel = invite.platformRole ? "платформын админ · platform admin" : (ORG_ROLE_LABEL[invite.orgRole ?? ""] ?? "гишүүн");
  const { sent } = await sendEmail({
    to: invite.email,
    ...inviteEmail({ link, organizationName: invite.organization?.name, roleLabel }),
  });
  if (!ctx.isSuperadmin && !sent) {
    // The old link keeps working when the new one could not be delivered.
    await prisma.authToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
    throw new HttpError(502, "email_failed", "Имэйл илгээж чадсангүй. Дахин оролдоно уу.");
  }
  await prisma.authToken.update({ where: { id: invite.id }, data: { revokedAt: invite.revokedAt ?? new Date() } });

  await audit({
    action: "admin.invite.created",
    actor: actorOf(ctx),
    organizationId: invite.organizationId,
    targetType: "invite",
    targetId: record.id,
    meta: { renewedFrom: invite.id, emailSent: sent },
    headers: req.headers,
  });
  return NextResponse.json(
    { id: record.id, inviteUrl: ctx.isSuperadmin ? link : null, emailSent: sent, expiresAt: record.expiresAt },
    { status: 201, headers: { "cache-control": "private, no-store" } }
  );
});

/** Revokes a pending invitation. */
export const DELETE = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireStaff();
  const { inviteId } = await params;
  const invite = await loadInvite(ctx, inviteId);
  if (tokenState(invite) !== "pending") throw conflict("invite_not_pending", "Энэ урилга идэвхгүй болсон байна.");

  await prisma.authToken.update({ where: { id: invite.id }, data: { revokedAt: new Date() } });
  await audit({
    action: "admin.invite.revoked",
    actor: actorOf(ctx),
    organizationId: invite.organizationId,
    targetType: "invite",
    targetId: invite.id,
    headers: req.headers,
  });
  return NextResponse.json({ ok: true });
});
