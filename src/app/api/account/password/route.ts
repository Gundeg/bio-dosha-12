import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { actorOf, requireAuth } from "@/lib/authz";
import { HttpError, handle, readJson } from "@/lib/http";
import { passwordSchema } from "@/lib/credentials";
import { verifyPassword } from "@/lib/accountLifecycle";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema });

/** Changes the password and signs the account out everywhere (including this browser). */
export const POST = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const { currentPassword, newPassword } = schema.parse(await readJson(req));
  if (!(await verifyPassword(ctx.userId, currentPassword))) {
    throw new HttpError(403, "wrong_password", "Одоогийн нууц үг буруу байна.");
  }
  if (currentPassword === newPassword) {
    throw new HttpError(400, "same_password", "Шинэ нууц үг өмнөхөөсөө өөр байх ёстой.");
  }

  await prisma.user.update({
    where: { id: ctx.userId },
    data: {
      password: await bcrypt.hash(newPassword, 12),
      passwordChangedAt: new Date(),
      sessionVersion: { increment: 1 },
    },
  });
  await audit({ action: "auth.password.changed", actor: actorOf(ctx), headers: req.headers });
  return NextResponse.json({ ok: true, signedOut: true });
});
