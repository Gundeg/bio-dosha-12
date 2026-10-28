import { prisma } from "./prisma";
import { HttpError } from "./http";

/**
 * The single write path for subscriptions. The control center calls it today;
 * a payment webhook will call it later with provider details, so plan logic
 * stays in one place.
 */
export async function assignPlan(input: {
  subject: { userId: string } | { organizationId: string };
  planCode: string | null;
  note?: string | null;
  currentPeriodEnd?: Date | null;
  assignedById: string;
}) {
  const where = "userId" in input.subject ? { userId: input.subject.userId } : { organizationId: input.subject.organizationId };
  const audience = "userId" in input.subject ? "INDIVIDUAL" : "ORGANIZATION";

  if (input.planCode === null) {
    await prisma.subscription.deleteMany({ where });
    return null;
  }

  const plan = await prisma.plan.findUnique({ where: { code: input.planCode } });
  if (!plan || !plan.isActive) throw new HttpError(400, "plan_unknown", "Ийм идэвхтэй багц алга.");
  if (plan.audience !== audience) {
    throw new HttpError(400, "plan_audience", "Энэ багц өөр төрлийн хэрэглэгчид зориулагдсан.");
  }

  const existing = await prisma.subscription.findFirst({ where });
  const data = {
    planId: plan.id,
    status: "ACTIVE" as const,
    note: input.note ?? null,
    currentPeriodEnd: input.currentPeriodEnd ?? null,
    assignedById: input.assignedById,
    canceledAt: null,
  };
  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: { ...data, ...(existing.planId !== plan.id ? { startedAt: new Date() } : {}) },
      include: { plan: true },
    });
  }
  return prisma.subscription.create({ data: { ...data, ...where }, include: { plan: true } });
}
