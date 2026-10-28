import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { HttpError } from "./http";
import { REAUTH_LIMIT, consumeRateLimit, resetRateLimit } from "./rateLimit";

/**
 * Account deletion rules, shared by self-service deletion and the control
 * center. Personal data (own and family profiles, records) is deleted with the
 * account. Clinic records belong to the organization and stay, unless the user
 * is the organization's only member — then the organization (and its patient
 * records) can only be removed with an explicit confirmation.
 */

export interface DeletionPlan {
  /** Organizations that would be left without an owner while others still work there. */
  blockers: { organizationId: string; organizationName: string }[];
  /** Organizations where the user is the only member; deleted only with confirmation. */
  organizationsToDelete: { organizationId: string; organizationName: string; patientCount: number }[];
}

export async function planAccountDeletion(userId: string): Promise<DeletionPlan> {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          members: { select: { userId: true, role: true, status: true } },
          _count: { select: { patients: true } },
        },
      },
    },
  });

  const plan: DeletionPlan = { blockers: [], organizationsToDelete: [] };
  for (const m of memberships) {
    const org = m.organization;
    const others = org.members.filter((x) => x.userId !== userId);
    if (others.length === 0) {
      plan.organizationsToDelete.push({
        organizationId: org.id,
        organizationName: org.name,
        patientCount: org._count.patients,
      });
      continue;
    }
    if (m.role === "OWNER") {
      const otherOwners = others.filter((x) => x.role === "OWNER" && x.status === "ACTIVE");
      if (otherOwners.length === 0) {
        plan.blockers.push({ organizationId: org.id, organizationName: org.name });
      }
    }
  }
  return plan;
}

/** Deletes the user (and, when confirmed, organizations where they were the only member). */
export async function deleteAccount(userId: string, opts: { deleteSoleOrganizations: boolean }) {
  const plan = await planAccountDeletion(userId);
  if (plan.blockers.length) return { ok: false as const, reason: "owner_required" as const, plan };
  if (plan.organizationsToDelete.length && !opts.deleteSoleOrganizations) {
    return { ok: false as const, reason: "confirm_organizations" as const, plan };
  }
  // All or nothing: organizations (with their patient records) and the account.
  await prisma.$transaction(async (tx) => {
    for (const org of plan.organizationsToDelete) {
      await tx.organization.delete({ where: { id: org.organizationId } });
    }
    await tx.user.delete({ where: { id: userId } });
  });
  return { ok: true as const, plan };
}

/**
 * Re-checks the signed-in person's password before a sensitive change. Limited
 * to a few attempts per 15 minutes, so a stolen session cannot be used to
 * guess the password.
 */
export async function verifyPassword(userId: string, password: string): Promise<boolean> {
  if (!password) return false;
  const key = `reauth:${userId}`;
  if (!(await consumeRateLimit(key, REAUTH_LIMIT.perUser, REAUTH_LIMIT.windowMs))) {
    throw new HttpError(429, "rate_limited", "Хэт олон оролдлого хийлээ. 15 минутын дараа дахин оролдоно уу.");
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user) return false;
  const ok = await bcrypt.compare(password, user.password);
  if (ok) await resetRateLimit(key);
  return ok;
}

/** Signs the user out on every device. */
export async function bumpSessionVersion(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } } });
}
