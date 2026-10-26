import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { actorOf, requireAuth } from "@/lib/authz";
import { HttpError, handle, readJson } from "@/lib/http";
import { deleteAccount, planAccountDeletion, verifyPassword } from "@/lib/accountLifecycle";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    locale: z.enum(["mn", "en"]).optional(),
  })
  .refine((v) => v.name !== undefined || v.locale !== undefined, { message: "Nothing to update" });

export const PATCH = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const data = updateSchema.parse(await readJson(req));
  const user = await prisma.user.update({
    where: { id: ctx.userId },
    data,
    select: { id: true, name: true, locale: true },
  });
  await audit({ action: "account.updated", actor: actorOf(ctx), meta: { fields: Object.keys(data).join(",") }, headers: req.headers });
  return NextResponse.json(user);
});

/** Preview of what deleting the account would remove (for the confirmation dialog). */
export const GET = handle(async () => {
  const ctx = await requireAuth();
  return NextResponse.json(await planAccountDeletion(ctx.userId));
});

const deleteSchema = z.object({
  password: z.string().min(1),
  confirm: z.literal("DELETE"),
  deleteSoleOrganizations: z.boolean().optional(),
});

export const DELETE = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  if (ctx.isSuperadmin) {
    throw new HttpError(409, "superadmin", "Супер админы бүртгэлийг эндээс устгах боломжгүй.");
  }
  const body = deleteSchema.parse(await readJson(req));
  if (!(await verifyPassword(ctx.userId, body.password))) {
    throw new HttpError(403, "wrong_password", "Нууц үг буруу байна.");
  }

  const result = await deleteAccount(ctx.userId, { deleteSoleOrganizations: !!body.deleteSoleOrganizations });
  if (!result.ok) {
    const message =
      result.reason === "owner_required"
        ? "Та байгууллагын цорын ганц эзэн байна. Эхлээд өөр гишүүнийг эзэн болгоно уу."
        : "Таны ганцаараа гишүүн байгаа байгууллага, түүний өвчтөний бүртгэл хамт устна. Баталгаажуулна уу.";
    return NextResponse.json({ error: message, code: result.reason, plan: result.plan }, { status: 409 });
  }

  await audit({
    action: "account.deleted",
    actor: actorOf(ctx),
    targetType: "user",
    targetId: ctx.userId,
    meta: { organizationsDeleted: result.plan.organizationsToDelete.length },
    headers: req.headers,
  });
  return NextResponse.json({ ok: true });
});
