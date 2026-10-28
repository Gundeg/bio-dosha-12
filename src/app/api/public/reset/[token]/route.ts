import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findValidToken } from "@/lib/tokens";
import { HttpError, handle, notFound, readJson } from "@/lib/http";
import { passwordSchema } from "@/lib/credentials";
import { REGISTER_LIMIT, clientIp, consumeRateLimit } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Params = { params: Promise<{ token: string }> };

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 2)}${"•".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

export const GET = handle(async (_req: NextRequest, { params }: Params) => {
  const { token } = await params;
  const reset = await findValidToken(token, "RESET");
  if (!reset || !reset.userId) throw notFound("Холбоос хүчингүй эсвэл хугацаа нь дууссан байна.");
  return NextResponse.json({ email: maskEmail(reset.email), expiresAt: reset.expiresAt });
});

const schema = z.object({ password: passwordSchema });

/** Sets a new password and signs the account out on every device. */
export const POST = handle(async (req: NextRequest, { params }: Params) => {
  const { token } = await params;
  const allowed = await consumeRateLimit(`reset:ip:${clientIp(req.headers)}`, REGISTER_LIMIT.perIp * 3, REGISTER_LIMIT.windowMs);
  if (!allowed) throw new HttpError(429, "rate_limited", "Хэт олон оролдлого хийлээ. Түр хүлээнэ үү.");

  const reset = await findValidToken(token, "RESET");
  if (!reset || !reset.userId) throw notFound("Холбоос хүчингүй эсвэл хугацаа нь дууссан байна.");
  const { password } = schema.parse(await readJson(req));

  const user = await prisma.user.update({
    where: { id: reset.userId },
    data: {
      password: await bcrypt.hash(password, 12),
      passwordChangedAt: new Date(),
      sessionVersion: { increment: 1 },
    },
    select: { id: true, email: true, role: true },
  });
  // Any other outstanding reset links for this account stop working too.
  await prisma.authToken.updateMany({
    where: { userId: user.id, type: "RESET", usedAt: null },
    data: { usedAt: new Date() },
  });
  await audit({ action: "auth.password.reset", actor: { id: user.id, email: user.email, role: user.role }, headers: req.headers });
  return NextResponse.json({ ok: true });
});
