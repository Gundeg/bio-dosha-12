import { describe, expect, it } from "vitest";
import { calcAge, calculateBEDI, expectedWeight, type BEDIStatus } from "../bediEngine";
import { BEDI_THRESHOLDS } from "../bediConfig";
import type { SeasonKey } from "../seasonFactors";

const SEASONS: SeasonKey[] = ["WINTER", "SPRING", "SUMMER", "AUTUMN"];

function run(weightKg: number, kt: number, season: SeasonKey, overrides?: Partial<Parameters<typeof calculateBEDI>[0]>) {
  return calculateBEDI({
    weightKg,
    heightCm: 170,
    age: 30,
    sex: "FEMALE",
    season,
    kt,
    ...overrides,
  });
}

describe("expectedWeight", () => {
  it("is reference BMI × height² at kt = 1.0", () => {
    expect(expectedWeight(170, 1.0)).toBeCloseTo(22 * 1.7 * 1.7, 2);
  });

  it("is lower for Хий (kt 0.70) and higher for Бадган (kt 1.50), damped", () => {
    const khii = expectedWeight(170, 0.7);
    const badgan = expectedWeight(170, 1.5);
    const neutral = expectedWeight(170, 1.0);
    expect(khii).toBeLessThan(neutral);
    expect(badgan).toBeGreaterThan(neutral);
    // damping: Бадганы хэвийн жин +50% биш ~+22% байх ёстой
    expect(badgan / neutral).toBeLessThan(1.3);
  });
});

describe("calculateBEDI — recalibrated deviation", () => {
  it("ideal-weight adult is balanced in EVERY season (the old baseline made this impossible)", () => {
    const ideal = expectedWeight(170, 1.0);
    for (const season of SEASONS) {
      const r = run(ideal, 1.0, season);
      expect(r.status, `season=${season} dev=${r.deviation}`).toBe("balanced");
    }
  });

  it("all three statuses are reachable", () => {
    const seen = new Set<BEDIStatus>();
    for (const weightKg of [45, 55, 64, 75, 90]) {
      for (const kt of [0.7, 1.0, 1.5]) {
        for (const season of SEASONS) {
          seen.add(run(weightKg, kt, season).status);
        }
      }
    }
    expect([...seen].sort()).toEqual(
      ["balanced", "khii_excess", "shar_badgan_excess"].sort()
    );
  });

  it("underweight in summer reads Хий арвидсан; overweight in winter reads Шар/Бадган арвидсан", () => {
    expect(run(50, 1.0, "SUMMER").status).toBe("khii_excess");
    expect(run(85, 1.0, "WINTER").status).toBe("shar_badgan_excess");
  });

  it("winter tilts deviation up and summer down for the same weight", () => {
    const winter = run(64, 1.0, "WINTER").deviation;
    const summer = run(64, 1.0, "SUMMER").deviation;
    expect(winter).toBeGreaterThan(summer);
  });

  it("keeps the patented BEDI index formula untouched", () => {
    // 70kg female, 170cm, 30y, summer(1.0), kt 1.0 → 70/(1.7·30·1) = 1.37
    const r = run(70, 1.0, "SUMMER");
    expect(r.bedi).toBeCloseTo(70 / (1.7 * 30 * 1.0), 2);
  });

  it("guards degenerate inputs (age 0, tiny height) without NaN/Infinity", () => {
    const r = calculateBEDI({
      weightKg: 10,
      heightCm: 0,
      age: 0,
      sex: "MALE",
      season: "WINTER",
      kt: 0.7,
    });
    expect(Number.isFinite(r.bedi)).toBe(true);
    expect(Number.isFinite(r.deviation)).toBe(true);
  });

  it("rounds bedi and deviation to 2 decimals", () => {
    const r = run(67.123, 1.1, "AUTUMN");
    expect(r.bedi).toBe(Math.round(r.bedi * 100) / 100);
    expect(r.deviation).toBe(Math.round(r.deviation * 100) / 100);
  });

  it("prints the owner-review outcome matrix", () => {
    // ЭЗЭМШИГЧИЙН ХЯНАЛТ: доорх матрицыг Тб оточ баталгаажуулна.
    const rows: Array<Record<string, string | number>> = [];
    for (const weightKg of [50, 64, 75, 90]) {
      for (const kt of [0.7, 1.0, 1.5]) {
        const row: Record<string, string | number> = {
          "жин(кг)": weightKg,
          Kt: kt,
        };
        for (const season of SEASONS) {
          const r = run(weightKg, kt, season);
          row[season] = `${r.deviation >= 0 ? "+" : ""}${r.deviation} ${r.statusLabel.mn}`;
        }
        rows.push(row);
      }
    }
    console.table(rows);
    expect(rows.length).toBe(12);
  });
});

describe("thresholds", () => {
  it("derive from the validation study (mean 0.0133, SD 0.2006, ±1.5·SD)", () => {
    expect(BEDI_THRESHOLDS.khiiBelow).toBeCloseTo(0.0133 - 1.5 * 0.2006, 4);
    expect(BEDI_THRESHOLDS.sharBadganAbove).toBeCloseTo(0.0133 + 1.5 * 0.2006, 4);
  });
});

describe("calcAge", () => {
  it("counts completed years only", () => {
    const now = new Date();
    const twentyYearsAgo = new Date(now.getFullYear() - 20, now.getMonth(), now.getDate());
    expect(calcAge(twentyYearsAgo)).toBe(20);
  });

  it("subtracts a year before the birthday has passed", () => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear() - 20, now.getMonth(), now.getDate() + 1);
    // handles month rollover implicitly via Date normalization
    const age = calcAge(tomorrow);
    expect(age === 19 || age === 20).toBe(true);
    if (tomorrow.getMonth() === now.getMonth()) expect(age).toBe(19);
  });
});
