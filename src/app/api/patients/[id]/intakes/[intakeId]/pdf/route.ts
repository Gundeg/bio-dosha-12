import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { ClinicalIntakeDocument } from "@/lib/clinicalIntakePdf";
import { ALL_THERAPY_KEYS } from "@/lib/clinicalConstants";
import { actorOf, requireAuth } from "@/lib/authz";
import { handle, notFound } from "@/lib/http";
import { loadClinicalPatient } from "@/lib/clinical";
import { assertFeature, getEffectivePlan } from "@/lib/entitlements";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export const GET = handle(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string; intakeId: string }> }
) => {
  const ctx = await requireAuth();
  const { id, intakeId } = await params;
  const { patient, membership } = await loadClinicalPatient(ctx, id);
  assertFeature(await getEffectivePlan({ organizationId: membership.organizationId }), "pdfReports", "PDF тайлан");

  const intake = await prisma.clinicalIntake.findFirst({
    where: { id: intakeId, profileId: patient.profileId, organizationId: patient.organizationId },
    include: { profile: true, treatmentLog: true, practitioner: { select: { name: true } } },
  });
  if (!intake) throw notFound();

  const treatmentLog = intake.treatmentLog
    ? Object.fromEntries(
        ALL_THERAPY_KEYS.map((key) => [
          key,
          Number((intake.treatmentLog as unknown as Record<string, unknown>)[key] ?? 0),
        ])
      )
    : null;

  const buffer = await renderToBuffer(
    ClinicalIntakeDocument({
      intake: {
        admissionDate: intake.admissionDate,
        dischargeDate: intake.dischargeDate,
        season: intake.season,
        weightKg: intake.weightKg,
        heightCm: intake.heightCm,
        tongue: intake.tongue,
        pulseSummary: intake.pulseSummary,
        pulseTable: intake.pulseTable,
        complaintAtArrival: intake.complaintAtArrival,
        condition: intake.condition,
        mentalState: intake.mentalState,
        position: intake.position,
        zurkhai: intake.zurkhai,
        diagnosis: intake.diagnosis,
        treatmentPlan: intake.treatmentPlan,
        covidHistory: intake.covidHistory,
        surgeryHistory: intake.surgeryHistory,
        chronicDisease: intake.chronicDisease,
        traumaHistory: intake.traumaHistory,
        bloodPressure: intake.bloodPressure,
        heartRate: intake.heartRate,
        complaintAtDischarge: intake.complaintAtDischarge,
        recommendations: intake.recommendations,
        treatmentLog,
      },
      profile: {
        name: intake.profile.name,
        lastName: intake.profile.lastName,
        birthDate: intake.profile.birthDate,
        sex: intake.profile.sex,
        registerNumber: intake.profile.registerNumber,
        phone: intake.profile.phone,
        address: intake.profile.address,
        occupation: intake.profile.occupation,
      },
      // The intake's author signs the card; fall back to the person printing it.
      doctorName: intake.practitioner?.name ?? ctx.name,
    })
  );

  await audit({
    action: "intake.pdf_exported",
    actor: actorOf(ctx),
    organizationId: membership.organizationId,
    targetType: "intake",
    targetId: intakeId,
    meta: { patientId: patient.id },
    headers: req.headers,
  });

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="intake-${intakeId}.pdf"`,
      // Contains patient identifiers and diagnosis: never store in shared caches.
      "cache-control": "private, no-store",
    },
  });
});
