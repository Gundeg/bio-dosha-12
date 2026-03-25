import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patientSchema = z.object({
  name: z.string().min(1),
  birthDate: z.string().refine((d) => {
    const date = new Date(d);
    return !isNaN(date.getTime()) && date < new Date();
  }, { message: "birthDate must be a valid past date" }),
  sex: z.enum(["MALE", "FEMALE"]),
  heightCm: z.number().positive().max(300),
  doshaType: z.string().optional().nullable(),
  ktScore: z.number().optional().nullable(),
  relationship: z.string().optional(),
});

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
  const parsed = patientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { name, birthDate, sex, heightCm, doshaType, ktScore, relationship } = parsed.data;

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
