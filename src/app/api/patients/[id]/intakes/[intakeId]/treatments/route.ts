import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { treatmentLogUpdateSchema } from "@/lib/apiSchemas";
import { actorOf, requireAuth } from "@/lib/authz";
import { handle, readJson } from "@/lib/http";
import { loadClinicalPatient, loadPatientIntake } from "@/lib/clinical";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export const PATCH = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string; intakeId: string }> }) => {
    const ctx = await requireAuth();
    const { id, intakeId } = await params;
    const { patient } = await loadClinicalPatient(ctx, id);
    await loadPatientIntake(patient, intakeId);
    const data = treatmentLogUpdateSchema.parse(await readJson(req));

    const log = await prisma.treatmentLog.upsert({
      where: { intakeId },
      create: { intakeId, ...data },
      update: data,
    });
    await audit({
      action: "intake.updated",
      actor: actorOf(ctx),
      organizationId: patient.organizationId,
      targetType: "intake",
      targetId: intakeId,
      meta: { part: "treatments", patientId: patient.id },
      headers: req.headers,
    });
    return NextResponse.json(log);
  }
);
