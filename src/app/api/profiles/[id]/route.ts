import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/apiSchemas";
import { actorOf, loadAccessibleProfile, requireAuth } from "@/lib/authz";
import { forbidden, handle, notFound, readJson } from "@/lib/http";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Own profile, or a patient profile of an organization where the caller works clinically. */
export const GET = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireAuth();
  const { id } = await params;
  const access = await loadAccessibleProfile(ctx, id);
  if (!access) throw notFound();

  const profile = await prisma.profile.findUnique({
    where: { id },
    include: { bediRecords: { orderBy: { date: "desc" }, include: { recommendation: true } } },
  });

  if (access.organizationId) {
    await audit({
      action: "patient.viewed",
      actor: actorOf(ctx),
      organizationId: access.organizationId,
      targetType: "profile",
      targetId: id,
      headers: req.headers,
    });
  }
  return NextResponse.json(profile);
});

export const PATCH = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireAuth();
  const { id } = await params;
  const data = profileUpdateSchema.parse(await readJson(req));
  const access = await loadAccessibleProfile(ctx, id);
  if (!access) throw notFound();

  const profile = await prisma.profile.update({ where: { id }, data });

  if (access.organizationId) {
    await audit({
      action: "patient.updated",
      actor: actorOf(ctx),
      organizationId: access.organizationId,
      targetType: "profile",
      targetId: id,
      meta: { fields: Object.keys(data).join(",") },
      headers: req.headers,
    });
  }
  return NextResponse.json(profile);
});

/** Deletes one of the caller's own family profiles. Patients are removed through /api/patients. */
export const DELETE = handle(async (_req: NextRequest, { params }: Params) => {
  const ctx = await requireAuth();
  const { id } = await params;
  const profile = await prisma.profile.findFirst({ where: { id, userId: ctx.userId } });
  if (!profile) throw notFound();
  if (profile.relationship === "patient" || profile.organizationId) {
    throw forbidden("Өвчтөнийг өвчтөний хуудаснаас устгана.");
  }
  await prisma.profile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
