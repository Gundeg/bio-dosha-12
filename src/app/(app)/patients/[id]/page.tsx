import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { actorOf, getAuthContext, requireClinical, type AuthContext } from "@/lib/authz";
import { HttpError } from "@/lib/http";
import { loadClinicalPatient } from "@/lib/clinical";
import { getEffectivePlan, hasFeature } from "@/lib/entitlements";
import { audit } from "@/lib/audit";
import { pulseTableSchema, type PulseTable } from "@/lib/apiSchemas";
import { ALL_THERAPY_KEYS } from "@/lib/clinicalConstants";
import { calcAge } from "@/lib/bediEngine";
import { PageHeader } from "@/components/kit/layout";
import {
  ClinicalAccessState,
  isClinicalAccessCode,
  type ClinicalAccessCode,
} from "@/components/clinical/ClinicalAccessState";
import { PatientDetailTabs, type PatientDetailIntake } from "@/components/clinical/PatientDetailTabs";
import { DeletePatientButton } from "@/components/clinical/DeletePatientButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

function safeParsePulse(value: unknown): PulseTable | null {
  if (!value) return null;
  const result = pulseTableSchema.safeParse(value);
  return result.success ? result.data : null;
}

function flattenTreatmentLog(log: Record<string, unknown> | null) {
  if (!log) return null;
  return Object.fromEntries(ALL_THERAPY_KEYS.map((key) => [key, Number(log[key] ?? 0)]));
}

/**
 * Opening a patient card is a record view, logged like GET /api/patients/[id].
 * Tab switches and saves re-render this page, so one entry per person and
 * patient is written every few minutes rather than one per click.
 */
const VIEW_LOG_WINDOW_MS = 10 * 60 * 1000;

async function logPatientView(ctx: AuthContext, organizationId: string, patientId: string, requestHeaders: Headers) {
  const recent = await prisma.auditLog.findFirst({
    where: {
      actorId: ctx.userId,
      at: { gte: new Date(Date.now() - VIEW_LOG_WINDOW_MS) },
      action: "patient.viewed",
      targetId: patientId,
    },
    select: { id: true },
  });
  if (recent) return;
  await audit({
    action: "patient.viewed",
    actor: actorOf(ctx),
    organizationId,
    targetType: "patient",
    targetId: patientId,
    headers: requestHeaders,
  });
}

/** Why patient records are closed in the active organization, or null when they are open. */
function closedReason(ctx: AuthContext): ClinicalAccessCode | null {
  try {
    requireClinical(ctx);
    return null;
  } catch (err) {
    if (err instanceof HttpError && isClinicalAccessCode(err.code)) return err.code;
    throw err;
  }
}

export default async function PatientDetailPage({ params }: PageProps) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const { id } = await params;
  const t = await getTranslations("patients");

  // Same checks as GET /api/patients/[id]: the patient must belong to an
  // organization where the person works clinically (owner or practitioner,
  // organization active, 2-step sign-in on).
  let loaded: Awaited<ReturnType<typeof loadClinicalPatient>>;
  try {
    loaded = await loadClinicalPatient(ctx, id);
  } catch (err) {
    if (!(err instanceof HttpError)) throw err;
    // Another organization's patient is reported as "not found". When patient
    // records are closed for the person altogether, say why instead.
    const code = isClinicalAccessCode(err.code) ? err.code : err.status === 404 ? closedReason(ctx) : null;
    if (code) {
      const orgName = ctx.activeMembership?.organizationName;
      return (
        <div className="space-y-6">
          <PageHeader eyebrow={orgName} title={t("title")} />
          <ClinicalAccessState code={code} organizationName={orgName} />
        </div>
      );
    }
    if (err.status === 404) notFound();
    throw err;
  }

  const { patient, membership } = loaded;
  const [full, plan, ts, requestHeaders] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: patient.id },
      include: {
        practitioner: { select: { name: true } },
        profile: {
          include: {
            bediRecords: { orderBy: { date: "desc" }, take: 1 },
            intakes: {
              orderBy: { admissionDate: "desc" },
              include: { treatmentLog: true, practitioner: { select: { name: true } } },
            },
          },
        },
      },
    }),
    getEffectivePlan({ organizationId: membership.organizationId }),
    getTranslations("shared"),
    headers(),
  ]);
  if (!full) notFound();

  await logPatientView(ctx, membership.organizationId, patient.id, requestHeaders);

  const profile = full.profile;
  const age = calcAge(profile.birthDate.toISOString());
  const patientName = `${profile.lastName ?? ""} ${profile.name}`.trim();
  // The API allows deletion by the organization owner or the registering practitioner.
  const canDelete = membership.role === "OWNER" || full.practitionerId === ctx.userId;

  type IntakeRow = (typeof profile.intakes)[number];
  const intakes: PatientDetailIntake[] = profile.intakes.map((intake: IntakeRow) => ({
    id: intake.id,
    admissionDate: intake.admissionDate.toISOString(),
    dischargeDate: intake.dischargeDate?.toISOString() ?? null,
    season: intake.season,
    weightKg: intake.weightKg,
    heightCm: intake.heightCm,
    tongue: intake.tongue,
    pulseSummary: intake.pulseSummary,
    pulseTable: safeParsePulse(intake.pulseTable),
    complaintAtArrival: intake.complaintAtArrival,
    condition: intake.condition as PatientDetailIntake["condition"],
    mentalState: intake.mentalState as PatientDetailIntake["mentalState"],
    position: intake.position as PatientDetailIntake["position"],
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
    practitionerName: intake.practitioner?.name ?? null,
    treatmentLog: flattenTreatmentLog(intake.treatmentLog as unknown as Record<string, unknown> | null),
  }));

  const defaultWeightKg = profile.bediRecords[0]?.weightKg ?? null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={membership.organizationName}
        title={patientName}
        backHref="/patients"
        backLabel={t("backToList")}
        description={
          <>
            {t("ageSex", { age, sex: ts(`sex.${profile.sex === "MALE" ? "MALE" : "FEMALE"}`) })}
            {profile.phone ? ` • ${profile.phone}` : ""}
            {full.practitioner?.name && (
              <span className="mt-0.5 block text-xs">{t("registeredBy", { name: full.practitioner.name })}</span>
            )}
          </>
        }
        actions={canDelete ? <DeletePatientButton patientId={patient.id} patientName={patientName} /> : undefined}
        className="mb-2"
      />

      <Suspense fallback={null}>
        <PatientDetailTabs
          patientId={patient.id}
          patientName={patientName}
          profile={{
            id: profile.id,
            name: profile.name,
            lastName: profile.lastName,
            birthDate: profile.birthDate.toISOString(),
            sex: profile.sex,
            heightCm: profile.heightCm,
            registerNumber: profile.registerNumber,
            phone: profile.phone,
            address: profile.address,
            occupation: profile.occupation,
          }}
          intakes={intakes}
          defaultWeightKg={defaultWeightKg}
          doctorName={ctx.name}
          pdfEnabled={hasFeature(plan, "pdfReports")}
        />
      </Suspense>
    </div>
  );
}
