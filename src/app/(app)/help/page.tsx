import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { GLOSSARY } from "@/lib/glossary";
import { L } from "@/lib/i18nData";
import { Icon } from "@/components/ui/icon";
import { IconTile, PageHeader, Section } from "@/components/kit/layout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("help");
  return { title: `${t("metaTitle")} | Bio-Dosha-12` };
}

const STEPS = [
  { id: "s1", icon: "dna" },
  { id: "s2", icon: "monitor_weight" },
  { id: "s3", icon: "spa" },
] as const;

/** Each entry is reachable as /help#faq-<id> (e.g. #faq-organizations). */
const FAQ = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "organizations",
  "invitations",
  "mfa",
  "mfaLost",
  "plans",
] as const;

export default async function HelpPage() {
  const t = await getTranslations("help");
  const locale = await getLocale();

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader title={t("title")} description={t("intro")} />

      {/* 3 алхам */}
      <section className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.id} className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient">
            <IconTile name={step.icon} tone="primary" />
            <h2 className="mt-3 text-sm font-semibold text-on-surface">{t(`steps.${step.id}.title`)}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
              {t(`steps.${step.id}.body`)}
            </p>
          </div>
        ))}
      </section>

      {/* Тайлбар толь — each entry is reachable as /help#<key> */}
      <Section id="glossary" title={t("glossaryTitle")} bodyClassName="p-0">
        <dl className="divide-y divide-outline-variant">
          {GLOSSARY.map((entry) => (
            <div key={entry.key} id={entry.key} className="scroll-mt-24 px-5 py-4">
              <dt className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-on-surface">
                <Icon name={entry.icon} className="size-4 text-on-surface-variant" />
                {L(entry.term, locale)}
                {/* Нөгөө хэл дээрх нэр: MN-д англи, EN-д монгол нэр томьёо */}
                <span
                  className="text-xs font-normal text-on-surface-variant"
                  lang={locale === "en" ? "mn" : "en"}
                >
                  · {locale === "en" ? entry.term.mn : entry.term.en}
                </span>
              </dt>
              <dd className="mt-1 pl-6 text-sm leading-relaxed text-on-surface-variant">
                {L(entry.short, locale)}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Түгээмэл асуулт */}
      <Section id="faq" title={t("faqTitle")} className="overflow-hidden" bodyClassName="p-0">
        <div className="divide-y divide-outline-variant">
          {FAQ.map((id) => (
            <details key={id} id={`faq-${id}`} className="group scroll-mt-24">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-on-surface hover:bg-surface-container-low/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                {t(`faq.${id}.q`)}
                <Icon
                  name="expand_more"
                  className="size-4 text-on-surface-variant motion-safe:transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="px-5 pb-4 text-sm leading-relaxed text-on-surface-variant">
                {t(`faq.${id}.a`)}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* Судалгааны үндэслэл */}
      <Section id="methodology" title={t("methodology.title")}>
        <p className="text-sm leading-relaxed text-on-surface-variant">
          {t.rich("methodology.body", {
            strong: (chunks) => <strong className="font-semibold text-on-surface">{chunks}</strong>,
          })}
        </p>
        <p className="mt-3 text-xs text-on-surface-variant">{t("methodology.citation")}</p>
      </Section>

      {/* Disclaimer + холбоо барих */}
      <footer className="space-y-3 pb-6">
        {/* The emergency number sits in the app footer right below. */}
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-amber-950 ring-1 ring-amber-600/25">
          <Icon name="stethoscope" className="mt-0.5 size-4 text-amber-700" />
          <p className="text-sm leading-relaxed">{t("disclaimer")}</p>
        </div>
        <p className="text-xs text-on-surface-variant">
          {t.rich("contact", {
            link: (chunks) => (
              <Link href="/about" className="text-primary hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </footer>
    </div>
  );
}
