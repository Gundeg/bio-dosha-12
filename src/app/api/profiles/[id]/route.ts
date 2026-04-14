import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/apiSchemas";

export const runtime = "nodejs";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const profile = await prisma.profile.findFirst({
    where: { id, userId: session.user.id },
    include: {
      bediRecords: {
        orderBy: { date: "desc" },
        include: { recommendation: true },
      },
    },
  });

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.profile.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const profile = await prisma.profile.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(profile);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const profile = await prisma.profile.findFirst({ where: { id, userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (profile.relationship === "patient") {
    return NextResponse.json({ error: "Use the patients API to remove patients" }, { status: 403 });
  }

  await prisma.profile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
