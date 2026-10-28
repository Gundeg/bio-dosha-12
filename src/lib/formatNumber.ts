/**
 * Number formatting that gives the same text on the server and in every
 * browser (Chrome has no Mongolian number data, so both locales use
 * comma-grouped digits).
 */

const GROUPED = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return GROUPED.format(value);
}

/** Monthly price in tugrik, e.g. "49,000₮". Null means free or by agreement. */
export function formatMnt(value: number | null | undefined): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return `${GROUPED.format(value)}₮`;
}
