import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, passwordSchema } from "@/lib/credentials";
import { REGISTER_LIMIT, clientIp, consumeRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().trim().max(200).transform(normalizeEmail),
  password: passwordSchema,
  // Эмчийн эрхийг шууд олгохгүй — зөвхөн хүсэлт болгон бүртгэнэ.
  wantsPractitioner: z.boolean().optional(),
  // Эрүүл мэндийн мэдээлэл боловсруулахыг зөвшөөрсөн байх ёстой.
  acceptPrivacy: z.literal(true),
});

export async function POST(req: NextRequest) {
  try {
    const allowed = await consumeRateLimit(
      `register:ip:${clientIp(req.headers)}`,
      REGISTER_LIMIT.perIp,
      REGISTER_LIMIT.windowMs
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Буруу өгөгдөл", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, wantsPractitioner } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Энэ имэйл аль хэдийн бүртгэлтэй байна" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    // Аюулгүй байдал: role-ийг клиентээс хэзээ ч авахгүй. Эмч болох хүсэлт
    // practitionerRequestedAt-д тэмдэглэгдэж, админ баталсны дараа
    // PRACTITIONER эрх нээгдэнэ.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "INDIVIDUAL",
        practitionerRequestedAt: wantsPractitioner ? new Date() : null,
        privacyAcceptedAt: new Date(),
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, practitionerRequested: !!wantsPractitioner },
      { status: 201 }
    );
  } catch (err) {
    console.error("[/api/register]", err);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}
