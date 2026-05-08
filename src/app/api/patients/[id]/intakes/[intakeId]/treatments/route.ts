import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { treatmentLogUpdateSchema } from "@/lib/apiSchemas";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; intakeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PRACTITIONER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, intakeId } = await params;

  const intake = await prisma.clinicalIntake.findFirst({
    where: {
      id: intakeId,
      practitionerId: session.user.id,
      profile: {
        asPatient: { some: { id, practitionerId: session.user.id } },
      },
    },
    select: { id: true },
  });
  if (!intake) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = treatmentLogUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const log = await prisma.treatmentLog.upsert({
    where: { intakeId },
    create: { intakeId, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json(log);
}
