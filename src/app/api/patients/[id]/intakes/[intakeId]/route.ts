import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clinicalIntakeUpdateSchema } from "@/lib/apiSchemas";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string; intakeId: string }>;
}

async function authorize(patientId: string, intakeId: string, practitionerId: string) {
  const intake = await prisma.clinicalIntake.findFirst({
    where: {
      id: intakeId,
      practitionerId,
      profile: {
        asPatient: { some: { id: patientId, practitionerId } },
      },
    },
    include: { treatmentLog: true },
  });
  return intake;
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PRACTITIONER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, intakeId } = await params;
  const intake = await authorize(id, intakeId, session.user.id);
  if (!intake) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(intake);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PRACTITIONER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, intakeId } = await params;
  const existing = await authorize(id, intakeId, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = clinicalIntakeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;
  const intake = await prisma.clinicalIntake.update({
    where: { id: intakeId },
    data: {
      ...(data.admissionDate !== undefined ? { admissionDate: new Date(data.admissionDate) } : {}),
      ...(data.dischargeDate !== undefined
        ? { dischargeDate: data.dischargeDate ? new Date(data.dischargeDate) : null }
        : {}),
      ...(data.season !== undefined ? { season: data.season } : {}),
      ...(data.weightKg !== undefined ? { weightKg: data.weightKg } : {}),
      ...(data.heightCm !== undefined ? { heightCm: data.heightCm } : {}),
      ...(data.tongue !== undefined ? { tongue: data.tongue } : {}),
      ...(data.pulseSummary !== undefined ? { pulseSummary: data.pulseSummary } : {}),
      ...(data.pulseTable ? { pulseTable: data.pulseTable } : {}),
      ...(data.complaintAtArrival !== undefined ? { complaintAtArrival: data.complaintAtArrival } : {}),
      ...(data.condition !== undefined ? { condition: data.condition } : {}),
      ...(data.mentalState !== undefined ? { mentalState: data.mentalState } : {}),
      ...(data.position !== undefined ? { position: data.position } : {}),
      ...(data.zurkhai !== undefined ? { zurkhai: data.zurkhai } : {}),
      ...(data.diagnosis !== undefined ? { diagnosis: data.diagnosis } : {}),
      ...(data.treatmentPlan !== undefined ? { treatmentPlan: data.treatmentPlan } : {}),
      ...(data.covidHistory !== undefined ? { covidHistory: data.covidHistory } : {}),
      ...(data.surgeryHistory !== undefined ? { surgeryHistory: data.surgeryHistory } : {}),
      ...(data.chronicDisease !== undefined ? { chronicDisease: data.chronicDisease } : {}),
      ...(data.traumaHistory !== undefined ? { traumaHistory: data.traumaHistory } : {}),
      ...(data.bloodPressure !== undefined ? { bloodPressure: data.bloodPressure } : {}),
      ...(data.heartRate !== undefined ? { heartRate: data.heartRate } : {}),
      ...(data.complaintAtDischarge !== undefined ? { complaintAtDischarge: data.complaintAtDischarge } : {}),
      ...(data.recommendations !== undefined ? { recommendations: data.recommendations } : {}),
    },
    include: { treatmentLog: true },
  });

  return NextResponse.json(intake);
}
