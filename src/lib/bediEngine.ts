import { SEASON_COEFFICIENTS, SeasonKey } from "./seasonFactors";

export type BEDIStatus = "khii_excess" | "balanced" | "shar_badgan_excess";

export interface BEDIInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: "MALE" | "FEMALE";
  season: SeasonKey;
  kt: number;
  culturalFactor?: number; // defaults to 1.0
}

export interface BEDIResult {
  bedi: number;
  deviation: number;
  status: BEDIStatus;
  statusLabel: { mn: string; en: string };
  deviationPercent: number;
}

const STATUS_LABELS: Record<BEDIStatus, { mn: string; en: string }> = {
  khii_excess: { mn: "Хий арвидсан", en: "Wind Excess" },
  balanced: { mn: "Тэнцвэртэй", en: "Balanced" },
  shar_badgan_excess: { mn: "Шар/Бадган арвидсан", en: "Fire/Earth Excess" },
};

export function calculateBEDI(input: BEDIInput): BEDIResult {
  const {
    weightKg,
    heightCm,
    age,
    sex,
    season,
    kt,
    culturalFactor = 1.0,
  } = input;

  const heightM = heightCm / 100;
  const genderCoeff = sex === "MALE" ? 1.1 : 1.0;
  const seasonCoeff = SEASON_COEFFICIENTS[season];
  const safeAge = Math.max(age, 1);

  const bedi =
    (weightKg * genderCoeff * seasonCoeff * culturalFactor) /
    (heightM * safeAge * kt);

  const deviation = bedi / 1.0 - 1;

  const status: BEDIStatus =
    deviation < -0.3
      ? "khii_excess"
      : deviation > 0.3
      ? "shar_badgan_excess"
      : "balanced";

  return {
    bedi: Math.round(bedi * 100) / 100,
    deviation: Math.round(deviation * 100) / 100,
    status,
    statusLabel: STATUS_LABELS[status],
    deviationPercent: Math.round(deviation * 100),
  };
}

/** Calculate age in years from birthDate */
export function calcAge(birthDate: Date | string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
