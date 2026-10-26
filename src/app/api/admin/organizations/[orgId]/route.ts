import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { actorOf, requireStaff } from "@/lib/authz";
import { HttpError, conflict, handle, notFound, readJson } from "@/lib/http";
import { orgActionSchema } from "@/lib/schemas/admin";
import { getEffectivePlan, organizationUsage } from "@/lib/entitlements";
import { assignPlan } from "@/lib/subscriptions";
import { tokenState } from "@/lib/tokens";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Params = { params: Promise<{ orgId: string }> };

/**
 * Organization detail for verification and support: profile, members, invites,
 * plan and usage. Patient records are never included, only their count.
 */
export const GET = handle(async (_req: NextRequest, { params }: Params) => {
  const ctx = await requireStaff();
  const { orgId } = await params;
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      members: {
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          role: true,
          status: true,
          title: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, email: true, totpEnabledAt: true, lastLoginAt: true, disabledAt: true },
          },
        },
      },
      invites: {
        where: { type: "INVITE" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, email: true, orgRole: true, expiresAt: true, usedAt: true, revokedAt: true, createdAt: true },
      },
      _count: { select: { patients: true, intakes: true } },
    },
  });
  if (!org) throw notFound();

  const verifier = org.verifiedById
    ? await prisma.user.findUnique({ where: { id: org.verifiedById }, select: { name: true, email: true } })
    : null;

  const [plan, usage, recentActivity] = await Promise.all([
    getEffectivePlan({ organizationId: orgId }),
    organizationUsage(orgId),
    ctx.isSuperadmin
      ? prisma.auditLog.findMany({
          where: { organizationId: orgId },
          orderBy: { at: "desc" },
          take: 25,
          select: { id: true, at: true, action: true, actorEmail: true, targetType: true, targetId: true },
        })
      : Promise.resolve([]),
  ]);

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
      createdAt: org.createdAt,
      verifiedAt: org.verifiedAt,
      verifiedBy: verifier,
      suspendedAt: org.suspendedAt,
      suspendedReason: org.suspendedReason,
    },
    members: org.members.map((m) => ({
      id: m.id,
      role: m.role,
      status: m.status,
      title: m.title,
      joinedAt: m.createdAt,
      user: {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        mfaEnabled: !!m.user.totpEnabledAt,
        lastLoginAt: m.user.lastLoginAt,
        disabled: !!m.user.disabledAt,
      },
    })),
    invites: org.invites.map((t) => ({
      id: t.id,
      email: t.email,
      role: t.orgRole,
      state: tokenState(t),
      expiresAt: t.expiresAt,
      createdAt: t.createdAt,
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
    usage: { ...usage, intakes: org._count.intakes },
    recentActivity,
  });
});

/** Verification, suspension, profile corrections and plan changes. */
export const PATCH = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireStaff();
  const { orgId } = await params;
  const body = orgActionSchema.parse(await readJson(req));
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true, status: true, verifiedAt: true } });
  if (!org) throw notFound();

  const base = { actor: actorOf(ctx), organizationId: orgId, targetType: "organization", targetId: orgId, headers: req.headers } as const;
  const now = new Date();

  switch (body.action) {
    case "verify":
      if (org.status !== "PENDING") throw conflict("not_pending", "Энэ байгууллага баталгаажуулалт хүлээгээгүй байна.");
      await prisma.organization.update({
        where: { id: orgId },
        data: { status: "ACTIVE", verifiedAt: now, verifiedById: ctx.userId },
      });
      await audit({ ...base, action: "admin.org.verified" });
      break;
    case "suspend":
      if (org.status === "SUSPENDED") throw conflict("already_suspended", "Байгууллага аль хэдийн түр хаагдсан.");
      await prisma.organization.update({
        where: { id: orgId },
        data: { status: "SUSPENDED", suspendedAt: now, suspendedReason: body.reason },
      });
      await audit({ ...base, action: "admin.org.suspended", meta: { reason: body.reason } });
      break;
    case "reactivate":
      if (org.status !== "SUSPENDED") throw conflict("not_suspended", "Байгууллага түр хаагдаагүй байна.");
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          status: "ACTIVE",
          suspendedAt: null,
          suspendedReason: null,
          ...(org.verifiedAt ? {} : { verifiedAt: now, verifiedById: ctx.userId }),
        },
      });
      await audit({ ...base, action: "admin.org.reactivated" });
      break;
    case "update": {
      // Prisma skips undefined values, so absent fields stay untouched.
      const changed = Object.keys(body.fields).filter((k) => body.fields[k as keyof typeof body.fields] !== undefined);
      if (!changed.length) throw new HttpError(400, "invalid", "Өөрчлөх талбар алга.");
      await prisma.organization.update({ where: { id: orgId }, data: body.fields });
      await audit({ ...base, action: "admin.org.updated", meta: { fields: changed.join(",") } });
      break;
    }
    case "set_plan":
      await assignPlan({
        subject: { organizationId: orgId },
        planCode: body.planCode,
        note: body.note,
        currentPeriodEnd: body.currentPeriodEnd ? new Date(body.currentPeriodEnd) : null,
        assignedById: ctx.userId,
      });
      await audit({ ...base, action: "admin.org.plan_changed", meta: { planCode: body.planCode, note: body.note ?? null } });
      break;
  }
  return NextResponse.json({ ok: true });
});

const deleteSchema = z.object({ confirmName: z.string().trim().min(1).max(200) });

/**
 * Permanently deletes the organization with all of its patients and clinical
 * records. Superadmin only, with the organization's name typed to confirm.
 */
export const DELETE = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireStaff("SUPERADMIN");
  const { orgId } = await params;
  const { confirmName } = deleteSchema.parse(await readJson(req));
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, _count: { select: { patients: true, members: true } } },
  });
  if (!org) throw notFound();
  if (confirmName !== org.name.trim()) {
    throw new HttpError(400, "confirm_mismatch", "Баталгаажуулах нэр таарахгүй байна.");
  }

  await prisma.user.updateMany({ where: { activeOrganizationId: orgId }, data: { activeOrganizationId: null } });
  await prisma.organization.delete({ where: { id: orgId } });
  await audit({
    action: "admin.org.deleted",
    actor: actorOf(ctx),
    organizationId: orgId,
    targetType: "organization",
    targetId: orgId,
    meta: { name: org.name, patients: org._count.patients, members: org._count.members },
    headers: req.headers,
  });
  return NextResponse.json({ ok: true });
});
