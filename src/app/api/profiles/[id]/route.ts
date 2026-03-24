import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const body = await req.json();

  const profile = await prisma.profile.updateMany({
    where: { id, userId: session.user.id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.heightCm && { heightCm: body.heightCm }),
      ...(body.doshaType !== undefined && { doshaType: body.doshaType }),
      ...(body.ktScore !== undefined && { ktScore: body.ktScore }),
    },
  });

  return NextResponse.json(profile);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.profile.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
