import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { patientCreateSchema } from "@/lib/apiSchemas";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PRACTITIONER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const patients = await prisma.patient.findMany({
    where: { practitionerId: session.user.id },
    include: {
      profile: {
        include: {
          bediRecords: { orderBy: { date: "desc" }, take: 1, include: { recommendation: true } },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PRACTITIONER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patientCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const {
    name,
    lastName,
    birthDate,
    sex,
    heightCm,
    doshaType,
    ktScore,
    registerNumber,
    phone,
    address,
    occupation,
  } = parsed.data;

  const profile = await prisma.profile.create({
    data: {
      userId: session.user.id,
      name,
      lastName,
      birthDate: new Date(birthDate),
      sex,
      heightCm,
      doshaType,
      ktScore,
      relationship: "patient",
      registerNumber,
      phone,
      address,
      occupation,
    },
  });

  const patient = await prisma.patient.create({
    data: { practitionerId: session.user.id, profileId: profile.id },
    include: { profile: true },
  });

  return NextResponse.json(patient, { status: 201 });
}
