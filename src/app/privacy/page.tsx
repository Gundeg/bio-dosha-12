import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmergencyNote } from "@/components/shell/EmergencyNote";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return { title: `${t("title")} | Bio-Dosha-12` };
}

const SECTIONS = ["collect", "use", "access", "organizations", "security", "delete"] as const;

export default async function PrivacyPage() {
  const t = await getTranslations("legal");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <article className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">{t("privacy.title")}</h1>
        <p className="mt-1 text-xs text-slate-500">{t("privacy.updated")}</p>
        <p className="mt-6 text-sm leading-relaxed text-slate-700">{t("privacy.intro")}</p>

        {SECTIONS.map((key) => (
          <section key={key} className="mt-6">
            <h2 className="text-base font-semibold text-slate-800">{t(`privacy.${key}Title`)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{t(`privacy.${key}`)}</p>
          </section>
        ))}

        <section className="mt-6 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-base font-semibold text-slate-800">{t("privacy.medicalTitle")}</h2>
          <p className="text-sm leading-relaxed text-slate-700">{t("disclaimer")}</p>
          <EmergencyNote className="text-slate-700" />
        </section>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="inline-block text-sm font-semibold text-blue-600 hover:underline">
            {t("privacy.back")}
          </Link>
          <Link href="/about" className="inline-block text-sm font-semibold text-blue-600 hover:underline">
            {t("privacy.aboutLink")}
          </Link>
        </div>
      </article>
    </main>
  );
}
