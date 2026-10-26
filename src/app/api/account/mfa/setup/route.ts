import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authz";
import { HttpError, handle } from "@/lib/http";
import { generateTotpSecret, otpauthUrl } from "@/lib/totp";

export const runtime = "nodejs";

/**
 * Starts authenticator setup: creates a new secret (stored encrypted, not yet
 * active) and returns it as a QR code plus text for manual entry. The secret
 * becomes active only after /api/account/mfa/enable confirms a valid code.
 */
export const POST = handle(async () => {
  const ctx = await requireAuth();
  const user = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { totpEnabledAt: true } });
  if (user?.totpEnabledAt) {
    throw new HttpError(409, "mfa_already_enabled", "2 шаттай нэвтрэлт аль хэдийн идэвхтэй байна.");
  }

  const secret = generateTotpSecret();
  await prisma.user.update({ where: { id: ctx.userId }, data: { totpSecret: secret, totpLastStep: null } });

  const url = otpauthUrl(secret, ctx.email);
  const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 240, errorCorrectionLevel: "M" });
  return NextResponse.json(
    { secret, otpauthUrl: url, qrDataUrl },
    { headers: { "cache-control": "private, no-store" } }
  );
});
