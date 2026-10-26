import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button-link";
import { EmergencyNote } from "@/components/shell/EmergencyNote";
import { cn } from "@/lib/utils";

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

const DOSHAS = [
  { key: "khii", icon: "air", tone: "bg-sky-50 text-sky-800 ring-sky-600/15" },
  { key: "shar", icon: "local_fire_department", tone: "bg-amber-50 text-amber-800 ring-amber-600/15" },
  { key: "badgan", icon: "landscape", tone: "bg-emerald-50 text-emerald-800 ring-emerald-600/15" },
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
  { key: "balanced", dot: "bg-emerald-600", ring: "ring-emerald-600/20" },
  { key: "khiiExcess", dot: "bg-sky-600", ring: "ring-sky-600/20" },
  { key: "sharBadganExcess", dot: "bg-amber-600", ring: "ring-amber-600/25" },
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
      <h2 id={`${id}-title`} className="font-headline text-xl font-bold text-on-surface sm:text-2xl">
        {title}
      </h2>
      {intro && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant sm:text-base">{intro}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("material-symbols-outlined shrink-0", className)} aria-hidden="true">
      {name}
    </span>
  );
}

/** An icon centred in a tinted square. The box does the layout, so it never depends on the icon font's own display rule. */
function IconBadge({ name, className, iconClassName }: { name: string; className?: string; iconClassName?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center", className)} aria-hidden="true">
      <span className={cn("material-symbols-outlined", iconClassName)}>{name}</span>
    </span>
  );
}

export default async function AboutPage() {
  const [t, tLegal] = await Promise.all([getTranslations("about"), getTranslations("legal")]);
  // A public page: if the session cannot be read, show the signed-out header.
  const session = await auth().catch(() => null);
  const signedIn = !!session?.user?.id;

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-surface-container-lowest/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary-container text-[11px] font-black text-on-primary"
            >
              BD
            </span>
            <span className="font-headline text-sm font-bold tracking-tight text-on-surface">Bio-Dosha-12</span>
          </Link>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <ButtonLink href="/" size="lg" className="px-3">
                {t("header.openApp")}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="outline" size="lg" className="px-3">
                  {t("header.login")}
                </ButtonLink>
                <ButtonLink href="/register" size="lg" className="hidden px-3 sm:inline-flex">
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
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{t("eyebrow")}</p>
          <h1 id="about-title" className="mt-2 font-headline text-3xl font-black leading-tight tracking-tight text-on-surface sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-on-surface-variant sm:text-lg">{t("lead")}</p>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{t("leadNote")}</p>
        </section>

        {/* The three dosha */}
        <Section id="dosha" title={t("dosha.title")} intro={t("dosha.intro")}>
          <div className="grid gap-4 md:grid-cols-3">
            {DOSHAS.map(({ key, icon, tone }) => (
              <div key={key} className="rounded-2xl bg-surface-container-lowest p-5 shadow-ambient ring-1 ring-outline-variant/20">
                <div className="flex items-center gap-3">
                  <IconBadge name={icon} className={cn("size-10 rounded-xl ring-1", tone)} iconClassName="text-[22px]" />
                  <h3 className="font-headline text-lg font-bold text-on-surface">{t(`dosha.${key}.name`)}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{t(`dosha.${key}.body`)}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-3xl rounded-xl bg-primary/5 px-4 py-3 text-sm leading-relaxed text-on-surface ring-1 ring-primary/15">
            <Icon name="balance" className="mr-1.5 align-[-4px] text-[18px] text-primary" />
            {t("dosha.balance")}
          </p>
        </Section>

        {/* What the BEDI index looks at */}
        <Section id="inputs" title={t("inputs.title")} intro={t("inputs.intro")}>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INPUTS.map(({ key, icon }) => (
              <li key={key} className="flex gap-3 rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/20">
                <IconBadge name={icon} className="size-9 rounded-xl bg-surface-container-low text-primary" iconClassName="text-[20px]" />
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
            {RESULTS.map(({ key, dot, ring }) => (
              <div key={key} className={cn("rounded-2xl bg-surface-container-lowest p-5 shadow-ambient ring-1", ring)}>
                <h3 className="flex items-center gap-2 font-headline text-base font-bold text-on-surface">
                  <span className={cn("size-2.5 shrink-0 rounded-full", dot)} aria-hidden="true" />
                  {t(`results.${key}.name`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{t(`results.${key}.body`)}</p>
                <p className="mt-3 border-t border-outline-variant/30 pt-3 text-sm leading-relaxed text-on-surface">
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
              <li key={key} className="flex gap-3 rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/20">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-on-surface-variant">{t(`recommendations.steps.${key}`)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-on-surface-variant">{t("recommendations.note")}</p>
        </Section>

        {/* Limitations */}
        <Section id="limits" title={t("limits.title")}>
          <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-600/20">
            <ul className="space-y-2.5">
              {LIMITS.map((key) => (
                <li key={key} className="flex gap-2.5 text-sm leading-relaxed text-amber-950">
                  <Icon name="info" className="mt-0.5 text-[18px] text-amber-700" />
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
              <div key={key} className="rounded-2xl bg-surface-container-lowest p-5 shadow-ambient ring-1 ring-outline-variant/20">
                <IconBadge name={icon} className="size-10 rounded-xl bg-primary/10 text-primary" iconClassName="text-[22px]" />
                <h3 className="mt-3 font-headline text-base font-bold text-on-surface">{t(`audience.${key}.name`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{t(`audience.${key}.body`)}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* How data is protected */}
        <Section id="security" title={t("security.title")} intro={t("security.intro")}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {PROTECTIONS.map(({ key, icon }) => (
              <li key={key} className="flex gap-3 rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/20">
                <IconBadge name={icon} className="size-9 rounded-xl bg-surface-container-low text-primary" iconClassName="text-[20px]" />
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
                <Link href="/privacy" className="font-semibold text-primary underline-offset-2 hover:underline">
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
        <section
          aria-labelledby="about-cta-title"
          className="rounded-3xl bg-linear-to-br from-primary to-primary-container px-6 py-10 text-center text-on-primary sm:px-10"
        >
          <h2 id="about-cta-title" className="font-headline text-2xl font-bold">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-on-primary-container">{t("cta.body")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {signedIn ? (
              <ButtonLink href="/" size="lg" className="bg-surface-container-lowest px-4 text-primary hover:bg-surface-container-low">
                {t("header.openApp")}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/register" size="lg" className="bg-surface-container-lowest px-4 text-primary hover:bg-surface-container-low">
                  {t("cta.register")}
                </ButtonLink>
                <ButtonLink
                  href="/login"
                  size="lg"
                  variant="outline"
                  className="border-on-primary/40 bg-transparent px-4 text-on-primary hover:bg-on-primary/10 hover:text-on-primary"
                >
                  {t("header.login")}
                </ButtonLink>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant/20 bg-surface-container-lowest px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-3 text-center">
          <p className="mx-auto max-w-2xl text-xs leading-relaxed text-on-surface-variant">{tLegal("disclaimer")}</p>
          <EmergencyNote className="justify-center" />
          <p className="text-xs text-on-surface-variant">
            <Link href="/" className="font-medium text-primary hover:underline">
              {t("footer.home")}
            </Link>
            {" · "}
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              {tLegal("privacyLink")}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
