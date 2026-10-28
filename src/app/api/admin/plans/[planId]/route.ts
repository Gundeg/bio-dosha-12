import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actorOf, requireStaff } from "@/lib/authz";
import { HttpError, conflict, handle, notFound, readJson } from "@/lib/http";
import { planUpdateSchema } from "@/lib/schemas/admin";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Edits a plan. Rules that keep the app usable:
 *  - every audience keeps exactly one default plan: making a plan the default
 *    moves the flag; the current default cannot simply be unset;
 *  - the default plan cannot be deactivated;
 *  - plans are never deleted (subscriptions point at them): deactivate instead.
 */
export const PATCH = handle(async (req: NextRequest, { params }: { params: Promise<{ planId: string }> }) => {
  const ctx = await requireStaff("SUPERADMIN");
  const { planId } = await params;
  const data = planUpdateSchema.parse(await readJson(req));
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw notFound();

  // Prisma skips undefined values, so `data` can be passed as is.
  const changed = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined);
  if (!changed.length) throw new HttpError(400, "invalid", "Өөрчлөх талбар алга.");

  const willBeDefault = data.isDefault ?? plan.isDefault;
  const willBeActive = data.isActive ?? plan.isActive;
  if (plan.isDefault && data.isDefault === false) {
    throw conflict("default_required", "Өөр багцыг үндсэн болгосноор энэ багцын үндсэн тэмдэг автоматаар арилна.");
  }
  if (willBeDefault && !willBeActive) {
    throw conflict("default_inactive", "Үндсэн багцыг идэвхгүй болгох боломжгүй. Эхлээд өөр багцыг үндсэн болгоно уу.");
  }

  if (data.isDefault && !plan.isDefault) {
    await prisma.plan.updateMany({
      where: { audience: plan.audience, isDefault: true, id: { not: plan.id } },
      data: { isDefault: false },
    });
  }
  const updated = await prisma.plan.update({ where: { id: planId }, data });
  await audit({
    action: "admin.plan.updated",
    actor: actorOf(ctx),
    targetType: "plan",
    targetId: planId,
    meta: { code: plan.code, fields: changed.join(",") },
    headers: req.headers,
  });
  return NextResponse.json(updated);
});
