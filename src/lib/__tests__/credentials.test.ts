import { describe, expect, it } from "vitest";
import { normalizeEmail, passwordSchema, PASSWORD_MIN_LENGTH } from "../credentials";

describe("normalizeEmail", () => {
  it("lower-cases and trims so case variants are one account", () => {
    expect(normalizeEmail("  Boss@Clinic.MN ")).toBe("boss@clinic.mn");
    expect(normalizeEmail("Boss@clinic.mn")).toBe(normalizeEmail("boss@clinic.mn"));
  });
});

describe("passwordSchema", () => {
  it(`requires at least ${PASSWORD_MIN_LENGTH} characters`, () => {
    expect(passwordSchema.safeParse("1234567").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
  });

  it("rejects passwords longer than bcrypt's 72-byte limit", () => {
    expect(passwordSchema.safeParse("a".repeat(72)).success).toBe(true);
    expect(passwordSchema.safeParse("a".repeat(73)).success).toBe(false);
    // Cyrillic letters take 2 bytes each in UTF-8
    expect(passwordSchema.safeParse("б".repeat(37)).success).toBe(false);
  });
});
