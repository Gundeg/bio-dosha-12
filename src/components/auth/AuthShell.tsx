"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LocaleToggle } from "@/components/LocaleToggle";
import { IconTile } from "@/components/kit/layout";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";

const TRUST_POINTS = [
  { key: "encrypted", icon: "lock" },
  { key: "mfa", icon: "phonelink_lock" },
  { key: "verified", icon: "verified" },
] as const;

/**
 * Frame for every sign-in page: a calm brand panel with the data-protection
 * promises on desktop, and a single card on phones. The card holds one step
 * at a time; its title is the page's only <h1>.
 *
 * `focusKey`: when it changes to a non-empty value (e.g. the next step of a
 * wizard), the title receives focus so screen readers announce the new step.
 * Leave it empty for steps whose first field takes focus itself.
 */
export function AuthShell({
  title,
  description,
  eyebrow,
  icon,
  children,
  footer,
  width = "default",
  focusKey,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  /** Icon shown above the title (src/components/ui/icon.tsx). */
  icon?: IconName;
  children: React.ReactNode;
  /** Shown under the card, e.g. "Don't have an account? Create one". */
  footer?: React.ReactNode;
  width?: "default" | "wide";
  focusKey?: string;
}) {
  const t = useTranslations("authFlows.shell");
  const tCommon = useTranslations("common");
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusKey) titleRef.current?.focus();
  }, [focusKey]);

  return (
    <div className="flex min-h-screen w-full bg-surface">
      <BrandPanel />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 px-4 pt-3 sm:px-6 lg:justify-end print:hidden">
          <Link
            href="/"
            aria-label={t("home")}
            className="flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
          >
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary"
            >
              <Icon name="spa" className="size-[18px]" />
            </span>
            <span className="text-[15px] font-semibold leading-tight text-on-surface">{tCommon("appName")}</span>
          </Link>
          <LocaleToggle className="*:min-h-11 *:min-w-11" />
        </header>

        <main className="flex flex-1 justify-center px-4 pb-8 pt-4 sm:items-center sm:px-6 sm:py-10">
          <div className={cn("w-full min-w-0", width === "wide" ? "max-w-xl" : "max-w-md")}>
            <section
              aria-labelledby={titleId}
              className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient sm:p-8 print:p-0 print:shadow-none"
            >
              {icon && <IconTile name={icon} tone="primary" size="lg" className="mb-4 print:hidden" />}
              {eyebrow && <p className="mb-1 text-sm text-on-surface-variant print:hidden">{eyebrow}</p>}
              <h1
                id={titleId}
                ref={titleRef}
                tabIndex={-1}
                className="text-2xl font-semibold tracking-tight text-on-surface outline-none md:text-[28px] md:leading-9 print:hidden"
              >
                {title}
              </h1>
              {description && (
                <div className="mt-2 text-sm leading-relaxed text-on-surface-variant print:hidden">{description}</div>
              )}
              <div className="mt-6 print:mt-0">{children}</div>
            </section>

            {footer && <div className="mt-6 text-center text-sm text-on-surface-variant print:hidden">{footer}</div>}

            <p className="mx-auto mt-6 flex w-fit max-w-xs items-start gap-1.5 text-xs text-on-surface-variant lg:hidden print:hidden">
              <Icon name="lock" className="mt-px size-3.5" />
              <span>{t("mobileTrust")}</span>
            </p>
          </div>
        </main>

        <footer className="px-4 pb-6 print:hidden">
          <nav aria-label={t("footerLabel")} className="flex flex-wrap items-center justify-center gap-x-2 text-sm">
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center rounded-lg px-2 text-on-surface-variant hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              {t("privacy")}
            </Link>
            <span aria-hidden="true" className="text-outline-variant">
              ·
            </span>
            <Link
              href="/about"
              className="inline-flex min-h-11 items-center rounded-lg px-2 text-on-surface-variant hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              {t("about")}
            </Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}

/**
 * Desktop-only panel on solid primary. Text is white at 90%+ opacity, which
 * keeps every line above 4.5:1 contrast. Icons sit centred in equal tiles.
 */
function BrandPanel() {
  const t = useTranslations("authFlows.shell");
  const tCommon = useTranslations("common");
  return (
    <aside className="hidden w-[42%] max-w-2xl shrink-0 bg-primary text-on-primary lg:flex print:hidden">
      <div className="flex w-full flex-col justify-between gap-12 p-10 xl:p-14">
        <Link
          href="/"
          className="flex items-center gap-2.5 self-start rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-primary"
        >
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-on-primary/10 text-on-primary"
          >
            <Icon name="spa" className="size-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold leading-tight">{tCommon("appName")}</span>
            <span className="block text-xs leading-snug text-on-primary/90">{tCommon("brandTagline")}</span>
          </span>
        </Link>

        <div className="max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight">{t("trustTitle")}</h2>
          <ul className="mt-8 space-y-6">
            {TRUST_POINTS.map(({ key, icon }) => (
              <li key={key} className="flex items-start gap-4">
                <IconTile name={icon} className="bg-on-primary/10 text-on-primary" />
                <div className="min-w-0 pt-1.5">
                  <p className="text-base font-semibold leading-6">{t(`trust.${key}.title`)}</p>
                  <p className="mt-1 text-sm leading-relaxed text-on-primary/90">{t(`trust.${key}.body`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="max-w-md text-xs leading-relaxed text-on-primary/90">{t("panelFootnote")}</p>
      </div>
    </aside>
  );
}
