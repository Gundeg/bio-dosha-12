import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { actorOf, requireAuth } from "@/lib/authz";
import { HttpError, handle, readJson } from "@/lib/http";
import { generateRecoveryCodes, verifyTotp } from "@/lib/totp";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({ code: z.string().trim().min(6).max(10) });

/** Confirms the authenticator with one valid code and returns recovery codes (shown once). */
export const POST = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const { code } = schema.parse(await readJson(req));
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { totpSecret: true, totpEnabledAt: true },
  });
  if (user?.totpEnabledAt) throw new HttpError(409, "mfa_already_enabled", "2 шаттай нэвтрэлт аль хэдийн идэвхтэй байна.");
  if (!user?.totpSecret) throw new HttpError(400, "mfa_setup_missing", "Эхлээд QR кодыг үүсгэнэ үү.");

  const step = verifyTotp(user.totpSecret, code);
  if (step === null) throw new HttpError(400, "mfa_invalid", "Код буруу байна. Аппын одоогийн кодыг оруулна уу.");

  const { codes, hashes } = generateRecoveryCodes();
  await prisma.user.update({
    where: { id: ctx.userId },
    data: { totpEnabledAt: new Date(), totpLastStep: step, recoveryCodeHashes: hashes },
  });
  await audit({ action: "auth.mfa.enabled", actor: actorOf(ctx), headers: req.headers });
  return NextResponse.json({ ok: true, recoveryCodes: codes }, { headers: { "cache-control": "private, no-store" } });
});
