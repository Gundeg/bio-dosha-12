import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PractitionerRequestList } from "@/components/admin/PractitionerRequestList";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [pending, practitioners] = await Promise.all([
    prisma.user.findMany({
      where: {
        practitionerRequestedAt: { not: null },
        practitionerApprovedAt: null,
        role: { not: "PRACTITIONER" },
      },
      orderBy: { practitionerRequestedAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        practitionerRequestedAt: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where: { role: "PRACTITIONER" } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Админ
        </p>
        <h1 className="text-2xl font-bold">Эмчийн эрхийн хүсэлтүүд</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Хүлээгдэж буй {pending.length} хүсэлт · Нийт {practitioners} эмч
        </p>
      </header>

      <PractitionerRequestList
        initialRequests={pending.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          requestedAt: (u.practitionerRequestedAt ?? u.createdAt).toISOString(),
        }))}
      />
    </div>
  );
}
