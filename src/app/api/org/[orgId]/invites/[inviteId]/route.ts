import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actorOf, requireAuth, requireOrgManager } from "@/lib/authz";
import { handle, notFound } from "@/lib/http";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/** Revokes a pending invitation. */
export const DELETE = handle(
  async (req: NextRequest, { params }: { params: Promise<{ orgId: string; inviteId: string }> }) => {
    const ctx = await requireAuth();
    const { orgId, inviteId } = await params;
    requireOrgManager(ctx, orgId, { allowSuspended: true });

    const invite = await prisma.authToken.findFirst({ where: { id: inviteId, organizationId: orgId, type: "INVITE" } });
    if (!invite) throw notFound();
    if (!invite.usedAt && !invite.revokedAt) {
      await prisma.authToken.update({ where: { id: inviteId }, data: { revokedAt: new Date() } });
    }
    await audit({
      action: "org.invite.revoked",
      actor: actorOf(ctx),
      organizationId: orgId,
      targetType: "invite",
      targetId: inviteId,
      headers: req.headers,
    });
    return NextResponse.json({ ok: true });
  }
);
