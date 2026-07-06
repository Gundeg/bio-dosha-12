import { describe, expect, it } from "vitest";
import {
  ANTIDOTE_POTENCIES,
  THERAPY_MAP,
  getTherapy,
  validateRemedy,
} from "../potencyEngine";

describe("antidote potencies", () => {
  it("lists four DISTINCT potencies per dosha (Шар regression: SOFT was duplicated, missing Мохоо/DULL)", () => {
    for (const [dosha, potencies] of Object.entries(ANTIDOTE_POTENCIES)) {
      expect(new Set(potencies).size, dosha).toBe(4);
    }
    expect(ANTIDOTE_POTENCIES.Shar).toContain("DULL");
    expect(THERAPY_MAP.Shar.potencies).toContain("DULL");
  });
});

describe("getTherapy", () => {
  it("routes combined types to their dominant dosha", () => {
    expect(getTherapy("Badgan_Khii").dominantDosha).toBe("Badgan");
    expect(getTherapy("Khii_Shar").dominantDosha).toBe("Khii");
    expect(getTherapy("Shar_Badgan").dominantDosha).toBe("Shar");
  });

  it("routes Тэнцвэртэй to the middle dosha (Шар)", () => {
    expect(getTherapy("Tentsveertei").dominantDosha).toBe("Shar");
  });
});

describe("validateRemedy — safety gate", () => {
  it("warns on WARM therapy for hot Шар constitution at high deviation (dose −30%)", () => {
    const v = validateRemedy(0.9, "WARM", "Shar");
    expect(v.status).toBe("WARNING");
    expect(v.adjustedDosePercent).toBe(70);
  });

  it("warns on COLD therapy for Хий constitution at strong negative deviation (dose −50%)", () => {
    const v = validateRemedy(-0.6, "COLD", "Khii");
    expect(v.status).toBe("WARNING");
    expect(v.adjustedDosePercent).toBe(50);
  });

  it("contraindicates OILY therapy for Бадган constitution at positive deviation (dose 0)", () => {
    const v = validateRemedy(0.6, "OILY", "Badgan");
    expect(v.status).toBe("CONTRAINDICATED");
    expect(v.adjustedDosePercent).toBe(0);
  });

  it("passes benign combinations through untouched", () => {
    expect(validateRemedy(0.1, "WARM", "Shar").status).toBe("OK");
    expect(validateRemedy(0.9, "WARM", "Badgan").status).toBe("OK");
    expect(validateRemedy(-0.2, "COLD", "Khii").status).toBe("OK");
  });
});
