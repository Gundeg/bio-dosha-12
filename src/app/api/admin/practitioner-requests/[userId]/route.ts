import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const actionSchema = z.object({
  // approve: pending → PRACTITIONER
  // reject:  pending request is dismissed
  // revoke:  PRACTITIONER → INDIVIDUAL; the request stays so it can be approved again
  action: z.enum(["approve", "reject", "revoke"]),
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

  // An admin's role must never be overwritten through this endpoint.
  if (user.role === "ADMIN") {
    return NextResponse.json({ error: "Админ эрхтэй хэрэглэгчийн эрхийг энд өөрчлөхгүй" }, { status: 409 });
  }

  if (parsed.data.action === "approve") {
    if (user.role !== "INDIVIDUAL") {
      return NextResponse.json({ error: "Хүсэлт аль хэдийн шийдвэрлэгдсэн" }, { status: 409 });
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: "PRACTITIONER", practitionerApprovedAt: new Date() },
      select: { id: true, role: true, practitionerApprovedAt: true },
    });
    return NextResponse.json(updated);
  }

  if (parsed.data.action === "revoke") {
    if (user.role !== "PRACTITIONER") {
      return NextResponse.json({ error: "Энэ хэрэглэгч эмчийн эрхгүй байна" }, { status: 409 });
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: "INDIVIDUAL", practitionerApprovedAt: null },
      select: { id: true, role: true },
    });
    return NextResponse.json(updated);
  }

  // reject: only a still-pending request can be dismissed.
  if (user.role !== "INDIVIDUAL") {
    return NextResponse.json({ error: "Эмчийн эрхийг цуцлахдаа «Эрх цуцлах» үйлдлийг ашиглана уу" }, { status: 409 });
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { practitionerRequestedAt: null, practitionerApprovedAt: null },
    select: { id: true, role: true },
  });
  return NextResponse.json(updated);
}
