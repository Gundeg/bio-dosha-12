import type { OrganizationType } from "@/lib/schemas/organization";
import { CLINICAL_ROLES, type MemberStatus, type OrgRole, type OrgStatus, type PlanLimits } from "@/components/settings/types";

/**
 * Shapes returned by the organization API (src/app/api/org/**).
 * Keep in sync with the route files.
 */

/** GET /api/org/[orgId] */
export interface OrgDetail {
  organization: {
    id: string;
    name: string;
    type: OrganizationType | string;
    registrationNumber: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    status: OrgStatus;
    verifiedAt: string | null;
    suspendedAt: string | null;
    suspendedReason: string | null;
    createdAt: string;
  };
  myRole: OrgRole;
  canManage: boolean;
  plan: {
    code: string;
    nameMn: string;
    nameEn: string;
    limits: PlanLimits;
    priceMonthlyMnt: number | null;
    source: string;
    currentPeriodEnd: string | null;
  };
  usage: { practitioners: number; patients: number };
}

/** GET /api/org/[orgId]/members */
export interface OrgMember {
  id: string;
  userId: string;
  name: string;
  /** Managers see every email; others only their own. */
  email: string | null;
  role: OrgRole;
  status: MemberStatus;
  title: string | null;
  mfaEnabled: boolean;
  /** Managers only. */
  lastLoginAt: string | null;
  joinedAt: string;
  isMe: boolean;
}

export type InviteState = "pending" | "used" | "revoked" | "expired";

/** GET /api/org/[orgId]/invites (managers only) */
export interface OrgInvite {
  id: string;
  email: string;
  role: OrgRole | null;
  state: InviteState;
  expiresAt: string;
  createdAt: string;
}

/** POST /api/org/[orgId]/invites */
export interface CreatedInvite {
  id: string;
  inviteUrl: string;
  emailSent: boolean;
  expiresAt: string;
}

/** Order in pickers: the most common choice first. */
export const ROLE_CHOICES: readonly OrgRole[] = ["PRACTITIONER", "ADMIN", "OWNER"];

/**
 * Only an owner can give access to patient records (API code
 * `clinical_grant_owner_only`): for anyone else the owner and practitioner
 * choices are disabled with `reason`. `keep` (the member's current role)
 * stays selectable so a change can be undone.
 */
export function rolesNeedingOwner(myRole: OrgRole, reason: string, keep?: OrgRole): Partial<Record<OrgRole, string>> {
  if (myRole === "OWNER") return {};
  return Object.fromEntries(CLINICAL_ROLES.filter((role) => role !== keep).map((role) => [role, reason]));
}

/** Turning access back on for an owner or practitioner grants patient access again: owners only. */
export function canReenable(myRole: OrgRole, member: { role: OrgRole }): boolean {
  return myRole === "OWNER" || !CLINICAL_ROLES.includes(member.role);
}

/** Practitioner seats left on the plan; null when unlimited. */
export function seatsLeft(detail: OrgDetail): number | null {
  const limit = detail.plan.limits.maxPractitioners;
  if (limit === null || limit === undefined) return null;
  return Math.max(0, limit - detail.usage.practitioners);
}
