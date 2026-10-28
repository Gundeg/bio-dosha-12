import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { IconTile } from "@/components/kit/layout";
import { BrandMark } from "@/components/shell/BrandMark";
import { EmergencyNote } from "@/components/shell/EmergencyNote";
import { ButtonLink } from "@/components/ui/button-link";
import { Icon, type IconName } from "@/components/ui/icon";
import type { DoshaKey } from "@/lib/ktMapping";
import { cn } from "@/lib/utils";

const DOSHA_TYPES: { key: DoshaKey; kt: string }[] = [
  { key: "Khii", kt: "0.70" },
  { key: "Khii_Shar", kt: "0.80" },
  { key: "Khii_Badgan", kt: "0.85" },
  { key: "Shar_Khii", kt: "0.90" },
  { key: "Shar", kt: "1.00" },
  { key: "Tentsveertei", kt: "1.00" },
  { key: "Shar_Badgan", kt: "1.10" },
  { key: "Badgan_Khii", kt: "1.25" },
  { key: "Badgan_Shar", kt: "1.35" },
  { key: "Badgan", kt: "1.50" },
];

/** The leading dosha's colour, the same key as the result card (DoshaCard). */
function doshaDot(key: DoshaKey): string {
  if (key === "Tentsveertei") return "bg-emerald-600";
  if (key.startsWith("Khii")) return "bg-primary";
  if (key.startsWith("Shar")) return "bg-secondary";
  return "bg-tertiary";
}

const STEPS = [
  { id: "s1", icon: "quiz" },
  { id: "s2", icon: "calculate" },
  { id: "s3", icon: "spa" },
] as const satisfies readonly { id: string; icon: IconName }[];

const STATS = [
  { value: "10", key: "constitutionTypes" },
  { value: "12", key: "questions" },
  { value: "4", key: "seasonFactors" },
  { value: "Δ", key: "deviation" },
] as const;

const AUDIENCES = [
  { id: "individual", icon: "person" },
  { id: "practitioner", icon: "local_hospital" },
] as const satisfies readonly { id: string; icon: IconName }[];

const TEXT_LINK =
  "rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function SectionHeading({ id, title, subtitle }: { id: string; title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 id={id} className="text-xl font-semibold tracking-tight text-on-surface">
        {title}
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
    </div>
  );
}

