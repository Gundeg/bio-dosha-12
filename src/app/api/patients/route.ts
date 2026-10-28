import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { patientCreateSchema } from "@/lib/apiSchemas";
import { actorOf, requireAuth, requireClinical } from "@/lib/authz";
import { handle, readJson } from "@/lib/http";
import { assertWithinLimit, getEffectivePlan, lockLimit } from "@/lib/entitlements";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Patients of the organization the caller is working in. Only what the list
 * and reports show: contact details, register numbers and clinical notes stay
 * on the patient's own page (data minimisation).
 */
export const GET = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const membership = requireClinical(ctx);

  const patients = await prisma.patient.findMany({
    where: { organizationId: membership.organizationId },
    select: {
      id: true,
      addedAt: true,
      practitioner: { select: { id: true, name: true } },
      profile: {
        select: {
          id: true,
          name: true,
          lastName: true,
          birthDate: true,
          sex: true,
          heightCm: true,
          doshaType: true,
          ktScore: true,
          bediRecords: {
            orderBy: { date: "desc" },
            take: 1,
            select: {
              id: true,
              date: true,
              bedi: true,
              deviation: true,
              status: true,
              weightKg: true,
              season: true,
              recommendation: true,
            },
          },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  await audit({
    action: "patient.listed",
    actor: actorOf(ctx),
    organizationId: membership.organizationId,
    targetType: "organization",
    targetId: membership.organizationId,
    meta: { count: patients.length },
    headers: req.headers,
  });
  return NextResponse.json(patients);
});

export const POST = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const membership = requireClinical(ctx);
  const data = patientCreateSchema.parse(await readJson(req));
  const organizationId = membership.organizationId;
  const plan = await getEffectivePlan({ organizationId });

  // Count and create under one lock, so parallel requests cannot exceed the
  // plan's patient limit; profile and patient are created together or not at all.
  const patient = await prisma.$transaction(async (tx) => {
    await lockLimit(tx, `patients:${organizationId}`);
    assertWithinLimit(plan, "maxPatients", await tx.patient.count({ where: { organizationId } }), "өвчтөний тоо");

    // The profile belongs to the organization, not to the practitioner, so the
    // record stays with the clinic if the practitioner leaves.
    const profile = await tx.profile.create({
      data: {
        organizationId,
        name: data.name,
        lastName: data.lastName,
        birthDate: new Date(data.birthDate),
        sex: data.sex,
        heightCm: data.heightCm,
        doshaType: data.doshaType,
        ktScore: data.ktScore,
        relationship: "patient",
        registerNumber: data.registerNumber,
        phone: data.phone,
        address: data.address,
        occupation: data.occupation,
      },
    });
    return tx.patient.create({
      data: { organizationId, practitionerId: ctx.userId, profileId: profile.id },
      include: { profile: true },
    });
  });

  await audit({
    action: "patient.created",
    actor: actorOf(ctx),
    organizationId,
    targetType: "patient",
    targetId: patient.id,
    headers: req.headers,
  });
  return NextResponse.json(patient, { status: 201 });
});
