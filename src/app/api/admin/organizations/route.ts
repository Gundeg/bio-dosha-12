import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actorOf, requireStaff } from "@/lib/authz";
import { handle, readJson } from "@/lib/http";
import { adminOrgCreateSchema, orgListQuery, pageArgs } from "@/lib/schemas/admin";
import { createAuthToken, inviteUrl } from "@/lib/tokens";
import { inviteEmail, sendEmail } from "@/lib/email";
import { assignPlan } from "@/lib/subscriptions";
import { audit } from "@/lib/audit";
import type { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";

/** Organization list for verification and support. Counts only, no patient data. */
export const GET = handle(async (req: NextRequest) => {
  await requireStaff();
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const { q, status, page, pageSize } = orgListQuery.parse(params);

  const where: Prisma.OrganizationWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
            { registrationNumber: { contains: q, mode: "insensitive" } },
            { members: { some: { user: { email: { contains: q, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  };

  const [total, orgs, statusCounts] = await Promise.all([
    prisma.organization.count({ where }),
    prisma.organization.findMany({
      where,
      // Pending first (enum order PENDING, ACTIVE, SUSPENDED), newest first within each status.
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      ...pageArgs(page, pageSize),
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        status: true,
        createdAt: true,
        verifiedAt: true,
        suspendedAt: true,
        members: {
          where: { role: "OWNER" },
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { user: { select: { id: true, name: true, email: true } } },
        },
        subscription: { select: { status: true, plan: { select: { code: true, nameMn: true, nameEn: true } } } },
        _count: { select: { members: true, patients: true } },
      },
    }),
    prisma.organization.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    counts: Object.fromEntries(statusCounts.map((g) => [g.status, g._count._all])),
    items: orgs.map((o) => ({
      id: o.id,
      name: o.name,
      type: o.type,
      city: o.city,
      status: o.status,
      createdAt: o.createdAt,
      verifiedAt: o.verifiedAt,
      suspendedAt: o.suspendedAt,
      owner: o.members[0]?.user ?? null,
      memberCount: o._count.members,
      patientCount: o._count.patients,
      plan: o.subscription?.plan ?? null,
    })),
  });
});

/**
 * Creates an organization on someone's behalf (e.g. a clinic signed a
 * contract) and invites its owner. Staff-created organizations are verified.
 */
export const POST = handle(async (req: NextRequest) => {
  const ctx = await requireStaff();
  const { ownerEmail, status, planCode, ...fields } = adminOrgCreateSchema.parse(await readJson(req));
  const now = new Date();

  const org = await prisma.organization.create({
    data: {
      ...fields,
      status,
      ...(status === "ACTIVE" ? { verifiedAt: now, verifiedById: ctx.userId } : {}),
    },
  });

  try {
    if (planCode) {
      await assignPlan({ subject: { organizationId: org.id }, planCode, assignedById: ctx.userId, note: "Created by staff" });
    }
  } catch (err) {
    // No half-created organizations: undo and report the plan problem.
    await prisma.organization.delete({ where: { id: org.id } }).catch(() => undefined);
    throw err;
  }

  const { raw, record } = await createAuthToken({
    type: "INVITE",
    email: ownerEmail,
    organizationId: org.id,
    orgRole: "OWNER",
    createdById: ctx.userId,
  });
  const link = inviteUrl(raw, req.url);
  const { sent } = await sendEmail({
    to: ownerEmail,
    ...inviteEmail({ link, organizationName: org.name, roleLabel: "эзэн · owner" }),
  });

  const actor = actorOf(ctx);
  await audit({
    action: "admin.org.created",
    actor,
    organizationId: org.id,
    targetType: "organization",
    targetId: org.id,
    meta: { status, planCode: planCode ?? null },
    headers: req.headers,
  });
  await audit({
    action: "admin.invite.created",
    actor,
    organizationId: org.id,
    targetType: "invite",
    targetId: record.id,
    meta: { orgRole: "OWNER", emailSent: sent },
    headers: req.headers,
  });

  return NextResponse.json(
    { organization: { id: org.id, name: org.name, status: org.status }, inviteUrl: link, emailSent: sent, expiresAt: record.expiresAt },
    { status: 201, headers: { "cache-control": "private, no-store" } }
  );
});
