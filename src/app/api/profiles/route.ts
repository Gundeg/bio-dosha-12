import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileCreateSchema } from "@/lib/apiSchemas";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profiles = await prisma.profile.findMany({
    where: { userId: session.user.id, relationship: { not: "patient" } },
    include: {
      bediRecords: { orderBy: { date: "desc" }, take: 1, include: { recommendation: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(profiles);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = profileCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { name, birthDate, sex, heightCm, doshaType, ktScore, relationship } = parsed.data;

  const profile = await prisma.profile.create({
    data: {
      userId: session.user.id,
      name,
      birthDate: new Date(birthDate),
      sex,
      heightCm,
      doshaType,
      ktScore,
      relationship: relationship ?? "self",
    },
  });

  return NextResponse.json(profile, { status: 201 });
}
