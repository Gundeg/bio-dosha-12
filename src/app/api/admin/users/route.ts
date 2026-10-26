import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/authz";
import { handle } from "@/lib/http";
import { pageArgs, userListQuery } from "@/lib/schemas/admin";
import type { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";

/** Searchable account list. Contains account data only, never health records. */
export const GET = handle(async (req: NextRequest) => {
  await requireStaff();
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const { q, role, status, type, mfa, page, pageSize } = userListQuery.parse(params);

  const where: Prisma.UserWhereInput = {
    ...(q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
      : {}),
    ...(role ? { role } : {}),
    ...(status === "disabled" ? { disabledAt: { not: null } } : status === "active" ? { disabledAt: null } : {}),
    ...(mfa === "off" ? { totpEnabledAt: null } : mfa === "on" ? { totpEnabledAt: { not: null } } : {}),
    ...(type === "staff"
      ? { role: { in: ["ADMIN", "SUPERADMIN"] } }
      : type === "member"
      ? { memberships: { some: {} } }
      : type === "individual"
      ? { memberships: { none: {} }, role: { in: ["INDIVIDUAL", "PRACTITIONER"] } }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...pageArgs(page, pageSize),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        disabledAt: true,
        totpEnabledAt: true,
        lastLoginAt: true,
        createdAt: true,
        memberships: {
          select: { organizationId: true, role: true, status: true, organization: { select: { name: true, status: true } } },
        },
        _count: { select: { profiles: true } },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    items: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      disabledAt: u.disabledAt,
      mfaEnabled: !!u.totpEnabledAt,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      profileCount: u._count.profiles,
      memberships: u.memberships.map((m) => ({
        organizationId: m.organizationId,
        organizationName: m.organization.name,
        organizationStatus: m.organization.status,
        role: m.role,
        status: m.status,
      })),
    })),
  });
});
