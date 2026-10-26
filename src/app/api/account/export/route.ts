import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actorOf, requireAuth } from "@/lib/authz";
import { handle } from "@/lib/http";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Downloads everything the platform holds about the user personally: account
 * details, own and family profiles, BEDI history and recommendations.
 * Clinic records are the organization's and are not included.
 */
export const GET = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const [user, profiles] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locale: true,
        createdAt: true,
        lastLoginAt: true,
        privacyAcceptedAt: true,
        totpEnabledAt: true,
        memberships: { select: { role: true, status: true, createdAt: true, organization: { select: { name: true } } } },
      },
    }),
    prisma.profile.findMany({
      where: { userId: ctx.userId, organizationId: null },
      include: { bediRecords: { orderBy: { date: "asc" }, include: { recommendation: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  await audit({ action: "account.exported", actor: actorOf(ctx), headers: req.headers });
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), account: user, profiles }, null, 2);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="bio-dosha-12-my-data-${stamp}.json"`,
      "cache-control": "private, no-store",
    },
  });
});
