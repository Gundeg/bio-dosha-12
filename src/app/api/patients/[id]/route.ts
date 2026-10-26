import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PRACTITIONER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id, practitionerId: session.user.id },
    include: {
      profile: {
        include: {
          bediRecords: {
            orderBy: { date: "desc" },
            take: 1,
          },
          intakes: {
            orderBy: { admissionDate: "desc" },
            include: { treatmentLog: true },
          },
        },
      },
    },
  });

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(patient);
}

/**
 * Permanently erases a patient: intake cards, treatment logs, BEDI records,
 * recommendations, the patient link and the patient's profile. Runs in one
 * transaction so a failure leaves nothing half-deleted.
 */
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PRACTITIONER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const patient = await prisma.patient.findFirst({
    where: { id, practitionerId: session.user.id },
    include: { profile: { select: { id: true, userId: true, relationship: true } } },
  });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ownsProfile =
    patient.profile.userId === session.user.id && patient.profile.relationship === "patient";

  await prisma.$transaction(async (tx) => {
    // ClinicalIntake uses onDelete: Restrict, so intakes go first (treatment logs cascade).
    await tx.clinicalIntake.deleteMany({
      where: { profileId: patient.profileId, practitionerId: session.user.id },
    });
    if (ownsProfile) {
      // Cascades to the Patient link, BEDI records and their recommendations.
      await tx.profile.delete({ where: { id: patient.profileId } });
    } else {
      await tx.patient.delete({ where: { id: patient.id } });
    }
  });

  return NextResponse.json({ ok: true });
}
