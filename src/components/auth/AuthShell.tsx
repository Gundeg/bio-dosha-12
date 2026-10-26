"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LocaleToggle } from "@/components/LocaleToggle";
import { cn } from "@/lib/utils";

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
  /** Material Symbols name shown above the title. */
  icon?: string;
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
            className="flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
          >
            <BrandMark className="size-9" />
            <span className="font-headline text-base font-bold text-on-surface">{tCommon("appName")}</span>
          </Link>
          <LocaleToggle className="bg-surface-container-lowest *:min-h-11 *:min-w-11" />
        </header>

        <main className="flex flex-1 justify-center px-4 pb-8 pt-4 sm:items-center sm:px-6 sm:py-10">
          <div className={cn("w-full", width === "wide" ? "max-w-xl" : "max-w-md")}>
            <section
              aria-labelledby={titleId}
              className="rounded-2xl bg-surface-container-lowest p-5 shadow-ambient ring-1 ring-outline-variant/25 sm:p-8 print:p-0 print:shadow-none print:ring-0"
            >
              {icon && (
                <span
                  className="material-symbols-outlined mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-[26px] text-primary print:hidden"
                  aria-hidden="true"
                >
                  {icon}
                </span>
              )}
              {eyebrow && (
                <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-primary print:hidden">{eyebrow}</p>
              )}
              <h1
                id={titleId}
                ref={titleRef}
                tabIndex={-1}
                className="font-headline text-2xl font-bold leading-tight text-on-surface outline-none sm:text-[1.75rem] print:hidden"
              >
                {title}
              </h1>
              {description && (
                <div className="mt-2 text-sm leading-relaxed text-on-surface-variant print:hidden">{description}</div>
              )}
              <div className="mt-6 print:mt-0">{children}</div>
            </section>

            {footer && <div className="mt-6 text-center text-sm text-on-surface-variant print:hidden">{footer}</div>}

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-on-surface-variant lg:hidden print:hidden">
              <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
                lock
              </span>
              {t("mobileTrust")}
            </p>
          </div>
        </main>

        <footer className="px-4 pb-6 print:hidden">
          <nav aria-label={t("footerLabel")} className="flex flex-wrap items-center justify-center gap-x-2 text-sm">
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center rounded-md px-2 text-on-surface-variant hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              {t("privacy")}
            </Link>
            <span aria-hidden="true" className="text-outline-variant">
              ·
            </span>
            <Link
              href="/about"
              className="inline-flex min-h-11 items-center rounded-md px-2 text-on-surface-variant hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              {t("about")}
            </Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary", className)}
    >
      <span className="material-symbols-outlined icon-filled text-[20px]">spa</span>
    </span>
  );
}

/**
 * Desktop-only panel. Text sits on solid primary (or the faint shapes) at 90%+
 * white, which keeps every line above 4.5:1 contrast.
 */
function BrandPanel() {
  const t = useTranslations("authFlows.shell");
  const tCommon = useTranslations("common");
  return (
    <aside className="relative hidden w-[42%] max-w-2xl shrink-0 overflow-hidden bg-primary text-on-primary lg:flex print:hidden">
      <span aria-hidden="true" className="absolute -right-28 -top-28 size-80 rounded-full bg-primary-container/50" />
      <span aria-hidden="true" className="absolute -bottom-36 -right-20 size-96 rounded-full bg-white/5" />

      <div className="relative flex w-full flex-col justify-between gap-12 p-10 xl:p-14">
        <Link
          href="/"
          className="flex items-center gap-3 self-start rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <span
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"
          >
            <span className="material-symbols-outlined icon-filled text-[26px]">spa</span>
          </span>
          <span>
            <span className="block font-headline text-xl font-bold">{tCommon("appName")}</span>
            <span className="block text-sm text-on-primary/90">{tCommon("brandTagline")}</span>
          </span>
        </Link>

        <div className="max-w-md">
          <h2 className="font-headline text-3xl font-bold leading-tight">{t("trustTitle")}</h2>
          <ul className="mt-8 space-y-6">
            {TRUST_POINTS.map(({ key, icon }) => (
              <li key={key} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/12 text-[22px]"
                >
                  {icon}
                </span>
                <div>
                  <p className="font-semibold">{t(`trust.${key}.title`)}</p>
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
