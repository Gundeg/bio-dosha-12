import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { actorOf, requireAuth } from "@/lib/authz";
import { HttpError, handle, readJson } from "@/lib/http";
import { verifyPassword } from "@/lib/accountLifecycle";
import { generateRecoveryCodes } from "@/lib/totp";
import { consumeSecondFactor } from "@/lib/mfa";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({ password: z.string().min(1), code: z.string().trim().min(6).max(20) });

/**
 * Replaces all recovery codes with ten new ones (the old ones stop working).
 * Needs the password and a current code, so a stolen session plus a phished
 * password cannot quietly mint a permanent way around 2-step sign-in.
 */
export const POST = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const { password, code } = schema.parse(await readJson(req));
  if (!(await verifyPassword(ctx.userId, password))) throw new HttpError(403, "wrong_password", "Нууц үг буруу байна.");
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { id: true, totpEnabledAt: true, totpSecret: true, recoveryCodeHashes: true },
  });
  if (!user?.totpEnabledAt || !user.totpSecret) throw new HttpError(409, "mfa_not_enabled", "2 шаттай нэвтрэлт идэвхгүй байна.");
  if (!(await consumeSecondFactor(user, code))) {
    throw new HttpError(400, "mfa_invalid", "Код буруу байна. Аппын одоогийн кодыг оруулна уу.");
  }

  const { codes, hashes } = generateRecoveryCodes();
  await prisma.user.update({ where: { id: ctx.userId }, data: { recoveryCodeHashes: hashes } });
  await audit({ action: "auth.mfa.recovery_regenerated", actor: actorOf(ctx), headers: req.headers });
  return NextResponse.json({ recoveryCodes: codes }, { headers: { "cache-control": "private, no-store" } });
});
