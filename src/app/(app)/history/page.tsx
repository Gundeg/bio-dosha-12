"use client";

import { useCallback, useEffect, useState } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/formatDate";
import { apiFetch, ApiError } from "@/lib/api";
import { EmptyState, ErrorState, PageLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { FilterTabs } from "@/components/kit/DataTable";
import { PageHeader, Section, StatCard } from "@/components/kit/layout";
import { BEDI_THRESHOLDS } from "@/lib/bediConfig";
import { fullName } from "@/lib/person";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";

interface Profile {
  id: string;
  name: string;
  lastName?: string | null;
  relationship: string;
}

interface BEDIRecord {
  id: string;
  date: string;
  bedi: number;
  deviation: number;
  status: string;
  weightKg: number;
  season: string;
  notes: string | null;
}

const STATUS_CONFIG = {
  khii_excess:        { bg: "bg-primary/10",   text: "text-primary"     },
  balanced:           { bg: "bg-emerald-50",   text: "text-emerald-700" },
  shar_badgan_excess: { bg: "bg-secondary/10", text: "text-secondary"   },
};

// Chart colours are the theme tokens (SVG attributes need literal values).
const CHART = {
  primary: "#00626b",
  secondary: "#904d00",
  grid: "#e6eced", // surface-container
  zero: "#d2dbdc", // outline-variant
  tick: "#52626a", // on-surface-variant
};

const fmtSigned = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}`;
const BAND_LOW = BEDI_THRESHOLDS.khiiBelow;
const BAND_HIGH = BEDI_THRESHOLDS.sharBadganAbove;

const SEASON_ICON: Record<string, IconName> = {
  WINTER: "season_winter", SPRING: "season_spring", SUMMER: "season_summer", AUTUMN: "season_autumn",
};

// Custom tooltip component for the chart
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; payload?: { status?: string } }>;
  label?: string;
}) {
  const t = useTranslations("history.chart");
  const tShared = useTranslations("shared");
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value as number;
  // Colour and label follow the stored status, never a hard-coded threshold.
  const status = payload[0]?.payload?.status;
  const sc = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  return (
    <div className="rounded-xl bg-surface-container-lowest px-3.5 py-2.5 text-sm shadow-lg">
      <p className="mb-1 text-xs text-on-surface-variant">{label}</p>
      <p className={cn("text-lg font-semibold tabular-nums", sc?.text ?? "text-on-surface")}>
        {val >= 0 ? "+" : ""}{val.toFixed(2)}
      </p>
      <p className="mt-0.5 text-xs text-on-surface-variant">
        {t("tooltipDeviation")}{sc ? ` · ${tShared(`status.${status}`)}` : ""}
      </p>
    </div>
  );
}

export default function HistoryPage() {
  const t = useTranslations("history");
  const tShared = useTranslations("shared");
  const locale = useLocale();
  const statusLabel = (status: string) =>
    tShared.has(`status.${status}`) ? tShared(`status.${status}`) : status;
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [records, setRecords] = useState<BEDIRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProfiles = useCallback(() => {
    apiFetch<Profile[]>("/api/profiles")
      .then((data) => {
        if (!Array.isArray(data)) return;
        setLoadError(null);
        setProfiles(data);
        if (data.length > 0) setSelectedId(data[0].id);
        else setRecords([]);
      })
      .catch((err) => {
        // An empty message lets ErrorState show its translated default text.
        setLoadError(err instanceof ApiError ? err.message : "");
      });
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Bumped by "retry" to reload the selected profile's records.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!selectedId) return;
    // Ignore responses for a profile the user has already switched away from.
    let cancelled = false;
    apiFetch<BEDIRecord[]>(`/api/bedi?profileId=${selectedId}`)
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        setLoadError(null);
        setRecords(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, reloadKey]);

  function selectProfile(id: string) {
    if (id === selectedId) return;
    setRecords(null); // never show the previous profile's rows under the new name
    setSelectedId(id);
  }

  const retry = useCallback(() => {
    setLoadError(null);
    if (profiles.length === 0) loadProfiles();
    else setReloadKey((k) => k + 1);
  }, [profiles.length, loadProfiles]);

  const chartData = [...(records ?? [])]
    .reverse()
    .map((r) => ({
      date: formatDate(r.date, locale, "monthDay"),
      deviation: r.deviation,
      status: r.status,
      bedi: r.bedi,
      weight: r.weightKg,
      season: tShared(`season.${r.season}`),
    }));

  function exportCSV() {
    const header = [t("csv.date"), "BEDI", t("csv.deviation"), t("csv.weight"), t("csv.season"), t("csv.status")].join(",") + "\n";
    const rows = (records ?? []).map((r) =>
      `${formatDate(r.date, locale)},${r.bedi},${r.deviation},${r.weightKg},${tShared(`season.${r.season}`)},${statusLabel(r.status)}`
    ).join("\n");
    // Leading BOM so Excel opens the Cyrillic text correctly.
    const blob = new Blob(["﻿" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bedi-history.csv";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Trend summary
  const trend = records && records.length >= 2
    ? records[0].deviation - records[records.length - 1].deviation
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button variant="outline" onClick={exportCSV} disabled={(records?.length ?? 0) === 0}>
            <Icon name="download" className="size-4" />
            {t("exportCsv")}
          </Button>
        }
      />

      {profiles.length > 1 && (
        <FilterTabs
          label={t("profilesLabel")}
          value={selectedId}
          onChange={selectProfile}
          options={profiles.map((p) => ({ value: p.id, label: fullName(p) }))}
        />
      )}

      {loadError !== null ? (
        <ErrorState message={loadError} onRetry={retry} />
      ) : records === null ? (
        <PageLoading />
      ) : records.length === 0 ? (
        <EmptyState icon="trending_up" title={t("emptyTitle")} body={t("emptyBody")} />
      ) : (
        <>
          {/* ── Summary stats ── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label={t("stats.total")} value={records.length} hint={t("stats.totalUnit")} />
            <StatCard
              label={t("stats.latestDeviation")}
              value={
                <span className={STATUS_CONFIG[records[0].status as keyof typeof STATUS_CONFIG]?.text}>
                  {records[0].deviation >= 0 ? "+" : ""}{records[0].deviation.toFixed(2)}
                </span>
              }
              hint="Δ"
            />
            <StatCard label={t("stats.latestBedi")} value={records[0].bedi.toFixed(2)} hint={t("stats.indexUnit")} />
            <StatCard
              label={t("stats.trend")}
              // A change in Δ is not a status, so it is shown without status colours.
              value={trend !== null ? `${trend >= 0 ? "+" : ""}${trend.toFixed(2)}` : "—"}
              hint={trend === null ? undefined : trend > 0 ? t("stats.trendUp") : trend < 0 ? t("stats.trendDown") : t("stats.trendFlat")}
            />
          </div>

          {/* ── Deviation chart ── */}
          <Section
            id="history-chart"
            title={t("chart.title")}
            description={t("chart.subtitle")}
            actions={
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-3 rounded-full bg-secondary" aria-hidden="true" />
                  {t("chart.legendSharBadgan")} (&gt;{fmtSigned(BAND_HIGH)})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-3 rounded-full bg-primary" aria-hidden="true" />
                  {t("chart.legendKhii")} (&lt;{fmtSigned(BAND_LOW)})
                </span>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART.tick }} axisLine={false} tickLine={false} />
                {/* Grows beyond ±1 so large deviations are never clipped off the chart */}
                <YAxis
                  domain={[
                    (dataMin: number) => Math.min(-1, Math.floor(dataMin * 10) / 10),
                    (dataMax: number) => Math.max(1, Math.ceil(dataMax * 10) / 10),
                  ]}
                  tick={{ fontSize: 11, fill: CHART.tick }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke={CHART.zero} strokeWidth={1} />
                <ReferenceLine y={BAND_HIGH} stroke={CHART.secondary} strokeDasharray="4 4" strokeOpacity={0.6}
                  label={{ value: fmtSigned(BAND_HIGH), fontSize: 10, fill: CHART.secondary, position: "right" }} />
                <ReferenceLine y={BAND_LOW} stroke={CHART.primary} strokeDasharray="4 4" strokeOpacity={0.6}
                  label={{ value: fmtSigned(BAND_LOW), fontSize: 10, fill: CHART.primary, position: "right" }} />
                <Area
                  type="monotone"
                  dataKey="deviation"
                  stroke={CHART.primary}
                  strokeWidth={2}
                  fill={CHART.primary}
                  fillOpacity={0.06}
                  dot={{ r: 3.5, fill: "#fff", stroke: CHART.primary, strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: CHART.primary }}
                  name={t("chart.series")}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          {/* ── Record list ── */}
          <Section
            id="history-records"
            title={t("list.title")}
            description={t("list.count", { count: records.length })}
            bodyClassName="p-0"
          >
            <div className="divide-y divide-outline-variant">
              {records.map((r, idx) => {
                const sc = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG];
                const isLatest = idx === 0;
                const seasonIcon = SEASON_ICON[r.season];
                return (
                  <div
                    key={r.id}
                    className={cn("flex items-center gap-4 px-5 py-3", isLatest && "bg-surface-container-low/50")}
                  >
                    {/* Date */}
                    <div className="w-10 shrink-0 text-center">
                      <p className="text-xs text-on-surface-variant">
                        {formatDate(r.date, locale, "month")}
                      </p>
                      <p className="text-base font-semibold leading-tight tabular-nums text-on-surface">
                        {formatDate(r.date, locale, "day")}
                      </p>
                    </div>

                    {/* Status + season */}
                    <div className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
                          sc?.bg ?? "bg-surface-container",
                          sc?.text ?? "text-on-surface-variant"
                        )}
                      >
                        {statusLabel(r.status)}
                        {isLatest && <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
                      </span>
                      <p className="mt-1 flex items-center gap-1 text-xs text-on-surface-variant">
                        {seasonIcon && <Icon name={seasonIcon} className="size-3.5" />}
                        {tShared(`season.${r.season}`)}
                      </p>
                    </div>

                    {/* BEDI + deviation */}
                    <div className="flex shrink-0 items-center gap-5 text-right">
                      <div>
                        <p className="text-xs font-medium text-on-surface-variant">BEDI</p>
                        <p className="text-sm font-semibold tabular-nums text-on-surface">{r.bedi.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-on-surface-variant">Δ</p>
                        <p className={cn(
                          "text-sm font-semibold tabular-nums",
                          r.status === "khii_excess" ? "text-primary"
                          : r.status === "shar_badgan_excess" ? "text-secondary"
                          : "text-on-surface"
                        )}>
                          {r.deviation >= 0 ? "+" : ""}{r.deviation.toFixed(2)}
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-xs font-medium text-on-surface-variant">{t("list.weight")}</p>
                        <p className="text-sm text-on-surface">{t("list.weightValue", { weight: r.weightKg })}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
