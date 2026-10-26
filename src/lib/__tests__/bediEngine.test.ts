import { describe, expect, it } from "vitest";
import { calcAge, calculateBEDI, type BEDIInput } from "../bediEngine";
import { BEDI_THRESHOLDS } from "../bediConfig";
import { SEASON_COEFFICIENTS } from "../seasonFactors";

/**
 * These cases lock the BEDI formula to the first web build (commit 25e015a),
 * which the owner confirmed as correct on 2026-10-26:
 *
 *   BEDI = (W · Kg · Ks · Kc) / (H · Age · Kt)
 *   Kg: male 1.1, female 1.0 · Ks: winter 2.0, spring 1.5, summer 1.0, autumn 1.3
 *   Δ = BEDI − 1 · Δ < −0.3 → Хий арвидсан · Δ > +0.3 → Шар/Бадган арвидсан · else Тэнцвэртэй
 *
 * Do not edit the expected values without the owner's approval (see lessons.md).
 */
function run(overrides: Partial<BEDIInput>) {
  return calculateBEDI({
    weightKg: 70,
    heightCm: 170,
    age: 35,
    sex: "MALE",
    season: "SUMMER",
    kt: 1.0,
    ...overrides,
  });
}

describe("first-build coefficients", () => {
  it("uses winter 2.0, spring 1.5, summer 1.0, autumn 1.3", () => {
    expect(SEASON_COEFFICIENTS).toEqual({ WINTER: 2.0, SPRING: 1.5, SUMMER: 1.0, AUTUMN: 1.3 });
  });

  it("uses a ±0.3 balanced band on Δ", () => {
    expect(BEDI_THRESHOLDS).toEqual({ khiiBelow: -0.3, sharBadganAbove: 0.3 });
  });

  it("weights men by 1.1 and women by 1.0", () => {
    const male = run({ sex: "MALE" });
    const female = run({ sex: "FEMALE" });
    expect(male.bedi / female.bedi).toBeCloseTo(1.1, 1);
  });
});

describe("calculateBEDI — first-build formula", () => {
  it("computes BEDI = (W·Kg·Ks·Kc) / (H·Age·Kt)", () => {
    // 70 · 1.1 · 1.0 · 1.0 / (1.70 · 35 · 1.0) = 77 / 59.5
    const r = run({});
    expect(r.bedi).toBe(1.29);
    expect(r.deviation).toBe(0.29);
  });

  it("measures deviation from the zero point: Δ = BEDI − 1", () => {
    for (const season of ["WINTER", "SPRING", "SUMMER", "AUTUMN"] as const) {
      const r = run({ season });
      expect(Math.abs(r.deviation - (r.bedi - 1))).toBeLessThanOrEqual(0.011);
    }
  });

  it("applies the cultural factor in the numerator", () => {
    expect(run({ culturalFactor: 2 }).bedi).toBeCloseTo(run({}).bedi * 2, 1);
  });

  it.each([
    // Worked examples, checked by hand against the formula
    { name: "man 35y 170cm 70kg Kt1.00 summer", input: {}, bedi: 1.29, deviation: 0.29, status: "balanced" },
    { name: "man 35y 170cm 70kg Kt1.00 winter", input: { season: "WINTER" }, bedi: 2.59, deviation: 1.59, status: "shar_badgan_excess" },
    { name: "woman 35y 160cm 55kg Kt1.00 summer", input: { sex: "FEMALE", heightCm: 160, weightKg: 55 }, bedi: 0.98, deviation: -0.02, status: "balanced" },
    { name: "man 60y 172cm 80kg Kt1.35 summer", input: { age: 60, heightCm: 172, weightKg: 80, kt: 1.35 }, bedi: 0.63, deviation: -0.37, status: "khii_excess" },
    { name: "man 60y 172cm 80kg Kt1.35 autumn", input: { age: 60, heightCm: 172, weightKg: 80, kt: 1.35, season: "AUTUMN" }, bedi: 0.82, deviation: -0.18, status: "balanced" },
  ] as const)("$name → BEDI $bedi, Δ $deviation, $status", ({ input, bedi, deviation, status }) => {
    const r = run(input as Partial<BEDIInput>);
    expect(r.bedi).toBe(bedi);
    expect(r.deviation).toBe(deviation);
    expect(r.status).toBe(status);
  });

  it("depends on age: the same body reads differently at 20, 40 and 80", () => {
    expect(run({ age: 20 }).status).toBe("shar_badgan_excess"); // Δ +1.26
    expect(run({ age: 40 }).status).toBe("balanced"); //          Δ +0.13
    expect(run({ age: 80 }).status).toBe("khii_excess"); //       Δ −0.43
  });

  it("classifies just inside and just outside the ±0.3 band", () => {
    // woman, 100 cm, 10 y, Kt 1.0, summer → BEDI = weight / 10
    const at = (weightKg: number) =>
      run({ sex: "FEMALE", heightCm: 100, age: 10, kt: 1.0, weightKg }).status;
    expect(at(6.9)).toBe("khii_excess");
    expect(at(7.1)).toBe("balanced");
    expect(at(12.9)).toBe("balanced");
    expect(at(13.1)).toBe("shar_badgan_excess");
  });

  it("returns the localized status label", () => {
    expect(run({ season: "WINTER" }).statusLabel.mn).toBe("Шар/Бадган арвидсан");
    expect(run({}).statusLabel.mn).toBe("Тэнцвэртэй");
  });

  it("rounds bedi and deviation to 2 decimals", () => {
    const r = run({ weightKg: 67.123, kt: 1.1, season: "AUTUMN" });
    expect(r.bedi).toBe(Math.round(r.bedi * 100) / 100);
    expect(r.deviation).toBe(Math.round(r.deviation * 100) / 100);
  });

  it("guards age 0 without NaN/Infinity", () => {
    const r = run({ age: 0 });
    expect(Number.isFinite(r.bedi)).toBe(true);
    expect(Number.isFinite(r.deviation)).toBe(true);
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
    const age = calcAge(tomorrow);
    expect(age === 19 || age === 20).toBe(true);
    if (tomorrow.getMonth() === now.getMonth()) expect(age).toBe(19);
  });
});
