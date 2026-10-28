"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/formatDate";
import { formatNumber } from "@/lib/formatNumber";

export interface DailyPoint {
  day: string;
  signups: number;
  calculations: number;
}

/*
 * Series colors are the chart tokens of globals.css. Tailwind's `@theme inline`
 * does not emit them as runtime CSS variables, so the token value is repeated
 * as the var() fallback; the chart picks up the token once it is emitted.
 */
const SIGNUPS = "var(--color-chart-1, #00626b)";
const CALCULATIONS = "var(--color-chart-3, #fe932c)";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string; name?: string; dataKey?: string | number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-on-surface">{label}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="flex items-center gap-2 text-on-surface-variant">
          <span
            className="inline-block h-0.5 w-3 rounded-full"
            style={{ background: entry.dataKey === "signups" ? SIGNUPS : CALCULATIONS }}
            aria-hidden="true"
          />
          {entry.name}: <span className="font-semibold tabular-nums text-on-surface">{formatNumber(Number(entry.value))}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * Sign-ups and BEDI calculations per day. Screen readers get a summary (the
 * chart is one image) and the full numbers in a visually hidden table.
 */
export function ActivityChart({ series }: { series: DailyPoint[] }) {
  const t = useTranslations("admin");
  const locale = useLocale();

  const totals = series.reduce(
    (acc, p) => ({ signups: acc.signups + p.signups, calculations: acc.calculations + p.calculations }),
    { signups: 0, calculations: 0 }
  );
  const busiest = series.reduce<DailyPoint | null>((best, p) => (p.calculations > (best?.calculations ?? 0) ? p : best), null);
  const summary = [
    t("overview.chart.summary", { signups: totals.signups, calculations: totals.calculations }),
    busiest ? t("overview.chart.busiest", { date: formatDate(busiest.day, locale, "long"), count: busiest.calculations }) : null,
  ]
    .filter(Boolean)
    .join(" ");
  const data = series.map((p) => ({ ...p, label: formatDate(p.day, locale, "monthDay") }));

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-on-surface-variant" aria-hidden="true">
        <li className="flex items-center gap-2">
          <svg width="18" height="6" className="shrink-0">
            <line x1="0" y1="3" x2="18" y2="3" stroke={SIGNUPS} strokeWidth="2.5" />
          </svg>
          {t("overview.chart.signups")} · <span className="font-semibold tabular-nums text-on-surface">{formatNumber(totals.signups)}</span>
        </li>
        <li className="flex items-center gap-2">
          <svg width="18" height="6" className="shrink-0">
            <line x1="0" y1="3" x2="18" y2="3" stroke={CALCULATIONS} strokeWidth="2.5" strokeDasharray="5 3" />
          </svg>
          {t("overview.chart.calculations")} ·{" "}
          <span className="font-semibold tabular-nums text-on-surface">{formatNumber(totals.calculations)}</span>
        </li>
      </ul>

      <div role="img" aria-label={summary} className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} accessibilityLayer={false}>
            <defs>
              <linearGradient id="admin-signups-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SIGNUPS} stopOpacity={0.18} />
                <stop offset="95%" stopColor={SIGNUPS} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="admin-calculations-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CALCULATIONS} stopOpacity={0.16} />
                <stop offset="95%" stopColor={CALCULATIONS} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-container)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="signups"
              name={t("overview.chart.signups")}
              stroke={SIGNUPS}
              strokeWidth={2.5}
              fill="url(#admin-signups-fill)"
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="calculations"
              name={t("overview.chart.calculations")}
              stroke={CALCULATIONS}
              strokeWidth={2.5}
              strokeDasharray="6 3"
              fill="url(#admin-calculations-fill)"
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>{t("overview.chart.tableCaption")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("overview.chart.date")}</th>
            <th scope="col">{t("overview.chart.signups")}</th>
            <th scope="col">{t("overview.chart.calculations")}</th>
          </tr>
        </thead>
        <tbody>
          {series.map((p) => (
            <tr key={p.day}>
              <th scope="row">{formatDate(p.day, locale, "long")}</th>
              <td>{p.signups}</td>
              <td>{p.calculations}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
