"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** The active language and a setter that stores it and re-renders the server text. */
export function useLocaleSwitch() {
  const router = useRouter();
  const locale = useLocale() as Locale;
  function setLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }
  return { locale, setLocale };
}

export const LOCALE_LABEL: Record<Locale, string> = { mn: "МН", en: "EN" };

/** Two-option language switch (sign-in pages and the phone menu). */
export function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocaleSwitch();
  const t = useTranslations("locale");

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cn("inline-flex rounded-lg bg-surface-container p-0.5", className)}
    >
      {LOCALES.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={locale === value}
          onClick={() => setLocale(value)}
          className={cn(
            "h-8 min-w-10 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary",
            locale === value
              ? "bg-surface-container-lowest text-primary shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          {LOCALE_LABEL[value]}
        </button>
      ))}
    </div>
  );
}
