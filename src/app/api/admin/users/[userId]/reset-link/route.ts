import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actorOf, requireStaff } from "@/lib/authz";
import { HttpError, forbidden, handle, notFound } from "@/lib/http";
import { createAuthToken, resetUrl } from "@/lib/tokens";
import { isEmailEnabled, resetEmail, sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Creates a one-time password reset link (valid 2 hours) for a user who lost
 * their password. Only the superadmin sees the link itself (to share through a
 * trusted channel); for platform admins it is emailed to the person, so staff
 * can never sign in as someone else and reach their health records.
 */
export const POST = handle(async (req: NextRequest, { params }: { params: Promise<{ userId: string }> }) => {
  const ctx = await requireStaff();
  const { userId } = await params;
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
  if (!target) throw notFound();
  if (target.id === ctx.userId) throw forbidden("Өөрийн нууц үгийг Тохиргоо хэсгээс солино уу.");
  if (target.role === "SUPERADMIN") throw forbidden("Супер админы нууц үгийг эндээс сэргээх боломжгүй.");
  if (target.role === "ADMIN" && !ctx.isSuperadmin) throw forbidden("Ажилтны нууц үгийг зөвхөн супер админ сэргээнэ.");

  if (!ctx.isSuperadmin && !isEmailEnabled()) {
    throw new HttpError(403, "email_required", "Имэйл илгээх тохиргоо идэвхгүй үед сэргээх холбоосыг зөвхөн супер админ үүсгэнэ.");
  }

  // Older unused reset links for this account stop working.
  await prisma.authToken.updateMany({
    where: { userId: target.id, type: "RESET", usedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  const { raw, record } = await createAuthToken({ type: "RESET", email: target.email, userId: target.id, createdById: ctx.userId });
  const link = resetUrl(raw, req.url);
  const { sent } = await sendEmail({ to: target.email, ...resetEmail({ link }) });
  if (!ctx.isSuperadmin && !sent) {
    await prisma.authToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
    throw new HttpError(502, "email_failed", "Имэйл илгээж чадсангүй. Дахин оролдоно уу.");
  }

  await audit({
    action: "admin.user.reset_link",
    actor: actorOf(ctx),
    targetType: "user",
    targetId: target.id,
    meta: { emailSent: sent },
    headers: req.headers,
  });
  return NextResponse.json(
    { resetUrl: ctx.isSuperadmin ? link : null, emailSent: sent, expiresAt: record.expiresAt },
    { headers: { "cache-control": "private, no-store" } }
  );
});
