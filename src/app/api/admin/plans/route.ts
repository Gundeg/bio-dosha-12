import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actorOf, requireStaff } from "@/lib/authz";
import { conflict, handle, readJson } from "@/lib/http";
import { planCreateSchema } from "@/lib/schemas/admin";
import { parseLimits } from "@/lib/entitlements";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/** All plans with subscriber counts. Staff can read; only the superadmin edits. */
export const GET = handle(async () => {
  await requireStaff();
  const plans = await prisma.plan.findMany({
    orderBy: [{ audience: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { subscriptions: true } } },
  });
  return NextResponse.json(
    plans.map((p) => ({
      id: p.id,
      code: p.code,
      audience: p.audience,
      nameMn: p.nameMn,
      nameEn: p.nameEn,
      descriptionMn: p.descriptionMn,
      descriptionEn: p.descriptionEn,
      priceMonthlyMnt: p.priceMonthlyMnt,
      limits: parseLimits(p.limits),
      isDefault: p.isDefault,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      subscribers: p._count.subscriptions,
    }))
  );
});

/** Creates a plan. Making it the default moves the default flag from the old plan. */
export const POST = handle(async (req: NextRequest) => {
  const ctx = await requireStaff("SUPERADMIN");
  const data = planCreateSchema.parse(await readJson(req));

  const existing = await prisma.plan.findUnique({ where: { code: data.code }, select: { id: true } });
  if (existing) throw conflict("plan_code_taken", "Ийм кодтой багц аль хэдийн байна.");
  if (data.isDefault && data.isActive === false) {
    throw conflict("default_inactive", "Үндсэн багц идэвхтэй байх ёстой.");
  }

  if (data.isDefault) {
    await prisma.plan.updateMany({ where: { audience: data.audience, isDefault: true }, data: { isDefault: false } });
  }
  const plan = await prisma.plan.create({
    data: {
      code: data.code,
      audience: data.audience,
      nameMn: data.nameMn,
      nameEn: data.nameEn,
      descriptionMn: data.descriptionMn ?? null,
      descriptionEn: data.descriptionEn ?? null,
      priceMonthlyMnt: data.priceMonthlyMnt ?? null,
      limits: data.limits,
      isDefault: data.isDefault ?? false,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });
  await audit({
    action: "admin.plan.created",
    actor: actorOf(ctx),
    targetType: "plan",
    targetId: plan.id,
    meta: { code: plan.code, audience: plan.audience, isDefault: plan.isDefault },
    headers: req.headers,
  });
  return NextResponse.json(plan, { status: 201 });
});
