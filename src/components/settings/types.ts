/**
 * Shapes returned by GET /api/me (src/app/api/me/route.ts), shared by the
 * account settings and the organization workspace. Keep in sync with the route.
 */

export type OrgRole = "OWNER" | "ADMIN" | "PRACTITIONER";
export type OrgStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
export type MemberStatus = "ACTIVE" | "DISABLED";

/** `null` or a missing key means unlimited (see src/lib/entitlements.ts). */
export interface PlanLimits {
  maxProfiles?: number | null;
  maxPractitioners?: number | null;
  maxPatients?: number | null;
  pdfReports?: boolean;
}

export interface MeMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationStatus: OrgStatus;
  role: OrgRole;
  status: MemberStatus;
}

export interface Me {
  id: string;
  name: string;
  email: string;
  role: string;
  locale: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  mfa: {
    enabled: boolean;
    enabledAt: string | null;
    /** Staff and organization members must keep 2-step sign-in on. */
    required: boolean;
    recoveryCodesLeft: number;
  };
  isPlatformStaff: boolean;
  isSuperadmin: boolean;
  memberships: MeMembership[];
  activeOrganizationId: string | null;
  plan: { code: string; nameMn: string; nameEn: string; limits: PlanLimits; source: string };
  usage: { profiles: number };
  emailEnabled: boolean;
}

/** Roles that manage members and settings. */
export const MANAGER_ROLES: readonly OrgRole[] = ["OWNER", "ADMIN"];
/** Roles that work with patient records (and use a practitioner seat). */
export const CLINICAL_ROLES: readonly OrgRole[] = ["OWNER", "PRACTITIONER"];

/** Plan name in the interface language. */
export function planName(plan: { nameMn: string; nameEn: string }, locale: string): string {
  return locale === "en" ? plan.nameEn || plan.nameMn : plan.nameMn || plan.nameEn;
}

/** Where the 2-step setup page sends the person back to when done. */
export function mfaSetupHref(next: string): string {
  return `/mfa-setup?next=${encodeURIComponent(next)}`;
}
