"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/config";

function persistLocale(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Хэл солигч — cookie бичээд серверийн орчуулгыг шинэчилнэ.
 * ProfileSheet болон Sidebar-т ашиглагдана.
 */
export function LocaleToggle({ className = "" }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("locale");

  function setLocale(next: Locale) {
    if (next === locale) return;
    persistLocale(next);
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={`inline-flex rounded-lg border border-outline-variant/30 p-0.5 ${className}`}
    >
      {LOCALES.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={locale === value}
          onClick={() => setLocale(value)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            locale === value
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {value === "mn" ? "МН" : "EN"}
        </button>
      ))}
    </div>
  );
}
