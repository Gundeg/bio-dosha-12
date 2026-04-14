import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateBEDI, calcAge } from "@/lib/bediEngine";
import { DoshaKey } from "@/lib/ktMapping";
import { bediCreateSchema, bediQuerySchema } from "@/lib/apiSchemas";
import { getRemedies } from "@/lib/remedyEngine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bediCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { profileId, weightKg, season, notes } = parsed.data;

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: session.user.id },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (!profile.ktScore) return NextResponse.json({ error: "Complete assessment first" }, { status: 400 });

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

  return NextResponse.json({ record, result, remedies });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bediQuerySchema.safeParse({
    profileId: new URL(req.url).searchParams.get("profileId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { profileId } = parsed.data;

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: session.user.id },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const records = await prisma.bEDIRecord.findMany({
    where: { profileId },
    orderBy: { date: "desc" },
    include: { recommendation: true },
  });

  return NextResponse.json(records);
}
