import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Нэвтэрсэн хэрэглэгчийн өөрийн төлөв (эмчийн хүсэлтийн явц г.м) */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      practitionerRequestedAt: true,
      practitionerApprovedAt: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });
  }

  return NextResponse.json(user);
}
