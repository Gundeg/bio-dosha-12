import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClinicalIntakeDocument } from "@/lib/clinicalIntakePdf";
import { ALL_THERAPY_KEYS } from "@/lib/clinicalConstants";

export const runtime = "nodejs";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; intakeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PRACTITIONER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, intakeId } = await params;

  const intake = await prisma.clinicalIntake.findFirst({
    where: {
      id: intakeId,
      practitionerId: session.user.id,
      profile: {
        asPatient: { some: { id, practitionerId: session.user.id } },
      },
    },
    include: { profile: true, treatmentLog: true },
  });
  if (!intake) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
      doctorName: session.user.name ?? "",
    })
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="intake-${intakeId}.pdf"`,
    },
  });
}
