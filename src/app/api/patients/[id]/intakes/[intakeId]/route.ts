import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clinicalIntakeUpdateSchema } from "@/lib/apiSchemas";
import { actorOf, requireAuth } from "@/lib/authz";
import { handle, readJson } from "@/lib/http";
import { loadClinicalPatient, loadPatientIntake } from "@/lib/clinical";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; intakeId: string }> };

export const GET = handle(async (_req: NextRequest, { params }: Params) => {
  const ctx = await requireAuth();
  const { id, intakeId } = await params;
  const { patient } = await loadClinicalPatient(ctx, id);
  return NextResponse.json(await loadPatientIntake(patient, intakeId));
});

export const PATCH = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireAuth();
  const { id, intakeId } = await params;
  const { patient, membership } = await loadClinicalPatient(ctx, id);
  await loadPatientIntake(patient, intakeId);
  const data = clinicalIntakeUpdateSchema.parse(await readJson(req));

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

  await audit({
    action: "intake.updated",
    actor: actorOf(ctx),
    organizationId: membership.organizationId,
    targetType: "intake",
    targetId: intakeId,
    meta: { patientId: patient.id },
    headers: req.headers,
  });
  return NextResponse.json(intake);
});
