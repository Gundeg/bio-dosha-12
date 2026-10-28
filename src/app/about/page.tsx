import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { IconTile } from "@/components/kit/layout";
import { BrandMark } from "@/components/shell/BrandMark";
import { EmergencyNote } from "@/components/shell/EmergencyNote";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

/**
 * Public methodology page for patients and doctors. It explains what the BEDI
 * index looks at and what the results mean, in plain words. The formula, its
 * coefficients, thresholds and season factors are the author's method and are
 * deliberately not published here (see lessons.md).
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return { title: `${t("metaTitle")} | Bio-Dosha-12`, description: t("metaDescription") };
}

// Each dosha in its data colour, the same key as the result card (DoshaCard).
const DOSHAS = [
  { key: "khii", icon: "air", tile: "bg-primary/8 text-primary" },
  { key: "shar", icon: "local_fire_department", tile: "bg-secondary/8 text-secondary" },
  { key: "badgan", icon: "landscape", tile: "bg-tertiary/8 text-tertiary" },
] as const;

const INPUTS = [
  { key: "weight", icon: "monitor_weight" },
  { key: "height", icon: "height" },
  { key: "age", icon: "cake" },
  { key: "sex", icon: "wc" },
  { key: "season", icon: "partly_cloudy_day" },
  { key: "constitution", icon: "quiz" },
] as const;

const RESULTS = [
  { key: "balanced", dot: "bg-emerald-600" },
  { key: "khiiExcess", dot: "bg-primary" },
  { key: "sharBadganExcess", dot: "bg-amber-600" },
] as const;

const RECOMMENDATION_STEPS = ["group", "constitution", "age", "safety"] as const;

const LIMITS = ["diagnosis", "examination", "special", "inputs", "unwell"] as const;

const AUDIENCES = [
  { key: "individuals", icon: "person" },
  { key: "families", icon: "family_restroom" },
  { key: "clinics", icon: "local_hospital" },
] as const;

const PROTECTIONS = [
  { key: "encryption", icon: "lock" },
  { key: "mfa", icon: "phonelink_lock" },
  { key: "verified", icon: "verified" },
  { key: "audit", icon: "manage_search" },
  { key: "staff", icon: "visibility_off" },
  { key: "rights", icon: "download" },
] as const;

const CARD = "rounded-xl bg-surface-container-lowest shadow-ambient";
const TEXT_LINK =
  "rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="scroll-mt-20">
      <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight text-on-surface">
        {title}
      </h2>
      {intro && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-on-surface-variant">{intro}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function AboutPage() {
  const [t, tLegal] = await Promise.all([getTranslations("about"), getTranslations("legal")]);
  // A public page: if the session cannot be read, show the signed-out header.
  const session = await auth().catch(() => null);
  const signedIn = !!session?.user?.id;

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <BrandMark compact className="sm:hidden" />
          <BrandMark className="hidden sm:flex" />
          <div className="flex shrink-0 items-center gap-2">
            {signedIn ? (
              <ButtonLink href="/" size="lg">
                {t("header.openApp")}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="outline" size="lg">
                  {t("header.login")}
                </ButtonLink>
                <ButtonLink href="/register" size="lg" className="hidden sm:inline-flex">
                  {t("header.register")}
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-14 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        {/* Introduction */}
        <section aria-labelledby="about-title" className="max-w-3xl">
          <p className="mb-1 text-sm text-on-surface-variant">{t("eyebrow")}</p>
          <h1
            id="about-title"
            className="text-2xl font-semibold tracking-tight text-on-surface md:text-[28px] md:leading-9"
          >
            {t("title")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-on-surface">{t("lead")}</p>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{t("leadNote")}</p>
        </section>

        {/* The three dosha */}
        <Section id="dosha" title={t("dosha.title")} intro={t("dosha.intro")}>
          <div className="grid gap-4 md:grid-cols-3">
            {DOSHAS.map(({ key, icon, tile }) => (
              <div key={key} className={cn(CARD, "p-5")}>
                <div className="flex items-center gap-3">
                  <IconTile name={icon} className={tile} />
                  <h3 className="text-base font-semibold text-on-surface">{t(`dosha.${key}.name`)}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{t(`dosha.${key}.body`)}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 flex max-w-3xl gap-2.5 rounded-xl bg-primary/5 px-4 py-3 text-sm leading-relaxed text-on-surface">
            <Icon name="balance" className="mt-0.5 size-4 text-primary" />
            <span>{t("dosha.balance")}</span>
          </p>
        </Section>

        {/* What the BEDI index looks at */}
        <Section id="inputs" title={t("inputs.title")} intro={t("inputs.intro")}>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INPUTS.map(({ key, icon }) => (
              <li key={key} className={cn(CARD, "flex gap-3 p-4")}>
                <IconTile name={icon} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{t(`inputs.items.${key}.name`)}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-on-surface-variant">{t(`inputs.items.${key}.body`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-on-surface-variant">{t("inputs.method")}</p>
        </Section>

        {/* The three result groups */}
        <Section id="results" title={t("results.title")} intro={t("results.intro")}>
          <div className="grid gap-4 md:grid-cols-3">
            {RESULTS.map(({ key, dot }) => (
              <div key={key} className={cn(CARD, "p-5")}>
                <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
                  <span className={cn("size-2.5 shrink-0 rounded-full", dot)} aria-hidden="true" />
                  {t(`results.${key}.name`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{t(`results.${key}.body`)}</p>
                <p className="mt-3 border-t border-outline-variant pt-3 text-sm leading-relaxed text-on-surface">
                  {t(`results.${key}.focus`)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-on-surface-variant">{t("results.note")}</p>
        </Section>

        {/* How recommendations are formed */}
        <Section id="recommendations" title={t("recommendations.title")} intro={t("recommendations.intro")}>
          <ol className="grid gap-3 sm:grid-cols-2">
            {RECOMMENDATION_STEPS.map((key, index) => (
              <li key={key} className={cn(CARD, "flex gap-3 p-4")}>
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold tabular-nums text-on-primary"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed text-on-surface-variant">{t(`recommendations.steps.${key}`)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-on-surface-variant">{t("recommendations.note")}</p>
        </Section>

        {/* Limitations */}
        <Section id="limits" title={t("limits.title")}>
          <div className="rounded-xl bg-amber-50 p-5 ring-1 ring-amber-600/20">
            <ul className="space-y-2.5">
              {LIMITS.map((key) => (
                <li key={key} className="flex gap-2.5 text-sm leading-relaxed text-amber-950">
                  <Icon name="info" className="mt-0.5 size-4 text-amber-700" />
                  <span>{t(`limits.items.${key}`)}</span>
                </li>
              ))}
            </ul>
            <EmergencyNote className="mt-4 border-t border-amber-600/20 pt-4 text-sm text-amber-950" />
          </div>
        </Section>

        {/* Who it is for */}
        <Section id="audience" title={t("audience.title")}>
          <div className="grid gap-4 md:grid-cols-3">
            {AUDIENCES.map(({ key, icon }) => (
              <div key={key} className={cn(CARD, "p-5")}>
                <IconTile name={icon} tone="primary" />
                <h3 className="mt-3 text-base font-semibold text-on-surface">{t(`audience.${key}.name`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{t(`audience.${key}.body`)}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* How data is protected */}
        <Section id="security" title={t("security.title")} intro={t("security.intro")}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {PROTECTIONS.map(({ key, icon }) => (
              <li key={key} className={cn(CARD, "flex gap-3 p-4")}>
                <IconTile name={icon} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{t(`security.items.${key}.name`)}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-on-surface-variant">{t(`security.items.${key}.body`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-on-surface-variant">
            {t.rich("security.privacyLine", {
              link: (chunks) => (
                <Link href="/privacy" className={TEXT_LINK}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </Section>

        {/* Research basis */}
        <Section id="research" title={t("research.title")}>
          <p className="max-w-3xl text-sm leading-relaxed text-on-surface-variant">{t("research.body")}</p>
        </Section>

        {/* Call to action */}
        <section aria-labelledby="about-cta-title" className={cn(CARD, "px-5 py-10 text-center sm:px-10")}>
          <h2 id="about-cta-title" className="text-xl font-semibold tracking-tight text-on-surface">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant">{t("cta.body")}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {signedIn ? (
              <ButtonLink href="/" size="lg">
                {t("header.openApp")}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/register" size="lg">
                  {t("cta.register")}
                </ButtonLink>
                <ButtonLink href="/login" size="lg" variant="outline">
                  {t("header.login")}
                </ButtonLink>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant bg-surface-container-lowest px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-3 text-center">
          <p className="mx-auto max-w-2xl text-xs leading-relaxed text-on-surface-variant">{tLegal("disclaimer")}</p>
          <EmergencyNote className="justify-center" />
          <p className="text-xs text-on-surface-variant">
            <Link href="/" className={TEXT_LINK}>
              {t("footer.home")}
            </Link>
            {" · "}
            <Link href="/privacy" className={TEXT_LINK}>
              {tLegal("privacyLink")}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
