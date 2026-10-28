import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireOrgMember } from "@/lib/authz";
import { handle, readJson } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({ organizationId: z.string().min(1) });

/** Switches the organization the user is working in (when they belong to several). */
export const PUT = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const { organizationId } = schema.parse(await readJson(req));
  requireOrgMember(ctx, organizationId);
  await prisma.user.update({ where: { id: ctx.userId }, data: { activeOrganizationId: organizationId } });
  return NextResponse.json({ ok: true, activeOrganizationId: organizationId });
});
