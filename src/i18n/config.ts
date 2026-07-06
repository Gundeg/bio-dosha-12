export const LOCALES = ["mn", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "mn";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}
