import { afterEach, describe, expect, it } from "vitest";
import { sanitizeMeta } from "../audit";
import { assertWithinLimit, hasFeature, parseLimits, type EffectivePlan } from "../entitlements";
import { HttpError } from "../http";
import { buildAppUrl, hashToken, inviteUrl, resetUrl, tokenState } from "../tokens";
import { organizationFieldsSchema, organizationUpdateSchema } from "../schemas/organization";
import { adminOrgCreateSchema, planUpdateSchema, staffInviteSchema, userActionSchema } from "../schemas/admin";

describe("audit log never stores credentials or health data", () => {
  it("drops sensitive keys and keeps short administrative facts", () => {
    const out = sanitizeMeta({
      password: "x",
      newPassword: "x",
      token: "x",
      totpCode: "x",
      recoveryCodes: "x",
      diagnosis: "x",
      complaintAtArrival: "x",
      clinicalNotes: "x",
      phone: "x",
      address: "x",
      registerNumber: "x",
      birthDate: "x",
      weightKg: 70,
      pulseTable: "x",
      planCode: "ORG_PRO",
      note: "contract signed",
      reason: "duplicate account",
      role: "OWNER",
      emailSent: false,
      count: 3,
      skipped: undefined,
    });
    expect(out).toEqual({
      planCode: "ORG_PRO",
      note: "contract signed",
      reason: "duplicate account",
      role: "OWNER",
      emailSent: false,
      count: 3,
    });
  });

  it("truncates long text and returns undefined when nothing is left", () => {
    expect(sanitizeMeta({ reason: "a".repeat(500) })?.reason).toHaveLength(300);
    expect(sanitizeMeta({ password: "x" })).toBeUndefined();
    expect(sanitizeMeta(undefined)).toBeUndefined();
  });
});

function planWith(limits: EffectivePlan["limits"]): EffectivePlan {
  return {
    id: "p",
    code: "ORG_STARTER",
    nameMn: "Эхлэл",
    nameEn: "Starter",
    audience: "ORGANIZATION",
    limits,
    priceMonthlyMnt: null,
    source: "default",
    subscription: null,
  };
}

describe("plan limits", () => {
  it("parses only valid limits; null means unlimited", () => {
    expect(parseLimits({ maxPatients: 300, maxPractitioners: null, pdfReports: true })).toEqual({
      maxPatients: 300,
      maxPractitioners: null,
      pdfReports: true,
    });
    expect(parseLimits({ maxPatients: -1, maxProfiles: "5", pdfReports: "yes" })).toEqual({});
    expect(parseLimits({ maxProfiles: 4.7 })).toEqual({ maxProfiles: 4 });
    expect(parseLimits(null)).toEqual({});
    expect(parseLimits([1, 2])).toEqual({});
  });

  it("blocks the next item only once the limit is reached", () => {
    const plan = planWith({ maxPatients: 2 });
    expect(() => assertWithinLimit(plan, "maxPatients", 1, "өвчтөн")).not.toThrow();
    try {
      assertWithinLimit(plan, "maxPatients", 2, "өвчтөн");
      throw new Error("expected a plan_limit error");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(403);
      expect((err as HttpError).code).toBe("plan_limit");
    }
  });

  it("treats a missing or null limit as unlimited, and features as on unless switched off", () => {
    expect(() => assertWithinLimit(planWith({}), "maxPatients", 10_000, "x")).not.toThrow();
    expect(() => assertWithinLimit(planWith({ maxPatients: null }), "maxPatients", 10_000, "x")).not.toThrow();
    expect(hasFeature(planWith({}), "pdfReports")).toBe(true);
    expect(hasFeature(planWith({ pdfReports: false }), "pdfReports")).toBe(false);
  });
});

describe("one-time links", () => {
  const saved = { APP_URL: process.env.APP_URL, AUTH_URL: process.env.AUTH_URL, NEXTAUTH_URL: process.env.NEXTAUTH_URL };
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("stores only a SHA-256 hash of the token", () => {
    expect(hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("reports the state of a link", () => {
    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);
    expect(tokenState({ usedAt: null, revokedAt: null, expiresAt: future })).toBe("pending");
    expect(tokenState({ usedAt: new Date(), revokedAt: null, expiresAt: future })).toBe("used");
    expect(tokenState({ usedAt: null, revokedAt: new Date(), expiresAt: future })).toBe("revoked");
    expect(tokenState({ usedAt: null, revokedAt: null, expiresAt: past })).toBe("expired");
  });

  it("builds links from the configured site address", () => {
    delete process.env.APP_URL;
    delete process.env.NEXTAUTH_URL;
    process.env.AUTH_URL = "https://bio-dosha.example/api/auth";
    expect(inviteUrl("t0k3n")).toBe("https://bio-dosha.example/invite/t0k3n");
    process.env.APP_URL = "https://app.example";
    expect(resetUrl("t0k3n")).toBe("https://app.example/reset/t0k3n");
    expect(buildAppUrl("/login")).toBe("https://app.example/login");
  });
});

describe("request schemas", () => {
  it("updates only the organization fields that were sent", () => {
    expect(organizationUpdateSchema.parse({ name: "Clinic X" })).toEqual({ name: "Clinic X" });
    expect(organizationUpdateSchema.parse({ phone: "" })).toEqual({ phone: null });
    expect(organizationUpdateSchema.parse({ email: "Info@Clinic.MN" })).toEqual({ email: "info@clinic.mn" });
  });

  it("fills defaults when an organization is created", () => {
    expect(organizationFieldsSchema.parse({ name: "Clinic X" })).toMatchObject({ name: "Clinic X", type: "CLINIC", phone: null });
  });

  it("updates only the plan fields that were sent (never resets limits)", () => {
    expect(planUpdateSchema.parse({ nameMn: "Шинэ" })).toEqual({ nameMn: "Шинэ" });
    expect(planUpdateSchema.parse({ limits: { maxPatients: null } })).toEqual({ limits: { maxPatients: null } });
    expect(planUpdateSchema.safeParse({ limits: { unknownLimit: 1 } }).success).toBe(false);
  });

  it("validates control-center actions", () => {
    expect(userActionSchema.safeParse({ action: "disable" }).success).toBe(false);
    expect(userActionSchema.safeParse({ action: "disable", reason: "spam" }).success).toBe(true);
    expect(userActionSchema.safeParse({ action: "set_role", role: "SUPERADMIN" }).success).toBe(false);
    expect(staffInviteSchema.parse({ email: "New.Admin@Example.MN" })).toEqual({ email: "new.admin@example.mn", role: "ADMIN" });
    expect(adminOrgCreateSchema.parse({ name: "Clinic X", ownerEmail: "Owner@X.mn" })).toMatchObject({
      ownerEmail: "owner@x.mn",
      status: "ACTIVE",
    });
  });
});
