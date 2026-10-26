import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAuthToken, resetUrl } from "@/lib/tokens";
import { handle, readJson } from "@/lib/http";
import { normalizeEmail } from "@/lib/credentials";
import { isEmailEnabled, resetEmail, sendEmail } from "@/lib/email";
import { clientIp, consumeRateLimit, limitKey } from "@/lib/rateLimit";
import { findUserIdByEmail } from "@/lib/users";

export const runtime = "nodejs";

const schema = z.object({ email: z.email().trim().max(200).transform(normalizeEmail) });

/**
 * "Forgot password". When email delivery is configured, sends a reset link.
 * The answer is always the same, whether or not the email has an account, so
 * the form cannot be used to discover who is registered.
 */
export const POST = handle(async (req: NextRequest) => {
  if (!isEmailEnabled()) return NextResponse.json({ ok: true, emailEnabled: false });

  const { email } = schema.parse(await readJson(req));
  const ipOk = await consumeRateLimit(`forgot:ip:${clientIp(req.headers)}`, 10, 60 * 60 * 1000);
  const emailOk = await consumeRateLimit(limitKey("forgot:email", email), 3, 60 * 60 * 1000);
  if (ipOk && emailOk) {
    const userId = await findUserIdByEmail(email);
    const user = userId
      ? await prisma.user.findFirst({ where: { id: userId, disabledAt: null }, select: { id: true, email: true } })
      : null;
    if (user) {
      const { raw } = await createAuthToken({ type: "RESET", email: user.email, userId: user.id });
      const mail = resetEmail({ link: resetUrl(raw, req.url) });
      await sendEmail({ to: user.email, ...mail });
    }
  }
  return NextResponse.json({ ok: true, emailEnabled: true });
});
