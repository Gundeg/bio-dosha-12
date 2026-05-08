import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clinicalIntakeCreateSchema, emptyPulseTable } from "@/lib/apiSchemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PRACTITIONER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id, practitionerId: session.user.id },
    select: { id: true, profileId: true },
  });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = clinicalIntakeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const intake = await prisma.clinicalIntake.create({
    data: {
      profileId: patient.profileId,
      practitionerId: session.user.id,
      admissionDate: new Date(parsed.data.admissionDate),
      season: parsed.data.season,
      weightKg: parsed.data.weightKg,
      heightCm: parsed.data.heightCm,
      tongue: parsed.data.tongue ?? null,
      pulseSummary: parsed.data.pulseSummary ?? null,
      pulseTable: parsed.data.pulseTable ?? emptyPulseTable,
      complaintAtArrival: parsed.data.complaintAtArrival ?? null,
      condition: parsed.data.condition ?? null,
      mentalState: parsed.data.mentalState ?? null,
      position: parsed.data.position ?? null,
      zurkhai: parsed.data.zurkhai ?? null,
      diagnosis: parsed.data.diagnosis ?? null,
      treatmentPlan: parsed.data.treatmentPlan ?? null,
      covidHistory: parsed.data.covidHistory ?? null,
      surgeryHistory: parsed.data.surgeryHistory ?? null,
      chronicDisease: parsed.data.chronicDisease ?? null,
      traumaHistory: parsed.data.traumaHistory ?? null,
      bloodPressure: parsed.data.bloodPressure ?? null,
      heartRate: parsed.data.heartRate ?? null,
      treatmentLog: { create: {} },
    },
    include: { treatmentLog: true },
  });

  return NextResponse.json(intake, { status: 201 });
}
