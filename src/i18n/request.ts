import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./config";

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
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
