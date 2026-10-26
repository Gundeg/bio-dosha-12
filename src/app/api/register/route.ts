import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findUserIdByEmail } from "@/lib/users";
import { normalizeEmail, passwordSchema } from "@/lib/credentials";
import { REGISTER_LIMIT, clientIp, consumeRateLimit } from "@/lib/rateLimit";
import { HttpError, conflict, handle, readJson } from "@/lib/http";
import { organizationFieldsSchema } from "@/lib/schemas/organization";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.email().trim().max(200).transform(normalizeEmail),
    password: passwordSchema,
    // Эрүүл мэндийн мэдээлэл боловсруулахыг зөвшөөрсөн байх ёстой.
    acceptPrivacy: z.literal(true),
    accountType: z.enum(["individual", "organization"]).default("individual"),
    organization: organizationFieldsSchema.optional(),
    /** Legacy field from the old sign-up form; ignored. */
    wantsPractitioner: z.boolean().optional(),
  })
  .refine((v) => v.accountType !== "organization" || !!v.organization, {
    message: "Байгууллагын мэдээллийг бөглөнө үү.",
    path: ["organization"],
  });

/**
 * Self-service sign-up.
 *  - individual:   a personal account (self + family profiles).
 *  - organization: a personal account plus a medical organization in PENDING
 *    state, with the registrant as OWNER. Clinical features unlock after the
 *    platform verifies the organization in the control center.
 * Platform roles are never taken from the request.
 */
export const POST = handle(async (req: NextRequest) => {
  const allowed = await consumeRateLimit(
    `register:ip:${clientIp(req.headers)}`,
    REGISTER_LIMIT.perIp,
    REGISTER_LIMIT.windowMs
  );
  if (!allowed) {
    throw new HttpError(429, "rate_limited", "Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу.");
  }

  const data = registerSchema.parse(await readJson(req));
  if (await findUserIdByEmail(data.email)) throw conflict("email_taken", "Энэ имэйл аль хэдийн бүртгэлтэй байна");

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await bcrypt.hash(data.password, 12),
      role: "INDIVIDUAL",
      privacyAcceptedAt: new Date(),
    },
  });

  let organizationId: string | null = null;
  if (data.accountType === "organization" && data.organization) {
    try {
      const org = await prisma.organization.create({
        data: {
          ...data.organization,
          status: "PENDING",
          members: { create: { userId: user.id, role: "OWNER", title: null } },
        },
      });
      organizationId = org.id;
      await prisma.user.update({ where: { id: user.id }, data: { activeOrganizationId: org.id } });
    } catch (err) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
      throw err;
    }
  }

  await audit({
    action: "auth.register",
    actor: { id: user.id, email: user.email, role: user.role },
    organizationId,
    targetType: "user",
    targetId: user.id,
    meta: { accountType: data.accountType },
    headers: req.headers,
  });

  return NextResponse.json(
    { id: user.id, email: user.email, accountType: data.accountType, organizationId },
    { status: 201 }
  );
});
