import { describe, expect, it, vi } from "vitest";

// The permission helpers below are pure; keep NextAuth out of the test.
vi.mock("../auth", () => ({ auth: vi.fn(async () => null) }));

import {
  clinicalOrganizationIds,
  isClinical,
  isStaffRole,
  requireClinical,
  requireOrgManager,
  type AuthContext,
  type Membership,
} from "../authz";
import { HttpError } from "../http";

function membership(over: Partial<Membership> = {}): Membership {
  return {
    id: "m1",
    organizationId: "org1",
    organizationName: "Clinic",
    organizationStatus: "ACTIVE",
    role: "PRACTITIONER",
    status: "ACTIVE",
    ...over,
  };
}

function ctx(memberships: Membership[], over: Partial<AuthContext> = {}): AuthContext {
  const active = memberships.find((m) => m.status === "ACTIVE") ?? null;
  return {
    userId: "u1",
    email: "doctor@clinic.mn",
    name: "Doctor",
    role: "INDIVIDUAL",
    isSuperadmin: false,
    isPlatformStaff: false,
    mfaEnabled: true,
    mfaRequired: memberships.length > 0,
    memberships,
    activeMembership: active,
    activeOrganizationId: active?.organizationId ?? null,
    ...over,
  };
}

function codeOf(fn: () => unknown): string | null {
  try {
    fn();
    return null;
  } catch (err) {
    return err instanceof HttpError ? err.code : "unexpected";
  }
}

describe("platform roles", () => {
  it("only ADMIN and SUPERADMIN are staff; the legacy PRACTITIONER role grants nothing", () => {
    expect(isStaffRole("ADMIN")).toBe(true);
    expect(isStaffRole("SUPERADMIN")).toBe(true);
    expect(isStaffRole("PRACTITIONER")).toBe(false);
    expect(isStaffRole("INDIVIDUAL")).toBe(false);
  });
});

describe("clinical access", () => {
  it("needs an active membership in an active organization with a clinical role", () => {
    expect(isClinical(membership())).toBe(true);
    expect(isClinical(membership({ role: "OWNER" }))).toBe(true);
    expect(isClinical(membership({ role: "ADMIN" }))).toBe(false);
    expect(isClinical(membership({ status: "DISABLED" }))).toBe(false);
    expect(isClinical(membership({ organizationStatus: "PENDING" }))).toBe(false);
    expect(isClinical(membership({ organizationStatus: "SUSPENDED" }))).toBe(false);
  });

  it("lists only organizations with clinical access", () => {
    const c = ctx([
      membership({ organizationId: "a" }),
      membership({ organizationId: "b", role: "ADMIN" }),
      membership({ organizationId: "c", organizationStatus: "PENDING" }),
    ]);
    expect(clinicalOrganizationIds(c)).toEqual(["a"]);
  });

  it("explains exactly what is missing", () => {
    expect(codeOf(() => requireClinical(ctx([])))).toBe("no_organization");
    expect(codeOf(() => requireClinical(ctx([membership({ organizationStatus: "PENDING" })])))).toBe("org_pending");
    expect(codeOf(() => requireClinical(ctx([membership({ organizationStatus: "SUSPENDED" })])))).toBe("org_suspended");
    expect(codeOf(() => requireClinical(ctx([membership({ role: "ADMIN" })])))).toBe("not_clinical");
    expect(codeOf(() => requireClinical(ctx([membership()], { mfaEnabled: false })))).toBe("mfa_setup_required");
    expect(codeOf(() => requireClinical(ctx([membership()])))).toBeNull();
  });

  it("checks the organization that was asked for, not just the active one", () => {
    const c = ctx([membership({ organizationId: "a" })]);
    expect(codeOf(() => requireClinical(c, "b"))).toBe("no_organization");
  });

  it("gives platform staff no clinical access", () => {
    const staff = ctx([], { role: "SUPERADMIN", isSuperadmin: true, isPlatformStaff: true, mfaRequired: true });
    expect(codeOf(() => requireClinical(staff))).toBe("no_organization");
    expect(clinicalOrganizationIds(staff)).toEqual([]);
  });
});

describe("organization management", () => {
  it("is for owners and managers, not practitioners", () => {
    expect(codeOf(() => requireOrgManager(ctx([membership({ role: "OWNER" })]), "org1"))).toBeNull();
    expect(codeOf(() => requireOrgManager(ctx([membership({ role: "ADMIN" })]), "org1"))).toBeNull();
    expect(codeOf(() => requireOrgManager(ctx([membership({ role: "PRACTITIONER" })]), "org1"))).toBe("forbidden");
    expect(codeOf(() => requireOrgManager(ctx([membership({ role: "OWNER" })]), "other"))).toBe("forbidden");
  });

  it("works while pending, stops while suspended unless explicitly allowed", () => {
    const pending = ctx([membership({ role: "OWNER", organizationStatus: "PENDING" })]);
    expect(codeOf(() => requireOrgManager(pending, "org1"))).toBeNull();
    const suspended = ctx([membership({ role: "OWNER", organizationStatus: "SUSPENDED" })]);
    expect(codeOf(() => requireOrgManager(suspended, "org1"))).toBe("org_suspended");
    expect(codeOf(() => requireOrgManager(suspended, "org1", { allowSuspended: true }))).toBeNull();
  });

  it("requires 2-step sign-in", () => {
    const c = ctx([membership({ role: "OWNER" })], { mfaEnabled: false });
    expect(codeOf(() => requireOrgManager(c, "org1"))).toBe("mfa_setup_required");
  });
});
