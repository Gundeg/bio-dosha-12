import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pulseTableSchema, type PulseTable } from "@/lib/apiSchemas";
import { ALL_THERAPY_KEYS } from "@/lib/clinicalConstants";
import { calcAge } from "@/lib/bediEngine";
import { PatientDetailTabs, type PatientDetailIntake } from "@/components/clinical/PatientDetailTabs";

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
  return Object.fromEntries(
    ALL_THERAPY_KEYS.map((key) => [key, Number(log[key] ?? 0)])
  );
}

export default async function PatientDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "PRACTITIONER") redirect("/dashboard");

  const { id } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id, practitionerId: session.user.id },
    include: {
      profile: {
        include: {
          bediRecords: { orderBy: { date: "desc" }, take: 1 },
          intakes: {
            orderBy: { admissionDate: "desc" },
            include: { treatmentLog: true },
          },
        },
      },
    },
  });

  if (!patient) notFound();

  const profile = patient.profile;
  const age = calcAge(profile.birthDate.toISOString());

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
    treatmentLog: flattenTreatmentLog(
      intake.treatmentLog as unknown as Record<string, unknown> | null
    ),
  }));

  const defaultWeightKg = profile.bediRecords[0]?.weightKg ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">
          {profile.lastName ? `${profile.lastName} ` : ""}
          {profile.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {age} нас • {profile.sex === "MALE" ? "Эрэгтэй" : "Эмэгтэй"}
          {profile.phone ? ` • ${profile.phone}` : ""}
        </p>
      </div>

      <PatientDetailTabs
        patientId={patient.id}
        patientName={`${profile.lastName ?? ""} ${profile.name}`.trim()}
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
        doctorName={session.user.name ?? ""}
      />
    </div>
  );
}
