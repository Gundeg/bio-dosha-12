/**
 * Types and helpers for the control center. The types mirror the JSON that the
 * routes under src/app/api/admin/** return (read the route files when a field
 * changes); they never contain health records, only account data and counts.
 */
import { APP_TIME_ZONE } from "@/lib/formatDate";
import type { PlanLimits } from "@/lib/entitlements";
import type { DeletionPlan } from "@/lib/accountLifecycle";

export type { PlanLimits, DeletionPlan };

export type PlatformRole = "INDIVIDUAL" | "PRACTITIONER" | "ADMIN" | "SUPERADMIN";
export type OrgStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
export type OrgRole = "OWNER" | "ADMIN" | "PRACTITIONER";
export type MemberStatus = "ACTIVE" | "DISABLED";
export type InviteState = "pending" | "used" | "revoked" | "expired";
export type PlanAudience = "INDIVIDUAL" | "ORGANIZATION";
export type PlanSource = "subscription" | "default" | "fallback";

/** Server page size for every control-center list. */
export const PAGE_SIZE = 25;

export interface PlanRef {
  code: string;
  nameMn: string;
  nameEn: string;
}

/** `plan` block of the organization and user detail routes. */
export interface EffectivePlanInfo extends PlanRef {
  source: PlanSource;
  limits: PlanLimits;
  note: string | null;
  currentPeriodEnd: string | null;
}

/** GET /api/admin/plans (array). */
export interface AdminPlan extends PlanRef {
  id: string;
  audience: PlanAudience;
  descriptionMn: string | null;
  descriptionEn: string | null;
  priceMonthlyMnt: number | null;
  limits: PlanLimits;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  subscribers: number;
}

/** Audit rows as embedded in the overview, organization and user detail routes. */
export interface ActivityItem {
  id: string;
  at: string;
  action: string;
  actorEmail: string | null;
  targetType?: string | null;
  targetId?: string | null;
  ip?: string | null;
}

/**
 * One-time link answer of the invite, reset-link and organization-create
 * routes. The raw link is null when it was only emailed (a platform admin
 * renewing an invitation or creating a reset link never sees it).
 */
export interface OneTimeLinkResponse {
  inviteUrl?: string | null;
  resetUrl?: string | null;
  emailSent: boolean;
  expiresAt: string;
}

export interface Paged<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function isStaffRole(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

/** Plan name in the current language. */
export function planName(plan: PlanRef, locale: string): string {
  return locale === "en" ? plan.nameEn : plan.nameMn;
}

/** Plan name in the other language (shown as a secondary line). */
export function planOtherName(plan: PlanRef, locale: string): string {
  return locale === "en" ? plan.nameMn : plan.nameEn;
}

/** A numeric limit, or null when unlimited (null or missing in the plan). */
export function limitOf(limits: PlanLimits, key: "maxProfiles" | "maxPractitioners" | "maxPatients"): number | null {
  const value = limits[key];
  return typeof value === "number" ? value : null;
}

/** Same rule as entitlements.hasFeature: only an explicit `false` turns PDF reports off. */
export function hasPdfReports(limits: PlanLimits): boolean {
  return limits.pdfReports !== false;
}

/**
 * Short, still-distinctive form of a cuid. The first characters of a cuid
 * encode its creation time and repeat between records made close together, so
 * the end of the id is shown instead.
 */
export function shortId(id: string): string {
  return id.length > 10 ? `…${id.slice(-8)}` : id;
}

/** UTC offset of the app time zone on a calendar day, e.g. "+08:00". */
function zoneOffset(day: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: APP_TIME_ZONE, timeZoneName: "longOffset" }).formatToParts(
      new Date(`${day}T12:00:00Z`)
    );
    const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    const match = /GMT([+-]\d{2}:\d{2})/.exec(name);
    if (match) return match[1];
    if (name === "GMT") return "+00:00";
  } catch {
    // Very old browsers: fall through to Mongolia's fixed offset.
  }
  return "+08:00";
}

/**
 * "2026-10-27" (a date input) → the ISO instant where that day starts or ends
 * in the app time zone, so filters and period ends mean the same day for
 * everyone regardless of the browser's time zone.
 */
export function dayBoundaryIso(day: string, edge: "start" | "end"): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const time = edge === "start" ? "00:00:00.000" : "23:59:59.999";
  const date = new Date(`${day}T${time}${zoneOffset(day)}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** ISO instant → "YYYY-MM-DD" in the app time zone (the value of a date input). */
export function isoToDay(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Loose email check for instant feedback; the API validates properly. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Field names the API rejected (ApiError.fieldErrors). The API's own messages
 * are English Zod texts, so the form shows its translated hint for each field.
 */
export function invalidFields(fieldErrors: Record<string, string[]> | undefined): Set<string> {
  return new Set(Object.entries(fieldErrors ?? {}).filter(([, messages]) => messages?.length).map(([key]) => key));
}
