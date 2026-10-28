import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAuthContext } from "@/lib/authz";
import { isEmailEnabled } from "@/lib/email";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminViewerProvider } from "@/components/admin/AdminViewer";
import { Icon } from "@/components/ui/icon";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return {
    title: `${t("meta.section")} | Bio-Dosha-12`,
    robots: { index: false, follow: false },
  };
}

/**
 * Platform control center. Only platform staff get in (checked against the
 * database, not just the session cookie); every API route checks again.
 * Staff see accounts, organizations and counts, never health records.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx?.isPlatformStaff) redirect("/dashboard");
  // Every control-center API requires 2-step sign-in for staff.
  if (!ctx.mfaEnabled) redirect("/mfa-setup");

  const t = await getTranslations("admin");
  const role = ctx.isSuperadmin ? "SUPERADMIN" : "ADMIN";

  return (
    <AdminViewerProvider
      viewer={{ id: ctx.userId, email: ctx.email, role, isSuperadmin: ctx.isSuperadmin, emailEnabled: isEmailEnabled() }}
    >
      <div className="space-y-6">
        {/* Section context and navigation; each page below has its own PageHeader. */}
        <div className="space-y-3 print:hidden">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-6">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-surface">{t("layout.title")}</p>
              <p className="truncate text-xs text-on-surface-variant">
                {t(`roles.${role}`)} · {ctx.email}
              </p>
            </div>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-on-surface-variant md:max-w-md">
              <Icon name="shield_lock" className="mt-px size-4 shrink-0 text-emerald-700" />
              <span>
                <span className="block font-medium text-on-surface">{t("layout.privacyTitle")}</span>
                {t("layout.privacy")}
              </span>
            </p>
          </div>
          <AdminNav isSuperadmin={ctx.isSuperadmin} />
        </div>
        {children}
      </div>
    </AdminViewerProvider>
  );
}
