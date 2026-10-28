import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES, actorOf, requireAuth, requireOrgManager, requireOrgMember } from "@/lib/authz";
import { handle, notFound, readJson } from "@/lib/http";
import { organizationUpdateSchema } from "@/lib/schemas/organization";
import { getEffectivePlan, organizationUsage } from "@/lib/entitlements";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Params = { params: Promise<{ orgId: string }> };

/** Organization profile, status, plan and usage for its members. */
export const GET = handle(async (_req: NextRequest, { params }: Params) => {
  const ctx = await requireAuth();
  const { orgId } = await params;
  const membership = requireOrgMember(ctx, orgId);

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw notFound();
  const [plan, usage] = await Promise.all([getEffectivePlan({ organizationId: orgId }), organizationUsage(orgId)]);

  return NextResponse.json({
    organization: {
      id: org.id,
      name: org.name,
      type: org.type,
      registrationNumber: org.registrationNumber,
      phone: org.phone,
      email: org.email,
      address: org.address,
      city: org.city,
      status: org.status,
      verifiedAt: org.verifiedAt,
      suspendedAt: org.suspendedAt,
      suspendedReason: org.suspendedReason,
      createdAt: org.createdAt,
    },
    myRole: membership.role,
    canManage: MANAGER_ROLES.includes(membership.role),
    plan: {
      code: plan.code,
      nameMn: plan.nameMn,
      nameEn: plan.nameEn,
      limits: plan.limits,
      priceMonthlyMnt: plan.priceMonthlyMnt,
      source: plan.source,
      currentPeriodEnd: plan.subscription?.currentPeriodEnd ?? null,
    },
    usage,
  });
});

/** Updates the organization profile (owners and organization admins). */
export const PATCH = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireAuth();
  const { orgId } = await params;
  requireOrgManager(ctx, orgId);
  const data = organizationUpdateSchema.parse(await readJson(req));

  const org = await prisma.organization.update({ where: { id: orgId }, data });
  await audit({
    action: "org.updated",
    actor: actorOf(ctx),
    organizationId: orgId,
    targetType: "organization",
    targetId: orgId,
    meta: { fields: Object.keys(data).join(",") },
    headers: req.headers,
  });
  return NextResponse.json(org);
});
