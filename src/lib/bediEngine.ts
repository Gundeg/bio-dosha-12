import { SEASON_COEFFICIENTS, SeasonKey } from "./seasonFactors";
import {
  BEDI_THRESHOLDS,
  KT_WEIGHT_EXPONENT,
  MEAN_SEASON_COEFFICIENT,
  REFERENCE_BMI,
  SEASON_TILT_EXPONENT,
  roundBedi,
} from "./bediConfig";

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
  /** Тухайн хүний хувьд байх ёстой хэвийн жин (кг) */
  expectedWeightKg: number;
}

const STATUS_LABELS: Record<BEDIStatus, { mn: string; en: string }> = {
  khii_excess: { mn: "Хий арвидсан", en: "Wind Excess" },
  balanced: { mn: "Тэнцвэртэй", en: "Balanced" },
  shar_badgan_excess: { mn: "Шар/Бадган арвидсан", en: "Fire/Earth Excess" },
};

/**
 * Байх ёстой хэвийн жин: лавлагаа BMI · өндөр², махбодийн Kt-ээр зөөлөн
 * жинлэгдэнэ (Бадган төрөлх хүнд, Хий төрөлх хөнгөн байдгийг тусгана).
 */
export function expectedWeight(heightCm: number, kt: number): number {
  const heightM = Math.max(heightCm, 50) / 100;
  return REFERENCE_BMI * heightM * heightM * Math.pow(kt, KT_WEIGHT_EXPONENT);
}

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

  const heightM = Math.max(heightCm, 50) / 100;
  const genderCoeff = sex === "MALE" ? 1.1 : 1.0;
  const seasonCoeff = SEASON_COEFFICIENTS[season];
  const safeAge = Math.max(age, 1);

  // BEDI индекс — үндсэн (патентын) томьёо, өөрчлөгдөөгүй.
  const bedi =
    (weightKg * genderCoeff * seasonCoeff * culturalFactor) /
    (heightM * safeAge * kt);

  // Хазайлт — судалгааны загварын дагуу бодит жинг байх ёстой хэвийн
  // жинтэй харьцуулж, улирлын илчийг жилийн дундажтай нь харьцуулсан
  // налуугаар тусгана. (Өмнөх `bedi - 1` суурь нь насанд хүрэгчдэд
  // "Тэнцвэртэй" бүсэд хүрэх боломжгүй утга өгч байсан.)
  const weightRatio = weightKg / expectedWeight(heightCm, kt);
  const seasonTilt = Math.pow(
    seasonCoeff / MEAN_SEASON_COEFFICIENT,
    SEASON_TILT_EXPONENT
  );
  const deviation = weightRatio * seasonTilt - 1;

  const status: BEDIStatus =
    deviation < BEDI_THRESHOLDS.khiiBelow
      ? "khii_excess"
      : deviation > BEDI_THRESHOLDS.sharBadganAbove
      ? "shar_badgan_excess"
      : "balanced";

  return {
    bedi: roundBedi(bedi),
    deviation: roundBedi(deviation),
    status,
    statusLabel: STATUS_LABELS[status],
    deviationPercent: Math.round(deviation * 100),
    expectedWeightKg: roundBedi(expectedWeight(heightCm, kt)),
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
