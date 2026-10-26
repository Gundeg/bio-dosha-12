import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actorOf, requireAuth } from "@/lib/authz";
import { HttpError, handle, readJson } from "@/lib/http";
import { organizationFieldsSchema } from "@/lib/schemas/organization";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/** Organizations the user belongs to. */
export const GET = handle(async () => {
  const ctx = await requireAuth();
  return NextResponse.json({
    activeOrganizationId: ctx.activeOrganizationId,
    memberships: ctx.memberships,
  });
});

/**
 * Registers a medical organization from an existing account. It starts as
 * PENDING with the caller as OWNER, exactly like sign-up as an organization.
 */
export const POST = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const data = organizationFieldsSchema.parse(await readJson(req));
  const pending = ctx.memberships.filter((m) => m.role === "OWNER" && m.organizationStatus === "PENDING");
  if (pending.length >= 2) {
    throw new HttpError(409, "too_many_pending", "Баталгаажуулалт хүлээж буй байгууллага аль хэдийн байна.");
  }

  const org = await prisma.organization.create({
    data: { ...data, status: "PENDING", members: { create: { userId: ctx.userId, role: "OWNER" } } },
  });
  await prisma.user.update({ where: { id: ctx.userId }, data: { activeOrganizationId: org.id } });
  await audit({
    action: "org.updated",
    actor: actorOf(ctx),
    organizationId: org.id,
    targetType: "organization",
    targetId: org.id,
    meta: { event: "registered" },
    headers: req.headers,
  });
  return NextResponse.json(org, { status: 201 });
});
