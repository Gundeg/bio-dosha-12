import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authz";
import { handle } from "@/lib/http";
import { getEffectivePlan, individualUsage } from "@/lib/entitlements";
import { isEmailEnabled } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Everything the interface needs about the signed-in user: account, 2-step
 * status, organization memberships (with the active one), personal plan and usage.
 */
export const GET = handle(async () => {
  const ctx = await requireAuth();
  const [user, plan, usage] = await Promise.all([
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
        passwordChangedAt: true,
        totpEnabledAt: true,
        recoveryCodeHashes: true,
      },
    }),
    getEffectivePlan({ userId: ctx.userId }),
    individualUsage(ctx.userId),
  ]);
  if (!user) return NextResponse.json({ error: "Not found", code: "not_found" }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    locale: user.locale,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    passwordChangedAt: user.passwordChangedAt,
    mfa: {
      enabled: !!user.totpEnabledAt,
      enabledAt: user.totpEnabledAt,
      required: ctx.mfaRequired,
      recoveryCodesLeft: user.recoveryCodeHashes.length,
    },
    isPlatformStaff: ctx.isPlatformStaff,
    isSuperadmin: ctx.isSuperadmin,
    memberships: ctx.memberships.map((m) => ({
      id: m.id,
      organizationId: m.organizationId,
      organizationName: m.organizationName,
      organizationStatus: m.organizationStatus,
      role: m.role,
      status: m.status,
    })),
    activeOrganizationId: ctx.activeOrganizationId,
    plan: {
      code: plan.code,
      nameMn: plan.nameMn,
      nameEn: plan.nameEn,
      limits: plan.limits,
      source: plan.source,
    },
    usage,
    emailEnabled: isEmailEnabled(),
  });
});
