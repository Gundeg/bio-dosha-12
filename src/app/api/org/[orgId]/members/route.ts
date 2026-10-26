import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES, requireAuth, requireOrgMember } from "@/lib/authz";
import { handle } from "@/lib/http";

export const runtime = "nodejs";

/** Members of the organization. Email addresses are shown to managers only. */
export const GET = handle(async (_req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) => {
  const ctx = await requireAuth();
  const { orgId } = await params;
  const me = requireOrgMember(ctx, orgId);
  const isManager = MANAGER_ROLES.includes(me.role);

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, name: true, email: true, totpEnabledAt: true, lastLoginAt: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(
    members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: isManager || m.userId === ctx.userId ? m.user.email : null,
      role: m.role,
      status: m.status,
      title: m.title,
      mfaEnabled: !!m.user.totpEnabledAt,
      lastLoginAt: isManager ? m.user.lastLoginAt : null,
      joinedAt: m.createdAt,
      isMe: m.userId === ctx.userId,
    }))
  );
});
