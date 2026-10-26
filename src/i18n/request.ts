import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

/**
 * Page and content namespaces, one file per namespace and locale:
 * messages/<locale>/<namespace>.json. Core chrome (common, nav, auth, legal,
 * locale) stays in messages/<locale>.json. Splitting keeps each file small
 * enough to review and lets pages be translated independently.
 */
export const NAMESPACES = [
  "shared",
  "dosha",
  "questionnaire",
  "questionHelp",
  "landing",
  "help",
  "calculator",
  "dashboard",
  "history",
  "recommendations",
  "family",
  "remedy",
  "states",
  "patients",
  "reports",
  "admin",
  "clinical",
  // Platform: organizations, accounts, control center
  "errors",
  "kit",
  "authFlows",
  "settings",
  "org",
  "about",
] as const;

export async function loadMessages(locale: Locale) {
  const core = (await import(`../../messages/${locale}.json`)).default;
  const pages = await Promise.all(
    NAMESPACES.map(async (ns) => [ns, (await import(`../../messages/${locale}/${ns}.json`)).default] as const)
  );
  return { ...core, ...Object.fromEntries(pages) };
}

/**
 * Cookie-д суурилсан локал (URL prefix-гүй): апп SEO-д тулгуурладаггүй тул
 * маршрутын бүтцийг өөрчлөхгүйгээр хэлийг хэрэглэгчийн сонголтоор шийднэ.
 */
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
