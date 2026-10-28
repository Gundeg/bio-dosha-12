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

  it("never lists the same food twice", () => {
    for (const status of ["khii_excess", "balanced", "shar_badgan_excess"] as const) {
      for (const dosha of ["Khii", "Shar", "Badgan", "Tentsveertei"] as const) {
        const r = getRemedies(status, 30, dosha, 0.4);
        const keys = r.remedies.map((x) => x.split("(")[0].trim().toLowerCase());
        expect(new Set(keys).size, `${status}/${dosha}: ${r.remedies.join(" | ")}`).toBe(keys.length);
      }
    }
  });

  it("drops constitution foods that the current status says to avoid", () => {
    // Хий constitution in Шар/Бадган excess: oily ghee conflicts with "Тослог" on the avoid list
    const khii = getRemedies("shar_badgan_excess", 30, "Khii", 0.4);
    expect(khii.avoidFoods.some((x) => x.includes("Тослог"))).toBe(true);
    expect(khii.remedies.some((x) => x.toLowerCase().includes("тослог"))).toBe(false);

    // Бадган constitution in Хий excess: dry food conflicts with "хуурай хоол" on the avoid list
    const badgan = getRemedies("khii_excess", 30, "Badgan", -0.4);
    expect(badgan.remedies.some((x) => x.toLowerCase().includes("хуурай хоол"))).toBe(false);
    expect(badgan.lifestyle.some((x) => x.toLowerCase().includes("мацаг"))).toBe(false);

    // Шар constitution in Хий excess: cold vegetables conflict with "Хүйтэн" on the avoid list
    const shar = getRemedies("khii_excess", 30, "Shar", -0.4);
    expect(shar.remedies.some((x) => x.toLowerCase().includes("хүйтэн"))).toBe(false);
  });

  it("keeps the status remedies and the plan's age rules", () => {
    const r = getRemedies("khii_excess", 30, "Shar", -0.4);
    expect(r.remedies).toContain("Шар тос (Тослог цөцгийн тос)");
    expect(r.remedies.some((x) => x.startsWith("Мөсөн чихэр"))).toBe(true);
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
