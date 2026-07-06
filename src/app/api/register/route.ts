import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().trim().max(200),
  password: z.string().min(6).max(200),
  // Эмчийн эрхийг шууд олгохгүй — зөвхөн хүсэлт болгон бүртгэнэ.
  wantsPractitioner: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Буруу өгөгдөл", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, wantsPractitioner } = parsed.data;

    const existing = await prisma.user.findFirst({ where: { email } });
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
