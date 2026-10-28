import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/authz";
import { handle } from "@/lib/http";

export const runtime = "nodejs";

type DayCount = { day: Date; count: bigint };

function lastDays(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Control-center dashboard. Aggregates only: counts and daily totals, never
 * the content of any health record.
 */
export const GET = handle(async () => {
  const ctx = await requireStaff();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    users,
    staff,
    disabledUsers,
    orgByStatus,
    activeClinicalMembers,
    patients,
    personalProfiles,
    records30d,
    signupDays,
    recordDays,
    pendingOrganizations,
    staffWithoutMfa,
    membersWithoutMfa,
    failedLogins24h,
    blockedLogins24h,
    plans,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: { in: ["ADMIN", "SUPERADMIN"] } } }),
    prisma.user.count({ where: { disabledAt: { not: null } } }),
    prisma.organization.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.organizationMember.count({ where: { status: "ACTIVE", role: { in: ["OWNER", "PRACTITIONER"] } } }),
    prisma.patient.count(),
    prisma.profile.count({ where: { organizationId: null } }),
    prisma.bEDIRecord.count({ where: { date: { gte: since30 } } }),
    prisma.$queryRaw<DayCount[]>`SELECT date_trunc('day', "createdAt") AS day, count(*)::bigint AS count FROM "User" WHERE "createdAt" >= ${since30} GROUP BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT date_trunc('day', "date") AS day, count(*)::bigint AS count FROM "BEDIRecord" WHERE "date" >= ${since30} GROUP BY 1`,
    prisma.organization.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        createdAt: true,
        members: { where: { role: "OWNER" }, take: 1, select: { user: { select: { name: true, email: true } } } },
      },
    }),
    prisma.user.count({ where: { role: { in: ["ADMIN", "SUPERADMIN"] }, totpEnabledAt: null } }),
    prisma.user.count({ where: { totpEnabledAt: null, memberships: { some: { status: "ACTIVE" } } } }),
    prisma.auditLog.count({ where: { action: "auth.login.failure", at: { gte: since24h } } }),
    prisma.auditLog.count({ where: { action: "auth.login.blocked", at: { gte: since24h } } }),
    prisma.plan.findMany({
      orderBy: [{ audience: "asc" }, { sortOrder: "asc" }],
      select: { id: true, code: true, nameMn: true, nameEn: true, audience: true, isDefault: true, _count: { select: { subscriptions: true } } },
    }),
    ctx.isSuperadmin
      ? prisma.auditLog.findMany({
          orderBy: { at: "desc" },
          take: 10,
          select: { id: true, at: true, action: true, actorEmail: true, targetType: true, targetId: true, organizationId: true },
        })
      : Promise.resolve([]),
  ]);

  const toMap = (rows: DayCount[]) => new Map(rows.map((r) => [new Date(r.day).toISOString().slice(0, 10), Number(r.count)]));
  const signups = toMap(signupDays);
  const calcs = toMap(recordDays);
  const orgStatus = Object.fromEntries(orgByStatus.map((g) => [g.status, g._count._all])) as Record<string, number>;

  return NextResponse.json({
    totals: {
      users,
      staff,
      disabledUsers,
      organizations: {
        pending: orgStatus.PENDING ?? 0,
        active: orgStatus.ACTIVE ?? 0,
        suspended: orgStatus.SUSPENDED ?? 0,
      },
      practitioners: activeClinicalMembers,
      patients,
      personalProfiles,
      calculations30d: records30d,
    },
    series: lastDays(30).map((day) => ({ day, signups: signups.get(day) ?? 0, calculations: calcs.get(day) ?? 0 })),
    pendingOrganizations: pendingOrganizations.map((o) => ({
      id: o.id,
      name: o.name,
      type: o.type,
      city: o.city,
      createdAt: o.createdAt,
      owner: o.members[0]?.user ?? null,
    })),
    security: { staffWithoutMfa, membersWithoutMfa, failedLogins24h, blockedLogins24h, disabledUsers },
    plans: plans.map((p) => ({
      id: p.id,
      code: p.code,
      nameMn: p.nameMn,
      nameEn: p.nameEn,
      audience: p.audience,
      isDefault: p.isDefault,
      subscribers: p._count.subscriptions,
    })),
    recentActivity,
    viewer: { role: ctx.role, isSuperadmin: ctx.isSuperadmin },
  });
});
