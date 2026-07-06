import type { Locale } from "@/i18n/config";

export interface Bilingual {
  mn: string;
  en: string;
}

/**
 * Домэйн өгөгдлийн ({mn, en} хэлбэрийн) хоёр хэлт талбараас идэвхтэй
 * хэлний утгыг авна. Орчуулга дутуу бол монгол руу унана.
 */
export function L(value: Bilingual | string, locale: Locale | string): string {
  if (typeof value === "string") return value;
  return (locale === "en" ? value.en : value.mn) || value.mn;
}
