import { describe, expect, it } from "vitest";
import { getRemedies } from "../remedyEngine";

describe("getRemedies — age rules", () => {
  it("hard-blocks honey for children under 13, even for Бадган excess", () => {
    const r = getRemedies("shar_badgan_excess", 8, "Badgan", 0.4);
    expect(r.remedies.some((x) => x.includes("Зөгийн бал"))).toBe(false);
    expect(r.avoidFoods.some((x) => x.includes("ЗӨГИЙН БАЛ ОГТООС ХОРИГЛОНО"))).toBe(true);
    expect(r.ageNote).toContain("13");
  });

  it("allows honey for adults with Бадган excess", () => {
    const r = getRemedies("shar_badgan_excess", 30, "Badgan", 0.4);
    expect(r.remedies.some((x) => x.includes("Зөгийн бал"))).toBe(true);
  });

  it("gives elders the Хий-nourishing note", () => {
    const r = getRemedies("khii_excess", 70);
    expect(r.ageNote).toContain("61+");
    expect(r.avoidFoods.some((x) => x.includes("Хатуу"))).toBe(true);
  });
});

describe("getRemedies — composition", () => {
  it("adds dosha-specific lifestyle only when a doshaKey is provided", () => {
    expect(getRemedies("balanced", 30).lifestyle).toEqual([]);
    expect(getRemedies("balanced", 30, "Khii").lifestyle.length).toBeGreaterThan(0);
  });

  it("runs the safety validation only for Шар/Бадган excess with full context", () => {
    expect(getRemedies("balanced", 30, "Shar", 0.1).validation).toBeNull();
    expect(getRemedies("shar_badgan_excess", 30, "Shar").validation).toBeNull();

    const warned = getRemedies("shar_badgan_excess", 30, "Shar", 0.9).validation;
    expect(warned?.status).toBe("WARNING");
    expect(warned?.adjustedDosePercent).toBe(70);

    const ok = getRemedies("shar_badgan_excess", 30, "Badgan", 0.4).validation;
    expect(ok?.status).toBe("OK");
  });

  it("always returns non-empty remedies, avoid list and risk factors", () => {
    for (const status of ["khii_excess", "balanced", "shar_badgan_excess"] as const) {
      const r = getRemedies(status, 30);
      expect(r.remedies.length).toBeGreaterThan(0);
      expect(r.avoidFoods.length).toBeGreaterThan(0);
      expect(r.riskFactors.length).toBeGreaterThan(0);
    }
  });
});
