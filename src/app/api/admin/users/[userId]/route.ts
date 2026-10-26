import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { actorOf, requireStaff } from "@/lib/authz";
import { HttpError, forbidden, handle, notFound, readJson } from "@/lib/http";
import { userActionSchema } from "@/lib/schemas/admin";
import { getEffectivePlan, individualUsage } from "@/lib/entitlements";
import { assignPlan } from "@/lib/subscriptions";
import { deleteAccount, planAccountDeletion } from "@/lib/accountLifecycle";
import { audit } from "@/lib/audit";
import { mfaResetNoticeEmail, sendEmail } from "@/lib/email";
import { buildAppUrl } from "@/lib/tokens";

export const runtime = "nodejs";

type Params = { params: Promise<{ userId: string }> };

/** Account detail for the control center (no health records). */
export const GET = handle(async (_req: NextRequest, { params }: Params) => {
  const ctx = await requireStaff();
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      locale: true,
      createdAt: true,
      lastLoginAt: true,
      passwordChangedAt: true,
      privacyAcceptedAt: true,
      disabledAt: true,
      disabledReason: true,
      totpEnabledAt: true,
      recoveryCodeHashes: true,
      memberships: {
        select: {
          id: true,
          role: true,
          status: true,
          createdAt: true,
          organization: { select: { id: true, name: true, status: true } },
        },
      },
      _count: { select: { profiles: true } },
    },
  });
  if (!user) throw notFound();

  const [plan, usage, records, deletion, recentActivity] = await Promise.all([
    getEffectivePlan({ userId }),
    individualUsage(userId),
    prisma.bEDIRecord.count({ where: { profile: { userId } } }),
    planAccountDeletion(userId),
    ctx.isSuperadmin
      ? prisma.auditLog.findMany({
          where: { OR: [{ actorId: userId }, { targetId: userId }] },
          orderBy: { at: "desc" },
          take: 25,
          select: { id: true, at: true, action: true, actorEmail: true, ip: true, targetType: true, targetId: true, meta: true },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      locale: user.locale,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      passwordChangedAt: user.passwordChangedAt,
      privacyAcceptedAt: user.privacyAcceptedAt,
      disabledAt: user.disabledAt,
      disabledReason: user.disabledReason,
      mfaEnabled: !!user.totpEnabledAt,
      recoveryCodesLeft: user.recoveryCodeHashes.length,
    },
    memberships: user.memberships.map((m) => ({
      id: m.id,
      role: m.role,
      status: m.status,
      joinedAt: m.createdAt,
      organization: m.organization,
    })),
    plan: {
      code: plan.code,
      nameMn: plan.nameMn,
      nameEn: plan.nameEn,
      source: plan.source,
      limits: plan.limits,
      note: plan.subscription?.note ?? null,
      currentPeriodEnd: plan.subscription?.currentPeriodEnd ?? null,
    },
    usage: { ...usage, records },
    deletion,
    recentActivity,
  });
});

/**
 * Account actions. Guard rails: nobody acts on their own account here, a
 * SUPERADMIN account cannot be changed from the control center, and ADMIN
 * staff cannot act on other staff.
 */
export const PATCH = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireStaff();
  const { userId } = await params;
  const body = userActionSchema.parse(await readJson(req));

  if (userId === ctx.userId) throw forbidden("Өөрийн бүртгэлийг Тохиргоо хэсгээс удирдана уу.");
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
  if (!target) throw notFound();
  if (target.role === "SUPERADMIN") throw forbidden("Супер админы бүртгэлийг эндээс өөрчлөх боломжгүй.");
  if (target.role === "ADMIN" && !ctx.isSuperadmin) throw forbidden("Ажилтны бүртгэлийг зөвхөн супер админ өөрчилнө.");

  const actor = actorOf(ctx);
  const base = { actor, targetType: "user", targetId: userId, headers: req.headers } as const;

  switch (body.action) {
    case "disable":
      await prisma.user.update({
        where: { id: userId },
        data: { disabledAt: new Date(), disabledReason: body.reason, sessionVersion: { increment: 1 } },
      });
      await audit({ ...base, action: "admin.user.disabled", meta: { reason: body.reason } });
      break;
    case "enable":
      await prisma.user.update({ where: { id: userId }, data: { disabledAt: null, disabledReason: null } });
      await audit({ ...base, action: "admin.user.enabled" });
      break;
    case "signout":
      await prisma.user.update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } } });
      await audit({ ...base, action: "admin.user.signed_out" });
      break;
    case "reset_mfa":
      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: null,
          totpEnabledAt: null,
          totpLastStep: null,
          recoveryCodeHashes: [],
          sessionVersion: { increment: 1 },
        },
      });
      await sendEmail({ to: target.email, ...mfaResetNoticeEmail({ loginLink: buildAppUrl("/login", req.url) }) });
      await audit({ ...base, action: "admin.user.mfa_reset" });
      break;
    case "set_role":
      if (!ctx.isSuperadmin) throw forbidden("Ажилтны эрхийг зөвхөн супер админ өгнө.");
      await prisma.user.update({ where: { id: userId }, data: { role: body.role, sessionVersion: { increment: 1 } } });
      await audit({ ...base, action: "admin.user.role_changed", meta: { from: target.role, to: body.role } });
      break;
    case "set_plan":
      await assignPlan({
        subject: { userId },
        planCode: body.planCode,
        note: body.note,
        currentPeriodEnd: body.currentPeriodEnd ? new Date(body.currentPeriodEnd) : null,
        assignedById: ctx.userId,
      });
      await audit({ ...base, action: "admin.user.plan_changed", meta: { planCode: body.planCode, note: body.note ?? null } });
      break;
  }
  return NextResponse.json({ ok: true });
});

const deleteSchema = z.object({ confirmEmail: z.string().trim().min(3), deleteSoleOrganizations: z.boolean().optional() });

/** Permanent deletion (superadmin only, typed email confirmation). */
export const DELETE = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireStaff("SUPERADMIN");
  const { userId } = await params;
  const body = deleteSchema.parse(await readJson(req));
  if (userId === ctx.userId) throw forbidden("Өөрийн бүртгэлийг устгах боломжгүй.");

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
  if (!target) throw notFound();
  if (target.role === "SUPERADMIN") throw forbidden("Супер админы бүртгэлийг устгах боломжгүй.");
  if (body.confirmEmail.toLowerCase() !== target.email.toLowerCase()) {
    throw new HttpError(400, "confirm_mismatch", "Баталгаажуулах имэйл таарахгүй байна.");
  }

  const result = await deleteAccount(userId, { deleteSoleOrganizations: !!body.deleteSoleOrganizations });
  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          result.reason === "owner_required"
            ? "Энэ хэрэглэгч бусад гишүүнтэй байгууллагын цорын ганц эзэн. Эхлээд эзнийг шилжүүлнэ үү."
            : "Энэ хэрэглэгчийн ганцаараа байгаа байгууллага хамт устна. Баталгаажуулна уу.",
        code: result.reason,
        plan: result.plan,
      },
      { status: 409 }
    );
  }
  await audit({
    action: "admin.user.deleted",
    actor: actorOf(ctx),
    targetType: "user",
    targetId: userId,
    meta: { email: target.email, organizationsDeleted: result.plan.organizationsToDelete.length },
    headers: req.headers,
  });
  return NextResponse.json({ ok: true });
});
