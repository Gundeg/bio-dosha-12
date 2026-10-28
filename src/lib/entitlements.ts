import { prisma } from "./prisma";
import { HttpError } from "./http";
import type { PlanAudience } from "../generated/prisma/client";

/**
 * Plans and limits. Today the superadmin assigns plans by hand; a payment
 * provider will later create and update the same Subscription rows, so every
 * check in the app already goes through here.
 */

export interface PlanLimits {
  /** Own + family profiles for an individual. */
  maxProfiles?: number | null;
  /** Active OWNER/PRACTITIONER members of an organization. */
  maxPractitioners?: number | null;
  /** Patients registered by an organization. */
  maxPatients?: number | null;
  /** Clinical intake PDF export. */
  pdfReports?: boolean;
}

export type LimitKey = "maxProfiles" | "maxPractitioners" | "maxPatients";
export type FeatureKey = "pdfReports";

export interface EffectivePlan {
  id: string | null;
  code: string;
  nameMn: string;
  nameEn: string;
  audience: PlanAudience;
  limits: PlanLimits;
  priceMonthlyMnt: number | null;
  /** "subscription" when assigned, "default" when the audience default applies. */
  source: "subscription" | "default" | "fallback";
  subscription: {
    id: string;
    status: string;
    startedAt: Date;
    currentPeriodEnd: Date | null;
    note: string | null;
  } | null;
}

/** Used only if the plan table is empty, so the app never locks people out. */
const FALLBACK: Record<PlanAudience, Omit<EffectivePlan, "source" | "subscription">> = {
  INDIVIDUAL: { id: null, code: "IND_FREE", nameMn: "Үнэгүй", nameEn: "Free", audience: "INDIVIDUAL", limits: {}, priceMonthlyMnt: null },
  ORGANIZATION: { id: null, code: "ORG_STARTER", nameMn: "Эхлэл", nameEn: "Starter", audience: "ORGANIZATION", limits: { pdfReports: true }, priceMonthlyMnt: null },
};

export function parseLimits(value: unknown): PlanLimits {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const v = value as Record<string, unknown>;
  const num = (x: unknown) => (x === null ? null : typeof x === "number" && Number.isFinite(x) && x >= 0 ? Math.floor(x) : undefined);
  const out: PlanLimits = {};
  for (const key of ["maxProfiles", "maxPractitioners", "maxPatients"] as const) {
    const n = num(v[key]);
    if (n !== undefined) out[key] = n;
  }
  if (typeof v.pdfReports === "boolean") out.pdfReports = v.pdfReports;
  return out;
}

const ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING", "PAST_DUE"]);

export async function getEffectivePlan(subject: { userId: string } | { organizationId: string }): Promise<EffectivePlan> {
  const audience: PlanAudience = "userId" in subject ? "INDIVIDUAL" : "ORGANIZATION";
  const subscription = await prisma.subscription.findFirst({
    where: "userId" in subject ? { userId: subject.userId } : { organizationId: subject.organizationId },
    include: { plan: true },
  });

  if (subscription && ACTIVE_STATUSES.has(subscription.status) && subscription.plan.audience === audience) {
    const p = subscription.plan;
    return {
      id: p.id,
      code: p.code,
      nameMn: p.nameMn,
      nameEn: p.nameEn,
      audience,
      limits: parseLimits(p.limits),
      priceMonthlyMnt: p.priceMonthlyMnt,
      source: "subscription",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startedAt: subscription.startedAt,
        currentPeriodEnd: subscription.currentPeriodEnd,
        note: subscription.note,
      },
    };
  }

  const def = await prisma.plan.findFirst({
    where: { audience, isDefault: true, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (def) {
    return {
      id: def.id,
      code: def.code,
      nameMn: def.nameMn,
      nameEn: def.nameEn,
      audience,
      limits: parseLimits(def.limits),
      priceMonthlyMnt: def.priceMonthlyMnt,
      source: "default",
      subscription: null,
    };
  }
  return { ...FALLBACK[audience], source: "fallback", subscription: null };
}

/** Throws a 403 with code "plan_limit" when adding one more would pass the limit. */
export function assertWithinLimit(plan: EffectivePlan, key: LimitKey, currentCount: number, label: string): void {
  const limit = plan.limits[key];
  if (limit === null || limit === undefined) return;
  if (currentCount >= limit) {
    throw new HttpError(
      403,
      "plan_limit",
      `«${plan.nameMn}» багцад ${label} ${limit} хүртэл байна. Багцаа ахиулахын тулд бидэнтэй холбогдоно уу.`
    );
  }
}

export function hasFeature(plan: EffectivePlan, feature: FeatureKey): boolean {
  return plan.limits[feature] !== false;
}

export function assertFeature(plan: EffectivePlan, feature: FeatureKey, label: string): void {
  if (!hasFeature(plan, feature)) {
    throw new HttpError(403, "plan_feature", `«${plan.nameMn}» багцад ${label} ороогүй. Багцаа ахиулна уу.`);
  }
}

// ── Usage counters ──────────────────────────────────────────────────────────

export function countOwnProfiles(userId: string): Promise<number> {
  return prisma.profile.count({ where: { userId, organizationId: null } });
}

export function countClinicalMembers(organizationId: string): Promise<number> {
  return prisma.organizationMember.count({
    where: { organizationId, status: "ACTIVE", role: { in: ["OWNER", "PRACTITIONER"] } },
  });
}

export function countPatients(organizationId: string): Promise<number> {
  return prisma.patient.count({ where: { organizationId } });
}

export async function individualUsage(userId: string) {
  return { profiles: await countOwnProfiles(userId) };
}

export async function organizationUsage(organizationId: string) {
  const [practitioners, patients] = await Promise.all([countClinicalMembers(organizationId), countPatients(organizationId)]);
  return { practitioners, patients };
}

/**
 * Serialises "count, then create" for one limit: call it first inside a
 * transaction, so parallel requests cannot both take the last free slot
 * (the lock is released when the transaction ends).
 */
export async function lockLimit(tx: { $executeRaw: typeof prisma.$executeRaw }, key: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}
