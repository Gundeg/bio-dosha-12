"use client";

import { useCallback, useEffect, useState } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/formatDate";
import { apiFetch, ApiError } from "@/lib/api";
import { ErrorState, PageLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { BEDI_THRESHOLDS } from "@/lib/bediConfig";

interface Profile {
  id: string;
  name: string;
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
  khii_excess:        { color: "#00626b", bg: "bg-primary/10",     text: "text-primary"     },
  balanced:           { color: "#047857", bg: "bg-emerald-500/10", text: "text-emerald-800" },
  shar_badgan_excess: { color: "#904d00", bg: "bg-secondary/10",   text: "text-secondary"   },
};

const fmtSigned = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}`;
const BAND_LOW = BEDI_THRESHOLDS.khiiBelow;
const BAND_HIGH = BEDI_THRESHOLDS.sharBadganAbove;

const SEASON_ICON: Record<string, string> = {
  WINTER: "❄", SPRING: "🌸", SUMMER: "☀", AUTUMN: "🍂",
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
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-4 py-3 shadow-ambient text-sm">
      <p className="text-on-surface-variant text-xs mb-1">{label}</p>
      <p className={`font-headline text-xl font-bold ${sc?.text ?? "text-on-surface"}`}>
        {val >= 0 ? "+" : ""}{val.toFixed(2)}
      </p>
      <p className="text-[11px] text-on-surface-variant mt-0.5">
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

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            {t("eyebrow")}
          </p>
          <h1 className="font-headline text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            {t("title")}
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {profiles.length > 1 && (
            <div className="flex gap-2 flex-wrap" role="group" aria-label={t("profilesLabel")}>
              {profiles.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  aria-pressed={selectedId === p.id}
                  onClick={() => selectProfile(p.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedId === p.id
                      ? "bg-primary text-on-primary shadow-ambient"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
          <Button variant="outline" onClick={exportCSV} disabled={(records?.length ?? 0) === 0}>
            <span className="material-symbols-outlined text-[16px] mr-1.5" aria-hidden="true">download</span>
            {t("exportCsv")}
          </Button>
        </div>
      </div>

      {loadError !== null ? (
        <ErrorState message={loadError} onRetry={retry} />
      ) : records === null ? (
        <PageLoading />
      ) : records.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient text-center py-20 px-8">
          <p className="text-5xl mb-4" aria-hidden="true">📈</p>
          <p className="text-lg font-semibold text-on-surface">{t("emptyTitle")}</p>
          <p className="text-sm text-on-surface-variant mt-1">{t("emptyBody")}</p>
        </div>
      ) : (
        <>
          {/* ── Summary stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: t("stats.total"),
                value: records.length.toString(),
                sub: t("stats.totalUnit"),
                color: "text-on-surface",
              },
              {
                label: t("stats.latestDeviation"),
                value: `${records[0].deviation >= 0 ? "+" : ""}${records[0].deviation.toFixed(2)}`,
                sub: "Δ",
                color: STATUS_CONFIG[records[0].status as keyof typeof STATUS_CONFIG]?.text ?? "text-on-surface",
              },
              {
                label: t("stats.latestBedi"),
                value: records[0].bedi.toFixed(2),
                sub: t("stats.indexUnit"),
                color: "text-on-surface",
              },
              {
                label: t("stats.trend"),
                value: trend !== null ? `${trend >= 0 ? "+" : ""}${trend.toFixed(2)}` : "—",
                sub: trend === null ? "" : trend > 0 ? t("stats.trendUp") : trend < 0 ? t("stats.trendDown") : t("stats.trendFlat"),
                // A change in Δ is not a status, so it is shown without status colours.
                color: "text-on-surface",
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface-container-lowest rounded-2xl shadow-ambient p-4">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold mb-1">{stat.label}</p>
                <p className={`font-headline text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                {stat.sub && <p className="text-[11px] text-on-surface-variant">{stat.sub}</p>}
              </div>
            ))}
          </div>

          {/* ── Deviation chart ── */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient overflow-hidden">
            <div className="px-6 py-5 border-b border-surface-container-high flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div>
                <h2 className="font-headline font-bold text-on-surface">{t("chart.title")}</h2>
                <p className="text-[11px] text-on-surface-variant mt-0.5">{t("chart.subtitle")}</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-on-surface-variant">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-secondary inline-block rounded" aria-hidden="true" /> {t("chart.legendSharBadgan")} (&gt;{fmtSigned(BAND_HIGH)})</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary inline-block rounded" aria-hidden="true" /> {t("chart.legendKhii")} (&lt;{fmtSigned(BAND_LOW)})</span>
              </div>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="deviationGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00626b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#00626b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5eeff" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#3e494a" }} axisLine={false} tickLine={false} />
                  {/* Grows beyond ±1 so large deviations are never clipped off the chart */}
                  <YAxis
                    domain={[
                      (dataMin: number) => Math.min(-1, Math.floor(dataMin * 10) / 10),
                      (dataMax: number) => Math.max(1, Math.ceil(dataMax * 10) / 10),
                    ]}
                    tick={{ fontSize: 11, fill: "#3e494a" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#bdc8ca" strokeWidth={1} />
                  <ReferenceLine y={BAND_HIGH} stroke="#904d00" strokeDasharray="4 4" strokeOpacity={0.6}
                    label={{ value: fmtSigned(BAND_HIGH), fontSize: 10, fill: "#904d00", position: "right" }} />
                  <ReferenceLine y={BAND_LOW} stroke="#00626b" strokeDasharray="4 4" strokeOpacity={0.6}
                    label={{ value: fmtSigned(BAND_LOW), fontSize: 10, fill: "#00626b", position: "right" }} />
                  <Area
                    type="monotone"
                    dataKey="deviation"
                    stroke="#00626b"
                    strokeWidth={2.5}
                    fill="url(#deviationGrad)"
                    dot={{ r: 4, fill: "#fff", stroke: "#00626b", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#00626b" }}
                    name={t("chart.series")}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Record list ── */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient overflow-hidden">
            <div className="px-6 py-5 border-b border-surface-container-high">
              <h2 className="font-headline font-bold text-on-surface">{t("list.title")}</h2>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{t("list.count", { count: records.length })}</p>
            </div>
            <div className="divide-y divide-surface-container-high">
              {records.map((r, idx) => {
                const sc = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG];
                const isLatest = idx === 0;
                return (
                  <div key={r.id} className={`flex items-center justify-between px-6 py-4 gap-4 transition-colors hover:bg-surface-container-low/50 ${isLatest ? "bg-surface-container-low/30" : ""}`}>
                    {/* Date + season */}
                    <div className="flex items-center gap-3 min-w-0 shrink-0">
                      <div className="text-center">
                        <p className="text-[10px] text-on-surface-variant font-medium">
                          {formatDate(r.date, locale, "month")}
                        </p>
                        <p className="font-headline text-base font-bold text-on-surface leading-tight">
                          {formatDate(r.date, locale, "day")}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm" aria-hidden="true">{SEASON_ICON[r.season] ?? ""}</span>
                        <span className="text-xs text-on-surface-variant ml-1">{tShared(`season.${r.season}`)}</span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2 sm:px-3 py-1 rounded-full ${sc?.bg ?? "bg-surface-container"} ${sc?.text ?? "text-on-surface-variant"}`}>
                      {statusLabel(r.status)}
                      {isLatest && <span className="w-1.5 h-1.5 rounded-full bg-current motion-safe:animate-pulse" aria-hidden="true" />}
                    </span>

                    {/* BEDI + deviation */}
                    <div className="flex items-center gap-5 ml-auto">
                      <div className="text-right">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold">BEDI</p>
                        <p className="font-headline text-base font-bold text-on-surface">{r.bedi.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold">Δ</p>
                        <p className={`font-headline text-base font-bold ${
                          r.status === "khii_excess" ? "text-primary"
                          : r.status === "shar_badgan_excess" ? "text-secondary"
                          : "text-on-surface"
                        }`}>
                          {r.deviation >= 0 ? "+" : ""}{r.deviation.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold">{t("list.weight")}</p>
                        <p className="font-medium text-sm text-on-surface">{t("list.weightValue", { weight: r.weightKg })}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
