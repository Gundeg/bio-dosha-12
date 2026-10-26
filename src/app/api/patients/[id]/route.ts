import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actorOf, requireAuth } from "@/lib/authz";
import { forbidden, handle } from "@/lib/http";
import { loadClinicalPatient } from "@/lib/clinical";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export const GET = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireAuth();
  const { id } = await params;
  const { patient, membership } = await loadClinicalPatient(ctx, id);

  const full = await prisma.patient.findUnique({
    where: { id: patient.id },
    include: {
      practitioner: { select: { id: true, name: true } },
      profile: {
        include: {
          bediRecords: { orderBy: { date: "desc" }, take: 1 },
          intakes: { orderBy: { admissionDate: "desc" }, include: { treatmentLog: true } },
        },
      },
    },
  });

  await audit({
    action: "patient.viewed",
    actor: actorOf(ctx),
    organizationId: membership.organizationId,
    targetType: "patient",
    targetId: patient.id,
    headers: req.headers,
  });
  return NextResponse.json(full);
});

/**
 * Permanently erases a patient: intake cards, treatment logs, BEDI records,
 * recommendations and the patient's profile. Allowed for the organization
 * owner and for the practitioner who registered the patient.
 */
export const DELETE = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = await requireAuth();
  const { id } = await params;
  const { patient, membership } = await loadClinicalPatient(ctx, id);
  if (membership.role !== "OWNER" && patient.practitionerId !== ctx.userId) {
    throw forbidden("Өвчтөний мэдээллийг зөвхөн байгууллагын эзэн эсвэл бүртгэсэн эмч устгана.");
  }

  // The profile is owned by the organization; deleting it cascades to the
  // patient link, intakes (and their treatment logs) and BEDI records.
  await prisma.profile.delete({ where: { id: patient.profileId } });

  await audit({
    action: "patient.deleted",
    actor: actorOf(ctx),
    organizationId: membership.organizationId,
    targetType: "patient",
    targetId: patient.id,
    headers: req.headers,
  });
  return NextResponse.json({ ok: true });
});
