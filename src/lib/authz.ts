import { auth } from "./auth";
import { prisma } from "./prisma";
import { HttpError, forbidden, unauthorized } from "./http";
import type { MemberStatus, OrgMemberRole, OrgStatus, Role } from "../generated/prisma/client";

/**
 * Authorization for API routes and server components. Every request loads a
 * fresh security context from the database (role, disabled flag, session
 * version, memberships), so revocations take effect immediately for data
 * access even while the session cookie still carries older claims.
 *
 * Permission model (see docs/platform-architecture.md):
 *   SUPERADMIN / ADMIN  → control center only, never health records
 *   OWNER               → organization management + clinical records
 *   ADMIN (org)         → organization management, no clinical records
 *   PRACTITIONER        → clinical records of the organization
 *   Clinical access also needs: organization ACTIVE, membership ACTIVE, 2-step login on.
 */

export interface Membership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationStatus: OrgStatus;
  role: OrgMemberRole;
  status: MemberStatus;
}

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  role: Role;
  isSuperadmin: boolean;
  isPlatformStaff: boolean;
  mfaEnabled: boolean;
  /** Staff and organization members must use 2-step login. */
  mfaRequired: boolean;
  memberships: Membership[];
  /** The organization the user is working in (active membership), if any. */
  activeMembership: Membership | null;
  activeOrganizationId: string | null;
}

export const CLINICAL_ROLES: readonly OrgMemberRole[] = ["OWNER", "PRACTITIONER"];
export const MANAGER_ROLES: readonly OrgMemberRole[] = ["OWNER", "ADMIN"];

export function isStaffRole(role: Role | string | undefined | null): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      disabledAt: true,
      totpEnabledAt: true,
      sessionVersion: true,
      activeOrganizationId: true,
      memberships: {
        select: {
          id: true,
          organizationId: true,
          role: true,
          status: true,
          organization: { select: { name: true, status: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!user || user.disabledAt) return null;
  if (typeof sessionUser.sv === "number" && sessionUser.sv !== user.sessionVersion) return null;

  const memberships: Membership[] = user.memberships.map((m) => ({
    id: m.id,
    organizationId: m.organizationId,
    organizationName: m.organization.name,
    organizationStatus: m.organization.status,
    role: m.role,
    status: m.status,
  }));
  const activeList = memberships.filter((m) => m.status === "ACTIVE");
  const activeMembership =
    activeList.find((m) => m.organizationId === user.activeOrganizationId) ?? activeList[0] ?? null;

  const isPlatformStaff = isStaffRole(user.role);
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isSuperadmin: user.role === "SUPERADMIN",
    isPlatformStaff,
    mfaEnabled: !!user.totpEnabledAt,
    mfaRequired: isPlatformStaff || activeList.length > 0,
    memberships,
    activeMembership,
    activeOrganizationId: activeMembership?.organizationId ?? null,
  };
}

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw unauthorized();
  return ctx;
}

export function assertMfa(ctx: AuthContext): void {
  if (ctx.mfaRequired && !ctx.mfaEnabled) {
    throw new HttpError(403, "mfa_setup_required", "Эхлээд 2 шаттай нэвтрэлтийг идэвхжүүлнэ үү.");
  }
}

/** Platform control center access. */
export async function requireStaff(level: "ADMIN" | "SUPERADMIN" = "ADMIN"): Promise<AuthContext> {
  const ctx = await requireAuth();
  const ok = level === "SUPERADMIN" ? ctx.isSuperadmin : ctx.isPlatformStaff;
  if (!ok) throw forbidden();
  assertMfa(ctx);
  return ctx;
}

export function isClinical(m: Membership | null | undefined): m is Membership {
  return !!m && m.status === "ACTIVE" && m.organizationStatus === "ACTIVE" && CLINICAL_ROLES.includes(m.role);
}

export function clinicalOrganizationIds(ctx: AuthContext): string[] {
  return ctx.memberships.filter(isClinical).map((m) => m.organizationId);
}

/**
 * Clinical access to one organization (or the active one). Throws a precise
 * error so the UI can explain what is missing.
 */
export function requireClinical(ctx: AuthContext, organizationId?: string | null): Membership {
  const membership = organizationId
    ? ctx.memberships.find((m) => m.organizationId === organizationId)
    : ctx.activeMembership;
  if (!membership || membership.status !== "ACTIVE") {
    throw new HttpError(403, "no_organization", "Та эмнэлгийн гишүүн биш байна.");
  }
  if (membership.organizationStatus === "PENDING") {
    throw new HttpError(403, "org_pending", "Байгууллагын баталгаажуулалт хүлээгдэж байна.");
  }
  if (membership.organizationStatus === "SUSPENDED") {
    throw new HttpError(403, "org_suspended", "Байгууллагын эрх түр хаагдсан байна.");
  }
  if (!CLINICAL_ROLES.includes(membership.role)) {
    throw new HttpError(403, "not_clinical", "Таны эрх өвчтөний мэдээлэлд хандах боломжгүй.");
  }
  assertMfa(ctx);
  return membership;
}

/** Organization management (members, settings). Allowed while PENDING; blocked when SUSPENDED. */
export function requireOrgManager(ctx: AuthContext, organizationId: string, opts: { allowSuspended?: boolean } = {}): Membership {
  const membership = ctx.memberships.find((m) => m.organizationId === organizationId);
  if (!membership || membership.status !== "ACTIVE" || !MANAGER_ROLES.includes(membership.role)) {
    throw forbidden("Байгууллагыг удирдах эрх танд алга.");
  }
  if (membership.organizationStatus === "SUSPENDED" && !opts.allowSuspended) {
    throw new HttpError(403, "org_suspended", "Байгууллагын эрх түр хаагдсан байна.");
  }
  assertMfa(ctx);
  return membership;
}

export function requireOrgMember(ctx: AuthContext, organizationId: string): Membership {
  const membership = ctx.memberships.find((m) => m.organizationId === organizationId && m.status === "ACTIVE");
  if (!membership) throw forbidden("Та энэ байгууллагын гишүүн биш байна.");
  return membership;
}

export function actorOf(ctx: AuthContext) {
  return { id: ctx.userId, email: ctx.email, role: ctx.role };
}

/**
 * Loads a profile the caller may work with: their own (self/family) or a
 * patient profile of an organization where they have clinical access.
 */
export async function loadAccessibleProfile(ctx: AuthContext, profileId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) return null;
  if (profile.userId && profile.userId === ctx.userId) return { profile, organizationId: null as string | null };
  if (profile.organizationId && clinicalOrganizationIds(ctx).includes(profile.organizationId)) {
    assertMfa(ctx);
    return { profile, organizationId: profile.organizationId };
  }
  return null;
}
