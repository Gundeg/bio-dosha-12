import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { actorOf, requireAuth } from "@/lib/authz";
import { HttpError, handle, readJson } from "@/lib/http";
import { verifyPassword } from "@/lib/accountLifecycle";
import { consumeSecondFactor } from "@/lib/mfa";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({ password: z.string().min(1), code: z.string().trim().min(6).max(20) });

/** Turns 2-step login off. Not allowed for staff and organization members, who must keep it. */
export const POST = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  if (ctx.mfaRequired) {
    throw new HttpError(403, "mfa_required", "Таны эрхэд 2 шаттай нэвтрэлт заавал шаардлагатай.");
  }
  const { password, code } = schema.parse(await readJson(req));
  if (!(await verifyPassword(ctx.userId, password))) throw new HttpError(403, "wrong_password", "Нууц үг буруу байна.");

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { id: true, totpSecret: true, totpEnabledAt: true, recoveryCodeHashes: true },
  });
  if (!user?.totpEnabledAt || !user.totpSecret) throw new HttpError(409, "mfa_not_enabled", "2 шаттай нэвтрэлт идэвхгүй байна.");
  if (!(await consumeSecondFactor(user, code))) throw new HttpError(400, "mfa_invalid", "Код буруу байна.");

  await prisma.user.update({
    where: { id: ctx.userId },
    data: { totpSecret: null, totpEnabledAt: null, totpLastStep: null, recoveryCodeHashes: [] },
  });
  await audit({ action: "auth.mfa.disabled", actor: actorOf(ctx), headers: req.headers });
  return NextResponse.json({ ok: true });
});
