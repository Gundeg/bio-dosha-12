import { z } from "zod";
import { DOSHA_MAP, type DoshaKey } from "./ktMapping";

const DOSHA_KEYS = Object.keys(DOSHA_MAP) as [DoshaKey, ...DoshaKey[]];

export const sexSchema = z.enum(["MALE", "FEMALE"]);
export const seasonSchema = z.enum(["WINTER", "SPRING", "SUMMER", "AUTUMN"]);
export const relationshipSchema = z.enum(["self", "spouse", "child", "parent", "other"]);
export const doshaKeySchema = z.enum(DOSHA_KEYS);

export const pastDateStringSchema = z.string().refine(
  (value) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && date < new Date();
  },
  { message: "birthDate must be a valid past date" }
);

const optionalDoshaTypeSchema = doshaKeySchema.optional().nullable();
const optionalKtScoreSchema = z.number().finite().positive().max(2).optional().nullable();

export const profileCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  birthDate: pastDateStringSchema,
  sex: sexSchema,
  heightCm: z.number().finite().positive().max(300),
  doshaType: optionalDoshaTypeSchema,
  ktScore: optionalKtScoreSchema,
  relationship: relationshipSchema.optional(),
});

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    heightCm: z.number().finite().positive().max(300).optional(),
    doshaType: optionalDoshaTypeSchema,
    ktScore: optionalKtScoreSchema,
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.heightCm !== undefined ||
      value.doshaType !== undefined ||
      value.ktScore !== undefined,
    { message: "At least one field must be provided" }
  );

export const patientCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional().nullable(),
  birthDate: pastDateStringSchema,
  sex: sexSchema,
  heightCm: z.number().finite().positive().max(300),
  doshaType: optionalDoshaTypeSchema,
  ktScore: optionalKtScoreSchema,
  registerNumber: z.string().trim().max(50).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  occupation: z.string().trim().max(200).optional().nullable(),
});

export const bediCreateSchema = z.object({
  profileId: z.string().trim().min(1),
  weightKg: z.number().finite().positive().max(500),
  season: seasonSchema,
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const bediQuerySchema = z.object({
  profileId: z.string().trim().min(1),
});

const pulseCellSchema = z.object({
  rightTop: z.string().trim().max(200).optional().default(""),
  rightBottom: z.string().trim().max(200).optional().default(""),
  leftTop: z.string().trim().max(200).optional().default(""),
  leftBottom: z.string().trim().max(200).optional().default(""),
});

export const pulseTableSchema = z.object({
  dolovor: pulseCellSchema,
  dund: pulseCellSchema,
  yadam: pulseCellSchema,
});

export type PulseTable = z.infer<typeof pulseTableSchema>;

export const emptyPulseTable: PulseTable = {
  dolovor: { rightTop: "", rightBottom: "", leftTop: "", leftBottom: "" },
  dund: { rightTop: "", rightBottom: "", leftTop: "", leftBottom: "" },
  yadam: { rightTop: "", rightBottom: "", leftTop: "", leftBottom: "" },
};

const conditionSchema = z.enum(["light", "medium", "severe"]);
const mentalStateSchema = z.enum(["clear", "notClear"]);
const positionSchema = z.enum(["active", "inactive"]);
const dateStringSchema = z.string().refine(
  (value) => Number.isFinite(new Date(value).getTime()),
  { message: "Invalid date" }
);

export const clinicalIntakeCreateSchema = z.object({
  admissionDate: dateStringSchema,
  season: seasonSchema,
  weightKg: z.number().finite().positive().max(500),
  heightCm: z.number().finite().positive().max(300),
  tongue: z.string().trim().max(500).optional().nullable(),
  pulseSummary: z.string().trim().max(500).optional().nullable(),
  pulseTable: pulseTableSchema.optional().nullable(),
  complaintAtArrival: z.string().trim().max(2000).optional().nullable(),
  condition: conditionSchema.optional().nullable(),
  mentalState: mentalStateSchema.optional().nullable(),
  position: positionSchema.optional().nullable(),
  zurkhai: z.string().trim().max(500).optional().nullable(),
  diagnosis: z.string().trim().max(2000).optional().nullable(),
  treatmentPlan: z.string().trim().max(4000).optional().nullable(),
  covidHistory: z.string().trim().max(500).optional().nullable(),
  surgeryHistory: z.string().trim().max(500).optional().nullable(),
  chronicDisease: z.string().trim().max(500).optional().nullable(),
  traumaHistory: z.string().trim().max(500).optional().nullable(),
  bloodPressure: z.string().trim().max(50).optional().nullable(),
  heartRate: z.string().trim().max(50).optional().nullable(),
});

export const clinicalIntakeUpdateSchema = clinicalIntakeCreateSchema.partial().extend({
  dischargeDate: dateStringSchema.optional().nullable(),
  complaintAtDischarge: z.string().trim().max(2000).optional().nullable(),
  recommendations: z.string().trim().max(4000).optional().nullable(),
});

const sessionCount = z.number().int().min(0).max(10);

export const treatmentLogUpdateSchema = z.object({
  tractionNeck: sessionCount.optional(),
  tractionBack: sessionCount.optional(),
  barriaaHead: sessionCount.optional(),
  barriaaNeckShoulder: sessionCount.optional(),
  barriaaBack: sessionCount.optional(),
  barriaaLegs: sessionCount.optional(),
  acupuncture: sessionCount.optional(),
  cupping: sessionCount.optional(),
  heatTreatment: sessionCount.optional(),
  oilZad5: sessionCount.optional(),
  oilBoigor10: sessionCount.optional(),
  oilSenden4: sessionCount.optional(),
  oilSesame: sessionCount.optional(),
  oilGinger: sessionCount.optional(),
  oilMilk: sessionCount.optional(),
  oilZad5Tail: sessionCount.optional(),
  oilGarlic: sessionCount.optional(),
  hotStone: sessionCount.optional(),
  electrophoresis: sessionCount.optional(),
  detox: sessionCount.optional(),
  footReflex: sessionCount.optional(),
  bloodletting: sessionCount.optional(),
  moxibustion: sessionCount.optional(),
  exerciseTherapy: sessionCount.optional(),
});

export type ClinicalIntakeCreate = z.infer<typeof clinicalIntakeCreateSchema>;
export type ClinicalIntakeUpdate = z.infer<typeof clinicalIntakeUpdateSchema>;
export type TreatmentLogUpdate = z.infer<typeof treatmentLogUpdateSchema>;
