import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PRACTITIONER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id, practitionerId: session.user.id },
    include: {
      profile: {
        include: {
          bediRecords: {
            orderBy: { date: "desc" },
            take: 1,
          },
          intakes: {
            orderBy: { admissionDate: "desc" },
            include: { treatmentLog: true },
          },
        },
      },
    },
  });

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(patient);
}
