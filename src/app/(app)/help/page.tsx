import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { GLOSSARY } from "@/lib/glossary";
import { L } from "@/lib/i18nData";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("help");
  return { title: `${t("metaTitle")} | Bio-Dosha-12` };
}

const STEPS = [
  { id: "s1", icon: "🧬" },
  { id: "s2", icon: "⚖️" },
  { id: "s3", icon: "🌿" },
] as const;

const FAQ = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;

export default async function HelpPage() {
  const t = await getTranslations("help");
  const locale = await getLocale();

  return (
    <div className="space-y-10 max-w-3xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("intro")}</p>
      </header>

      {/* 3 алхам */}
      <section className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div
            key={step.id}
            className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5"
          >
            <span className="text-3xl" aria-hidden="true">
              {step.icon}
            </span>
            <h2 className="mt-3 font-semibold text-sm">{t(`steps.${step.id}.title`)}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {t(`steps.${step.id}.body`)}
            </p>
          </div>
        ))}
      </section>

      {/* Тайлбар толь */}
      <section aria-labelledby="glossary-heading">
        <h2 id="glossary-heading" className="text-lg font-bold mb-3">
          {t("glossaryTitle")}
        </h2>
        <dl className="space-y-3">
          {GLOSSARY.map((entry) => (
            <div
              key={entry.key}
              id={entry.key}
              className="scroll-mt-24 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3"
            >
              <dt className="flex items-center gap-2 font-semibold text-sm">
                <span aria-hidden="true">{entry.emoji}</span>
                {L(entry.term, locale)}
                {/* Нөгөө хэл дээрх нэр: MN-д англи, EN-д монгол нэр томьёо */}
                <span
                  className="text-xs font-normal text-muted-foreground"
                  lang={locale === "en" ? "mn" : "en"}
                >
                  · {locale === "en" ? entry.term.mn : entry.term.en}
                </span>
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {L(entry.short, locale)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Түгээмэл асуулт */}
      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-lg font-bold mb-3">
          {t("faqTitle")}
        </h2>
        <div className="space-y-2">
          {FAQ.map((id) => (
            <details
              key={id}
              className="group rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3"
            >
              <summary className="cursor-pointer list-none font-medium text-sm flex items-center justify-between gap-2">
                {t(`faq.${id}.q`)}
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[18px] text-muted-foreground motion-safe:transition-transform group-open:rotate-180"
                >
                  expand_more
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {t(`faq.${id}.a`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Судалгааны үндэслэл */}
      <section
        aria-labelledby="methodology-heading"
        className="rounded-2xl border border-primary/20 bg-primary/5 p-5"
      >
        <h2 id="methodology-heading" className="text-lg font-bold">
          {t("methodology.title")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t.rich("methodology.body", {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">{t("methodology.citation")}</p>
      </section>

      {/* Disclaimer + холбоо барих */}
      <footer className="space-y-3 pb-6">
        <p className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
          <span aria-hidden="true">⚕️</span> {t("disclaimer")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t.rich("contact", {
            link: (chunks) => (
              <Link href="/dashboard" className="text-primary hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </footer>
    </div>
  );
}
