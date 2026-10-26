import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAuthContext } from "@/lib/authz";
import { isEmailEnabled } from "@/lib/email";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminViewerProvider } from "@/components/admin/AdminViewer";

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
        <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-ambient ring-1 ring-outline-variant/20 print:hidden">
          <div className="flex flex-col gap-3 p-4 sm:px-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="material-symbols-outlined flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-[22px] text-on-primary"
                aria-hidden="true"
              >
                admin_panel_settings
              </span>
              <div className="min-w-0">
                <p className="font-headline text-base font-bold text-on-surface">{t("layout.title")}</p>
                <p className="truncate text-xs text-on-surface-variant">
                  {t(`roles.${role}`)} · {ctx.email}
                </p>
              </div>
            </div>
            <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-950 ring-1 ring-emerald-600/20 md:max-w-md">
              <span className="material-symbols-outlined shrink-0 text-[18px] text-emerald-700" aria-hidden="true">
                shield_lock
              </span>
              <span>
                <span className="block font-semibold">{t("layout.privacyTitle")}</span>
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
