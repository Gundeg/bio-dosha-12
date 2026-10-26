import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBEDI, calcAge } from "@/lib/bediEngine";
import { DoshaKey } from "@/lib/ktMapping";
import { bediCreateSchema, bediQuerySchema } from "@/lib/apiSchemas";
import { getRemedies } from "@/lib/remedyEngine";
import { actorOf, loadAccessibleProfile, requireAuth } from "@/lib/authz";
import { HttpError, handle, notFound, readJson } from "@/lib/http";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export const POST = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const { profileId, weightKg, season, notes } = bediCreateSchema.parse(await readJson(req));

  const access = await loadAccessibleProfile(ctx, profileId);
  if (!access) throw notFound("Профайл олдсонгүй.");
  const { profile } = access;
  if (!profile.ktScore) throw new HttpError(400, "assessment_required", "Эхлээд махбодын үнэлгээг хийнэ үү.");

  // The BEDI formula itself lives in src/lib/bediEngine.ts and is owner-controlled.
  const age = calcAge(profile.birthDate);
  const result = calculateBEDI({
    weightKg,
    heightCm: profile.heightCm,
    age,
    sex: profile.sex,
    season,
    kt: profile.ktScore,
  });

  const remedies = getRemedies(
    result.status,
    age,
    (profile.doshaType as DoshaKey | null) ?? undefined,
    result.deviation
  );

  const record = await prisma.bEDIRecord.create({
    data: {
      profileId,
      weightKg,
      season,
      bedi: result.bedi,
      deviation: result.deviation,
      status: result.status,
      notes,
      recommendation: {
        create: {
          remedies: remedies.remedies,
          avoidFoods: remedies.avoidFoods,
          riskFactors: remedies.riskFactors,
          ageNote: remedies.ageNote,
          lifestyle: remedies.lifestyle,
          validationStatus: remedies.validation?.status ?? null,
          validationAction: remedies.validation?.action ?? null,
        },
      },
    },
    include: { recommendation: true },
  });

  if (access.organizationId) {
    await audit({
      action: "record.created",
      actor: actorOf(ctx),
      organizationId: access.organizationId,
      targetType: "profile",
      targetId: profileId,
      headers: req.headers,
    });
  }
  return NextResponse.json({ record, result, remedies });
});

export const GET = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const { profileId } = bediQuerySchema.parse({
    profileId: new URL(req.url).searchParams.get("profileId"),
  });
  const access = await loadAccessibleProfile(ctx, profileId);
  if (!access) throw notFound();

  const records = await prisma.bEDIRecord.findMany({
    where: { profileId },
    orderBy: { date: "desc" },
    include: { recommendation: true },
  });
  return NextResponse.json(records);
});
