/**
 * Locale-aware date formatting that gives the same text on the server (Node)
 * and in every browser.
 *
 * `toLocaleDateString("mn-MN")` is not safe: Node ships Mongolian locale data
 * ("2026.10.23") but Chrome does not and falls back to US English
 * ("10/23/2026"). The difference caused React hydration errors (#418) and
 * showed English month names in the Mongolian UI. Mongolian dates are
 * therefore built from numeric parts here, and every date is read in the
 * clinic's time zone so the server and the browser agree on the day.
 */

export type DateStyle =
  | "numeric" //   mn 2026.10.23            en 23/10/2026
  | "monthDay" //  mn 10-р сарын 23         en 23 Oct
  | "monthDayLong" // mn 10-р сарын 23      en 23 October
  | "month" //     mn 10-р сар              en Oct
  | "day" //       mn 23                    en 23
  | "long"; //     mn 2026 оны 10-р сарын 23  en 23 October 2026

export const APP_TIME_ZONE = "Asia/Ulaanbaatar";

function parts(date: Date): { year: number; month: number; day: number } {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) => Number(p.find((x) => x.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

const EN_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  numeric: { day: "2-digit", month: "2-digit", year: "numeric" },
  monthDay: { day: "numeric", month: "short" },
  monthDayLong: { day: "numeric", month: "long" },
  month: { month: "short" },
  day: { day: "numeric" },
  long: { day: "numeric", month: "long", year: "numeric" },
};

export function formatDate(value: Date | string, locale: string, style: DateStyle = "numeric"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  if (locale === "en") {
    return date.toLocaleDateString("en-GB", { ...EN_OPTIONS[style], timeZone: APP_TIME_ZONE });
  }

  const { year, month, day } = parts(date);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  switch (style) {
    case "numeric":
      return `${year}.${mm}.${dd}`;
    case "monthDay":
    case "monthDayLong":
      return `${month}-р сарын ${day}`;
    case "month":
      return `${month}-р сар`;
    case "day":
      return String(day);
    case "long":
      return `${year} оны ${month}-р сарын ${day}`;
  }
}
