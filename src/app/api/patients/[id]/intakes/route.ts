import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clinicalIntakeCreateSchema, emptyPulseTable } from "@/lib/apiSchemas";
import { actorOf, requireAuth } from "@/lib/authz";
import { handle, readJson } from "@/lib/http";
import { loadClinicalPatient } from "@/lib/clinical";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export const POST = handle(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await requireAuth();
  const { id } = await params;
  const { patient, membership } = await loadClinicalPatient(ctx, id);
  const data = clinicalIntakeCreateSchema.parse(await readJson(req));

  const intake = await prisma.clinicalIntake.create({
    data: {
      profileId: patient.profileId,
      organizationId: membership.organizationId,
      practitionerId: ctx.userId,
      admissionDate: new Date(data.admissionDate),
      season: data.season,
      weightKg: data.weightKg,
      heightCm: data.heightCm,
      tongue: data.tongue ?? null,
      pulseSummary: data.pulseSummary ?? null,
      pulseTable: data.pulseTable ?? emptyPulseTable,
      complaintAtArrival: data.complaintAtArrival ?? null,
      condition: data.condition ?? null,
      mentalState: data.mentalState ?? null,
      position: data.position ?? null,
      zurkhai: data.zurkhai ?? null,
      diagnosis: data.diagnosis ?? null,
      treatmentPlan: data.treatmentPlan ?? null,
      covidHistory: data.covidHistory ?? null,
      surgeryHistory: data.surgeryHistory ?? null,
      chronicDisease: data.chronicDisease ?? null,
      traumaHistory: data.traumaHistory ?? null,
      bloodPressure: data.bloodPressure ?? null,
      heartRate: data.heartRate ?? null,
      treatmentLog: { create: {} },
    },
    include: { treatmentLog: true },
  });

  await audit({
    action: "intake.created",
    actor: actorOf(ctx),
    organizationId: membership.organizationId,
    targetType: "intake",
    targetId: intake.id,
    meta: { patientId: patient.id },
    headers: req.headers,
  });
  return NextResponse.json(intake, { status: 201 });
});
