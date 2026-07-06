import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Буруу өгөгдөл", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.practitionerRequestedAt) {
    return NextResponse.json({ error: "Хүсэлт олдсонгүй" }, { status: 404 });
  }

  if (parsed.data.action === "approve") {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: "PRACTITIONER", practitionerApprovedAt: new Date() },
      select: { id: true, role: true, practitionerApprovedAt: true },
    });
    return NextResponse.json(updated);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { practitionerRequestedAt: null, practitionerApprovedAt: null },
    select: { id: true, role: true },
  });
  return NextResponse.json(updated);
}