export default async function LandingPage() {
  const [t, tLegal, tDosha, tCommon] = await Promise.all([
    getTranslations("landing"),
    getTranslations("legal"),
    getTranslations("dosha"),
    getTranslations("common"),
  ]);

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <BrandMark compact className="sm:hidden" />
          <BrandMark className="hidden sm:flex" />
          <div className="flex shrink-0 items-center gap-2">
            <ButtonLink href="/about" variant="ghost" className="hidden sm:inline-flex">
              {t("header.about")}
            </ButtonLink>
            <ButtonLink href="/login" variant="outline">
              {t("header.login")}
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-4 pb-16 sm:space-y-20 sm:px-6">
        {/* Hero: the product, what it does, and the two ways in. */}
        <section aria-labelledby="landing-title" className="pt-14 text-center sm:pt-20">
          <div className="mx-auto max-w-2xl">
            <h1 id="landing-title" className="text-3xl font-semibold tracking-tight text-on-surface sm:text-4xl">
              {tCommon("appName")}
            </h1>
            <p className="mt-3 text-lg font-medium text-on-surface sm:text-xl">
              {t("hero.titleLine1")} {t("hero.titleLine2")}
            </p>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-on-surface-variant">{t("hero.lead")}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink size="lg" href="/register">
                {t("header.register")}
              </ButtonLink>
              <ButtonLink size="lg" variant="outline" href="/login">
                {t("hero.ctaLogin")}
              </ButtonLink>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-on-surface-variant">
              {t.rich("hero.clinicLine", {
                link: (chunks) => (
                  <Link href="/register" className={TEXT_LINK}>
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-outline-variant shadow-ambient md:grid-cols-4">
            {STATS.map(({ value, key }) => (
              <div key={key} className="flex flex-col-reverse gap-1 bg-surface-container-lowest p-5">
                <dt className="text-sm text-on-surface-variant">{t(`stats.${key}`)}</dt>
                <dd className="text-2xl font-semibold tabular-nums text-on-surface">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* How it works */}
        <section aria-labelledby="landing-steps">
          <SectionHeading id="landing-steps" title={t("steps.title")} subtitle={t("steps.subtitle")} />
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map(({ id, icon }, index) => (
              <li key={id} className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient">
                <div className="flex items-center justify-between gap-3">
                  <IconTile name={icon} tone="primary" />
                  <span className="text-xs text-on-surface-variant">{t(`steps.${id}.tag`)}</span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-on-surface">
                  <span className="tabular-nums text-on-surface-variant">{index + 1}.</span> {t(`steps.${id}.title`)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{t(`steps.${id}.desc`)}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* The ten constitution types */}
        <section aria-labelledby="landing-types">
          <SectionHeading id="landing-types" title={t("types.title")} subtitle={t("types.subtitle")} />
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {DOSHA_TYPES.map(({ key, kt }) => (
              <li key={key} className="min-w-0 rounded-xl bg-surface-container-lowest p-4 shadow-ambient">
                <p className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", doshaDot(key))} />
                  <span className="min-w-0 break-words">{tDosha(`${key}.label`)}</span>
                </p>
                <p className="mt-1.5 text-xs tabular-nums text-on-surface-variant">Kt {kt}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{t(`types.desc.${key}`)}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Who it is for */}
        <section aria-labelledby="landing-audience">
          <SectionHeading id="landing-audience" title={t("audience.title")} subtitle={t("audience.subtitle")} />
          <div className="grid gap-4 md:grid-cols-2">
            {AUDIENCES.map(({ id, icon }) => (
              <article key={id} className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient sm:p-6">
                <div className="flex items-start gap-3">
                  <IconTile name={icon} tone="primary" />
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-on-surface">{t(`audience.${id}.title`)}</h3>
                    <p className="mt-0.5 text-sm text-on-surface-variant">{t(`audience.${id}.subtitle`)}</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {(t.raw(`audience.${id}.features`) as string[]).map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-on-surface">
                      <Icon name="check" className="mt-0.5 size-4 text-emerald-700" />
                      <span className="min-w-0">{feature}</span>
                    </li>
                  ))}
                </ul>
                {id === "practitioner" && (
                  <div className="mt-5 space-y-3 border-t border-outline-variant pt-4">
                    <p className="text-xs leading-relaxed text-on-surface-variant">{t("audience.practitioner.note")}</p>
                    <ButtonLink href="/register?type=organization" variant="outline">
                      {t("audience.practitioner.cta")}
                    </ButtonLink>
                  </div>
                )}
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm text-on-surface-variant">
            {t.rich("audience.aboutLine", {
              link: (chunks) => (
                <Link href="/about" className={TEXT_LINK}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>

        {/* Closing call to action */}
        <section
          aria-labelledby="landing-cta"
          className="rounded-xl bg-surface-container-lowest px-5 py-10 text-center shadow-ambient sm:px-10"
        >
          <h2 id="landing-cta" className="text-xl font-semibold tracking-tight text-on-surface">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant">{t("cta.body")}</p>
          <ButtonLink size="lg" href="/register" className="mt-6">
            {t("header.register")}
          </ButtonLink>
        </section>
      </main>

      <footer className="border-t border-outline-variant bg-surface-container-lowest px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-3 text-center">
          <p className="mx-auto max-w-2xl text-xs leading-relaxed text-on-surface-variant">{tLegal("disclaimer")}</p>
          <EmergencyNote className="justify-center" />
          <p className="text-sm text-on-surface-variant">
            {t("footer.credit")}{" "}
            <Link href="/about" className={TEXT_LINK}>
              {t("header.about")}
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
