import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PractitionerRequestList } from "@/components/admin/PractitionerRequestList";
import { PractitionerAccessList } from "@/components/admin/PractitionerAccessList";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const t = await getTranslations("admin");

  const [pending, practitioners] = await Promise.all([
    prisma.user.findMany({
      where: {
        practitionerRequestedAt: { not: null },
        practitionerApprovedAt: null,
        // Only INDIVIDUAL users can be approved; an ADMIN with an old request would be stuck here.
        role: "INDIVIDUAL",
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
    prisma.user.findMany({
      where: { role: "PRACTITIONER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, practitionerApprovedAt: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("summary", { pending: pending.length, practitioners: practitioners.length })}
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("practitionersHeading")}</h2>
        <PractitionerAccessList
          practitioners={practitioners.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            approvedAt: u.practitionerApprovedAt?.toISOString() ?? null,
          }))}
        />
      </section>
    </div>
  );
}
