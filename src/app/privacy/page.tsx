import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmergencyNote } from "@/components/shell/EmergencyNote";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return { title: `${t("title")} | Bio-Dosha-12` };
}

const SECTIONS = ["collect", "use", "access", "organizations", "security", "delete"] as const;

const TEXT_LINK =
  "inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default async function PrivacyPage() {
  const t = await getTranslations("legal");

  return (
    <main className="min-h-screen bg-surface px-4 py-10 sm:py-12">
      <article className="mx-auto max-w-2xl rounded-xl bg-surface-container-lowest p-5 shadow-ambient sm:p-10">
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface md:text-[28px] md:leading-9">
          {t("privacy.title")}
        </h1>
        <p className="mt-1 text-xs text-on-surface-variant">{t("privacy.updated")}</p>
        <p className="mt-6 text-sm leading-relaxed text-on-surface">{t("privacy.intro")}</p>

        {SECTIONS.map((key) => (
          <section key={key} className="mt-6">
            <h2 className="text-base font-semibold text-on-surface">{t(`privacy.${key}Title`)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{t(`privacy.${key}`)}</p>
          </section>
        ))}

        <section className="mt-6 space-y-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-600/20">
          <h2 className="text-base font-semibold text-amber-950">{t("privacy.medicalTitle")}</h2>
          <p className="text-sm leading-relaxed text-amber-950">{t("disclaimer")}</p>
          <EmergencyNote className="text-amber-950" />
        </section>

        <div className="mt-6 flex flex-wrap gap-x-6">
          <Link href="/" className={TEXT_LINK}>
            {t("privacy.back")}
          </Link>
          <Link href="/about" className={TEXT_LINK}>
            {t("privacy.aboutLink")}
          </Link>
        </div>
      </article>
    </main>
  );
}
