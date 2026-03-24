import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const { name, birthDate, sex, heightCm, doshaType, ktScore, relationship } = await req.json();

  const profile = await prisma.profile.create({
    data: {
      userId: session.user.id,
      name,
      birthDate: new Date(birthDate),
      sex,
      heightCm,
      doshaType,
      ktScore,
      relationship: relationship ?? "patient",
    },
  });

  const patient = await prisma.patient.create({
    data: { practitionerId: session.user.id, profileId: profile.id },
    include: { profile: true },
  });

  return NextResponse.json(patient, { status: 201 });
}
