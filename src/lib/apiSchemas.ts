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
  birthDate: pastDateStringSchema,
  sex: sexSchema,
  heightCm: z.number().finite().positive().max(300),
  doshaType: optionalDoshaTypeSchema,
  ktScore: optionalKtScoreSchema,
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
