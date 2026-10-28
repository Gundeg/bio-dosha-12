import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CLINICAL_ROLES, actorOf, requireAuth, requireOrgManager, requireOrgMember } from "@/lib/authz";
import { HttpError, forbidden, handle, notFound, readJson } from "@/lib/http";
import { ORG_MEMBER_ROLES } from "@/lib/schemas/organization";
import { assertWithinLimit, getEffectivePlan, lockLimit } from "@/lib/entitlements";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Params = { params: Promise<{ orgId: string; memberId: string }> };

const updateSchema = z.object({
  role: z.enum(ORG_MEMBER_ROLES).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  title: z.string().trim().max(100).optional().nullable(),
});

/**
 * Changes a member's role, status or title.
 * Rules: only an OWNER grants or removes OWNER; the last active OWNER cannot be
 * demoted or disabled; clinical roles respect the plan's practitioner limit.
 */
export const PATCH = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireAuth();
  const { orgId, memberId } = await params;
  const me = requireOrgManager(ctx, orgId);
  const data = updateSchema.parse(await readJson(req));

  const member = await prisma.organizationMember.findFirst({ where: { id: memberId, organizationId: orgId } });
  if (!member) throw notFound();

  // No self-promotion: a manager (no clinical access) must not grant themselves
  // a clinical role, and nobody disables or demotes themselves by accident.
  if (member.userId === ctx.userId && (data.role !== undefined || data.status !== undefined)) {
    throw forbidden("Өөрийн эрх, төлөвийг өөрчлөх боломжгүй. Өөр эзэн эсвэл менежерээс хүснэ үү.");
  }

  // Only an owner grants access to patient records: promoting to a clinical
  // role, or re-enabling a clinical member. Managers may still reduce access.
  const resultingRole = data.role ?? member.role;
  const grantsClinical =
    (data.role !== undefined && data.role !== member.role && CLINICAL_ROLES.includes(data.role)) ||
    (data.status === "ACTIVE" && member.status === "DISABLED" && CLINICAL_ROLES.includes(resultingRole));
  if (grantsClinical && me.role !== "OWNER") {
    throw new HttpError(403, "clinical_grant_owner_only", "Өвчтөний мэдээлэлд хандах эрхийг зөвхөн эзэн олгоно.");
  }

  const touchesOwner = member.role === "OWNER" || data.role === "OWNER";
  if (touchesOwner && me.role !== "OWNER" && (data.role !== undefined || data.status !== undefined)) {
    throw forbidden("Эзний эрхийг зөвхөн эзэн өөрчилнө.");
  }
  const losesOwner =
    member.role === "OWNER" &&
    member.status === "ACTIVE" &&
    ((data.role !== undefined && data.role !== "OWNER") || data.status === "DISABLED");

  // Does the change take a clinical seat the member did not hold before?
  const resultingStatus = data.status ?? member.status;
  const takesSeat =
    resultingStatus === "ACTIVE" &&
    CLINICAL_ROLES.includes(resultingRole) &&
    !(member.status === "ACTIVE" && CLINICAL_ROLES.includes(member.role));
  const plan = takesSeat ? await getEffectivePlan({ organizationId: orgId }) : null;

  // Checks and the write share one transaction with locks (owners first, then
  // seats, everywhere), so parallel changes cannot remove the last owner or
  // pass the plan's practitioner limit.
  const updated = await prisma.$transaction(async (tx) => {
    if (losesOwner) {
      await lockLimit(tx, `owners:${orgId}`);
      const owners = await tx.organizationMember.count({ where: { organizationId: orgId, role: "OWNER", status: "ACTIVE" } });
      if (owners <= 1) throw new HttpError(409, "last_owner", "Байгууллагад дор хаяж нэг идэвхтэй эзэн байх ёстой.");
    }
    if (plan) {
      await lockLimit(tx, `practitioners:${orgId}`);
      const seats = await tx.organizationMember.count({
        where: { organizationId: orgId, status: "ACTIVE", role: { in: ["OWNER", "PRACTITIONER"] } },
      });
      assertWithinLimit(plan, "maxPractitioners", seats, "эмчийн тоо");
    }
    return tx.organizationMember.update({ where: { id: memberId }, data });
  });

  if (data.role !== undefined && data.role !== member.role) {
    await audit({
      action: "org.member.role_changed",
      actor: actorOf(ctx),
      organizationId: orgId,
      targetType: "member",
      targetId: memberId,
      meta: { from: member.role, to: data.role, userId: member.userId },
      headers: req.headers,
    });
  }
  if (data.status !== undefined && data.status !== member.status) {
    await audit({
      action: data.status === "DISABLED" ? "org.member.disabled" : "org.member.enabled",
      actor: actorOf(ctx),
      organizationId: orgId,
      targetType: "member",
      targetId: memberId,
      meta: { userId: member.userId },
      headers: req.headers,
    });
  }
  return NextResponse.json(updated);
});

/** Removes a member (managers), or lets a member leave (self). */
export const DELETE = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireAuth();
  const { orgId, memberId } = await params;
  const me = requireOrgMember(ctx, orgId);

  const member = await prisma.organizationMember.findFirst({ where: { id: memberId, organizationId: orgId } });
  if (!member) throw notFound();

  const isSelf = member.userId === ctx.userId;
  if (!isSelf) {
    requireOrgManager(ctx, orgId);
    if (member.role === "OWNER" && me.role !== "OWNER") throw forbidden("Эзнийг зөвхөн эзэн хасна.");
  }
  await prisma.$transaction(async (tx) => {
    if (member.role === "OWNER" && member.status === "ACTIVE") {
      await lockLimit(tx, `owners:${orgId}`);
      const owners = await tx.organizationMember.count({ where: { organizationId: orgId, role: "OWNER", status: "ACTIVE" } });
      if (owners <= 1) throw new HttpError(409, "last_owner", "Байгууллагад дор хаяж нэг идэвхтэй эзэн байх ёстой.");
    }
    await tx.organizationMember.delete({ where: { id: memberId } });
  });
  await prisma.user.updateMany({
    where: { id: member.userId, activeOrganizationId: orgId },
    data: { activeOrganizationId: null },
  });
  await audit({
    action: "org.member.removed",
    actor: actorOf(ctx),
    organizationId: orgId,
    targetType: "member",
    targetId: memberId,
    meta: { userId: member.userId, self: isSelf },
    headers: req.headers,
  });
  return NextResponse.json({ ok: true });
});
