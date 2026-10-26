import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { profileCreateSchema } from "@/lib/apiSchemas";
import { requireAuth } from "@/lib/authz";
import { handle, readJson } from "@/lib/http";
import { assertWithinLimit, getEffectivePlan, lockLimit } from "@/lib/entitlements";

export const runtime = "nodejs";

/** The caller's own profiles (self and family). Patients live under /api/patients. */
export const GET = handle(async () => {
  const ctx = await requireAuth();
  const profiles = await prisma.profile.findMany({
    where: { userId: ctx.userId, organizationId: null, relationship: { not: "patient" } },
    include: {
      bediRecords: { orderBy: { date: "desc" }, take: 1, include: { recommendation: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(profiles);
});

export const POST = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const data = profileCreateSchema.parse(await readJson(req));

  const plan = await getEffectivePlan({ userId: ctx.userId });

  // Count and create under one lock so parallel requests cannot pass the limit.
  const profile = await prisma.$transaction(async (tx) => {
    await lockLimit(tx, `profiles:${ctx.userId}`);
    const count = await tx.profile.count({ where: { userId: ctx.userId, organizationId: null } });
    assertWithinLimit(plan, "maxProfiles", count, "профайлын тоо");
    return tx.profile.create({
      data: {
        userId: ctx.userId,
        name: data.name,
        birthDate: new Date(data.birthDate),
        sex: data.sex,
        heightCm: data.heightCm,
        doshaType: data.doshaType,
        ktScore: data.ktScore,
        relationship: data.relationship ?? "self",
      },
    });
  });
  return NextResponse.json(profile, { status: 201 });
});
