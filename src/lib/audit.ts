import { prisma } from "./prisma";
import { clientIp } from "./rateLimit";

/**
 * Security audit log. Records who did what to which record — never the health
 * data itself. Writing is best-effort: an audit failure is logged to the server
 * console but does not fail the user's action.
 */

export const AUDIT_ACTIONS = [
  // Authentication
  "auth.login.success",
  "auth.login.failure",
  "auth.login.blocked",
  "auth.mfa.enabled",
  "auth.mfa.disabled",
  "auth.mfa.recovery_used",
  "auth.mfa.recovery_regenerated",
  "auth.password.changed",
  "auth.password.reset",
  "auth.signout_all",
  "auth.register",
  "auth.invite.accepted",
  // Account
  "account.updated",
  "account.exported",
  "account.deleted",
  // Platform administration
  "admin.user.disabled",
  "admin.user.enabled",
  "admin.user.role_changed",
  "admin.user.signed_out",
  "admin.user.mfa_reset",
  "admin.user.reset_link",
  "admin.user.deleted",
  "admin.user.plan_changed",
  "admin.org.created",
  "admin.org.verified",
  "admin.org.suspended",
  "admin.org.reactivated",
  "admin.org.updated",
  "admin.org.plan_changed",
  "admin.org.deleted",
  "admin.plan.created",
  "admin.plan.updated",
  "admin.invite.created",
  "admin.invite.revoked",
  "admin.audit.exported",
  // Organization
  "org.updated",
  "org.member.invited",
  "org.member.role_changed",
  "org.member.disabled",
  "org.member.enabled",
  "org.member.removed",
  "org.invite.revoked",
  // Clinical records (ids only)
  "patient.created",
  "patient.listed",
  "patient.viewed",
  "patient.updated",
  "patient.deleted",
  "intake.created",
  "intake.updated",
  "intake.pdf_exported",
  "record.created",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditActor {
  id: string;
  email?: string | null;
  role?: string | null;
}

export interface AuditEntry {
  action: AuditAction;
  actor?: AuditActor | null;
  organizationId?: string | null;
  targetType?: string;
  targetId?: string;
  /** Short non-clinical facts only: ids, roles, counts, reasons typed by staff. */
  meta?: Record<string, string | number | boolean | null | undefined>;
  headers?: Headers;
}

const FORBIDDEN_META_KEYS =
  /pass|secret|token|totp|recovery|otp|diagnos|complaint|clinical|phone|address|registernumber|birth|weight|pulse/i;

/**
 * Free text from requests (browser name, typed reasons) must never start with
 * the encryption prefix: the encryption guard refuses such values, which would
 * silently drop the whole entry. Prefix them instead of failing.
 */
export function safeAuditText(value: string | null | undefined, max = 300): string | null {
  if (value === null || value === undefined) return null;
  const text = value.slice(0, max);
  return /^encj?:/i.test(text) ? `_${text}`.slice(0, max) : text;
}

/** Drops anything that could carry credentials or health data. */
export function sanitizeMeta(meta: AuditEntry["meta"]): Record<string, string | number | boolean | null> | undefined {
  if (!meta) return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined || FORBIDDEN_META_KEYS.test(key)) continue;
    out[key] = typeof value === "string" ? safeAuditText(value) : value;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: safeAuditText(entry.actor?.id ?? null, 100),
        actorEmail: safeAuditText(entry.actor?.email ?? null, 320),
        actorRole: safeAuditText(entry.actor?.role ?? null, 40),
        organizationId: safeAuditText(entry.organizationId ?? null, 100),
        targetType: safeAuditText(entry.targetType ?? null, 60),
        targetId: safeAuditText(entry.targetId ?? null, 100),
        ip: entry.headers ? safeAuditText(clientIp(entry.headers), 100) : null,
        userAgent: entry.headers ? safeAuditText(entry.headers.get("user-agent")) : null,
        meta: sanitizeMeta(entry.meta) ?? undefined,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write", entry.action, err);
    // Second chance with nothing but the action and actor, so an unexpected
    // value in a free-text column cannot erase the fact that it happened.
    try {
      await prisma.auditLog.create({
        data: {
          action: entry.action,
          actorId: safeAuditText(entry.actor?.id ?? null, 100),
          meta: { auditFallback: true },
        },
      });
    } catch (retryErr) {
      console.error("[audit] fallback write failed", entry.action, retryErr);
    }
  }
}
