import { prisma } from "./prisma";
import { notFound } from "./http";
import { clinicalOrganizationIds, requireClinical, type AuthContext } from "./authz";

/**
 * Loads a patient the caller may treat. A patient of another organization is
 * reported as "not found" (never "forbidden"), so ids cannot be probed.
 */
export async function loadClinicalPatient(ctx: AuthContext, patientId: string) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, organizationId: true, profileId: true, practitionerId: true },
  });
  if (!patient?.organizationId || !clinicalOrganizationIds(ctx).includes(patient.organizationId)) {
    throw notFound();
  }
  const membership = requireClinical(ctx, patient.organizationId);
  return { patient: { ...patient, organizationId: patient.organizationId }, membership };
}

/**
 * Loads an intake of the given (already authorized) patient. It must belong to
 * the patient's profile and to the patient's organization (defence in depth).
 */
export async function loadPatientIntake(patient: { profileId: string; organizationId: string }, intakeId: string) {
  const intake = await prisma.clinicalIntake.findFirst({
    where: { id: intakeId, profileId: patient.profileId, organizationId: patient.organizationId },
    include: { treatmentLog: true },
  });
  if (!intake) throw notFound();
  return intake;
}
