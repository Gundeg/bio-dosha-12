"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/formatDate";
import { apiFetch, ApiError } from "@/lib/api";
import { ErrorState, PageLoading } from "@/components/states";
import DoshaRadar from "@/components/DoshaRadar";
import DoshaCard from "@/components/DoshaCard";
import { ButtonLink } from "@/components/ui/button-link";
import { InfoItem } from "@/components/InfoPanel";
import { DoshaKey } from "@/lib/ktMapping";
import { BEDI_THRESHOLDS } from "@/lib/bediConfig";

interface Profile {
  id: string;
  name: string;
  relationship: string;
  doshaType: string | null;
  ktScore: number | null;
  bediRecords: Array<{
    id: string;
    date: string;
    bedi: number;
    deviation: number;
    status: string;
    weightKg: number;
    season: string;
  }>;
}

const STATUS_CONFIG = {
  khii_excess:        { light: "bg-surface-container-low", text: "text-primary",     dot: "bg-primary",     tint: "bg-primary/5 border-primary/8",         chip: "bg-primary/10 text-primary",         bar: "bg-primary"     },
  balanced:           { light: "bg-surface-container-low", text: "text-emerald-700", dot: "bg-emerald-600", tint: "bg-emerald-500/5 border-emerald-500/10", chip: "bg-emerald-500/10 text-emerald-800", bar: "bg-emerald-600" },
  shar_badgan_excess: { light: "bg-surface-container-low", text: "text-secondary",   dot: "bg-secondary",   tint: "bg-secondary/5 border-secondary/8",     chip: "bg-secondary/10 text-secondary",     bar: "bg-secondary"   },
};

/** BEDI gauge range for the 10-segment bar (V6.4.1 Excel GaugeMax = 2, target = 1). */
const BEDI_GAUGE_MAX = 2;

const fmtSigned = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}`;

/** Each card's text lives under dashboard.actions.<key>. */
const ACTION_CARDS = [
  {
    key: "calculator",
    href: "/calculator",
    icon: "⚖",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    ctaColor: "text-primary",
  },
  {
    key: "recommendations",
    href: "/recommendations",
    icon: "✦",
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
    ctaColor: "text-secondary",
  },
] as const;

export default function DashboardPage() {
  const { data: session } = useSession();
  const t = useTranslations("dashboard");
  const tShared = useTranslations("shared");
  const locale = useLocale();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<Profile[]>("/api/profiles")
      .then((data) => {
        if (!Array.isArray(data)) return;
        setLoadError(null);
        setProfiles(data);
        const self = data.find((p) => p.relationship === "self") ?? data[0];
        setSelected(self ?? null);
      })
      .catch((err) => {
        // An empty message lets ErrorState show its translated default text.
        setLoadError(err instanceof ApiError ? err.message : "");
      })
      .finally(() => setLoading(false));
  }, []);

  const retry = useCallback(() => {
    setLoadError(null);
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const latest    = selected?.bediRecords?.[0];
  const statusCfg = latest ? STATUS_CONFIG[latest.status as keyof typeof STATUS_CONFIG] : null;

  // Historical bar chart data — oldest → newest (left → right)
  const recentRecords = [...(selected?.bediRecords ?? [])].reverse().slice(-7);
  const maxBedi = recentRecords.length > 0 ? Math.max(...recentRecords.map((r) => r.bedi), 1) : 1;

  // Map a 0–100 percentage to a discrete Tailwind height class (container is h-16)
  function barH(pct: number): string {
    if (pct < 15) return "h-2";
    if (pct < 28) return "h-4";
    if (pct < 41) return "h-6";
    if (pct < 54) return "h-8";
    if (pct < 67) return "h-10";
    if (pct < 80) return "h-12";
    if (pct < 92) return "h-14";
    return "h-16";
  }

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="relative overflow-hidden bg-surface-container-lowest rounded-3xl shadow-ambient px-5 py-5 sm:px-8 sm:py-6">
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/5 rounded-full pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-8 right-20 w-24 h-24 bg-secondary/5 rounded-full pointer-events-none" aria-hidden="true" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
              {t("eyebrow")}
            </p>
            <h1 className="font-headline text-2xl sm:text-3xl font-black text-on-surface tracking-tight leading-tight wrap-break-word">
              {t("greeting")}<br />
              <span className="text-primary">{session?.user?.name}</span>!
            </h1>
            {latest && (
              <p className="text-on-surface-variant text-sm mt-2 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg?.dot ?? "bg-primary"} motion-safe:animate-pulse`} aria-hidden="true" />
                {t("lastMeasurement", {
                  date: formatDate(latest.date, locale, "monthDayLong"),
                })}
              </p>
            )}
          </div>
          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            <ButtonLink href="/calculator" size="sm">
              <span className="mr-1.5" aria-hidden="true">+</span> {t("newCalculation")}
            </ButtonLink>
            {!selected?.doshaType && (
              <ButtonLink variant="outline" href="/calculator?tab=assessment" size="sm">{t("assessment")}</ButtonLink>
            )}
          </div>
        </div>
      </div>

      {loadError !== null ? (
        <ErrorState message={loadError} onRetry={retry} />
      ) : profiles.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient text-center py-20 px-8">
          <p className="text-5xl mb-4" aria-hidden="true">🌿</p>
          <p className="text-lg font-semibold text-on-surface">{t("noProfileTitle")}</p>
          <p className="text-sm text-on-surface-variant mt-1 mb-6">{t("noProfileBody")}</p>
          <ButtonLink href="/calculator?tab=assessment">{t("startAssessment")}</ButtonLink>
        </div>
      ) : (
        <>
          {/* Profile selector */}
          {profiles.length > 1 && (
            <div className="flex gap-2 flex-wrap" role="group" aria-label={t("profilesLabel")}>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={selected?.id === p.id}
                  onClick={() => setSelected(p)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selected?.id === p.id
                      ? "bg-primary text-on-primary shadow-ambient"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Status banner */}
          {latest && statusCfg && (
            <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-5 py-3.5 rounded-2xl ${statusCfg.light}`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusCfg.dot} ring-4 ring-current ring-opacity-20`} aria-hidden="true" />
                <span className={`font-bold ${statusCfg.text}`}>{tShared(`status.${latest.status}`)}</span>
                <span className="text-on-surface-variant text-sm">
                  Δ {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                <span>{tShared(`season.${latest.season}`)}</span>
                <span>{formatDate(latest.date, locale)}</span>
              </div>
            </div>
          )}

          {/* ── Main bento grid (12-col) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Radar card — 5/12 */}
            <div className="lg:col-span-5">
              <div className="bg-surface-container-lowest rounded-3xl shadow-ambient overflow-hidden h-full relative group">
                {/* Decorative corner arc */}
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-primary/5 rounded-full transition-transform duration-700 motion-safe:group-hover:scale-125 pointer-events-none" aria-hidden="true" />

                {latest && selected?.doshaType ? (
                  <>
                    <div className="px-6 pt-6 pb-1">
                      <p className="text-xs uppercase tracking-[0.15em] font-bold text-primary">
                        {t("balanceTitle")}
                      </p>
                    </div>
                    <div className="flex justify-center px-4 pb-2">
                      <DoshaRadar
                        doshaKey={selected.doshaType as DoshaKey}
                        deviation={latest.deviation}
                        status={latest.status}
                        size={320}
                        compact
                      />
                    </div>
                    <div className="grid grid-cols-3 bg-surface-container-low">
                      <div className="py-3.5 text-center">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold">BEDI</p>
                        <p className="font-headline text-xl font-bold text-on-surface">{latest.bedi.toFixed(2)}</p>
                      </div>
                      <div className="py-3.5 text-center">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold">{t("statWeight")}</p>
                        <p className="font-headline text-xl font-bold text-on-surface">{t("weightValue", { weight: latest.weightKg })}</p>
                      </div>
                      <div className="py-3.5 text-center">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold">{t("statSeason")}</p>
                        <p className="font-headline text-xl font-bold text-on-surface">{tShared(`season.${latest.season}`)}</p>
                      </div>
                    </div>
                  </>
                ) : latest ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-center px-6">
                    <p className="text-on-surface-variant text-sm">{t("ktMissing")}</p>
                    <ButtonLink size="sm" href="/calculator?tab=assessment">{t("takeAssessment")}</ButtonLink>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-center px-6">
                    <p className="text-4xl" aria-hidden="true">📊</p>
                    <p className="text-on-surface-variant font-medium">{t("noRecord")}</p>
                    <ButtonLink size="sm" href="/calculator">{t("doCalculation")}</ButtonLink>
                  </div>
                )}
              </div>
            </div>

            {/* Right column — 7/12 */}
            <div className="lg:col-span-7 flex flex-col gap-4">

              {/* Dosha card */}
              {selected?.doshaType ? (
                <DoshaCard doshaKey={selected.doshaType as DoshaKey} kt={selected.ktScore ?? 1.0} />
              ) : (
                <div className="bg-surface-container-lowest rounded-3xl flex flex-col items-center justify-center py-10 text-center gap-3 px-6 shadow-ambient">
                  <p className="text-4xl" aria-hidden="true">🌀</p>
                  <p className="font-semibold text-on-surface">{t("constitutionMissingTitle")}</p>
                  <p className="text-sm text-on-surface-variant">{t("constitutionMissingBody")}</p>
                  <ButtonLink href="/calculator?tab=assessment">{t("startAssessment")}</ButtonLink>
                </div>
              )}

              {/* Metric cards — BEDI + Deviation */}
              {latest && (
                <div className="grid grid-cols-2 gap-3">
                  {/* BEDI index */}
                  <div className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
                    <div className="bg-primary/5 px-4 py-2 border-b border-primary/8 flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{t("bediIndex")}</p>
                      <span className="w-5 h-5 bg-primary/10 rounded-md flex items-center justify-center text-[9px] font-black text-primary" aria-hidden="true">{t("bediIndexBadge")}</span>
                    </div>
                    <div className="p-4 space-y-2.5">
                      <span className="font-headline text-3xl font-black text-on-surface">{latest.bedi.toFixed(2)}</span>
                      <div
                        className="flex gap-0.5"
                        role="meter"
                        aria-label={t("bediGauge")}
                        aria-valuemin={0}
                        aria-valuemax={BEDI_GAUGE_MAX}
                        aria-valuenow={Math.min(latest.bedi, BEDI_GAUGE_MAX)}
                      >
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={i}
                            className={`flex-1 h-1.5 rounded-full transition-colors ${
                              i < Math.round(Math.min(10, (latest.bedi / BEDI_GAUGE_MAX) * 10))
                                ? statusCfg?.bar ?? "bg-primary"
                                : "bg-surface-container-high"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Deviation — bidirectional bar */}
                  <div className={`bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden`}>
                    <div className={`${statusCfg?.tint ?? ""} px-4 py-2 border-b flex items-center justify-between`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${statusCfg?.text ?? ""}`}>{t("deviation")}</p>
                      <span className={`w-5 h-5 ${statusCfg?.chip ?? ""} rounded-md flex items-center justify-center text-[9px] font-black`} aria-hidden="true">Δ</span>
                    </div>
                    <div className="p-4 space-y-2.5">
                      <span className={`font-headline text-3xl font-black ${statusCfg?.text ?? ""}`}>
                        {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                      </span>
                      <p className="text-[11px] font-semibold text-on-surface-variant">{tShared(`status.${latest.status}`)}</p>
                      {/* Magnitude in each direction; the colour always follows the stored status. */}
                      <div className="flex gap-0.5" aria-hidden="true">
                        {Array.from({ length: 10 }, (_, i) => {
                          const segs = Math.round(Math.min(1, Math.abs(latest.deviation)) * 5);
                          const leftFilled = latest.deviation < 0 && i < 5 && (4 - i) < segs;
                          const rightFilled = latest.deviation > 0 && i >= 5 && (i - 5) < segs;
                          return (
                            <div
                              key={i}
                              className={`flex-1 h-1.5 rounded-full ${
                                leftFilled || rightFilled ? statusCfg?.bar ?? "bg-primary" : "bg-surface-container-high"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Historical mini bar chart */}
              {recentRecords.length > 0 && (
                <div className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 bg-surface-container-low">
                    <span className="text-xs font-bold text-on-surface">{t("trendTitle")}</span>
                    {recentRecords.length > 1 && (
                      <span className="text-xs font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                        {(recentRecords[recentRecords.length - 1].bedi - recentRecords[0].bedi >= 0 ? "+" : "")}
                        {(recentRecords[recentRecords.length - 1].bedi - recentRecords[0].bedi).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="px-5 pb-4 pt-6">
                    <div className="h-16 flex items-end gap-1.5">
                      {recentRecords.map((r, i) => {
                        const isLatest = i === recentRecords.length - 1;
                        const pct = Math.max(8, (r.bedi / maxBedi) * 100);
                        return (
                          <div key={r.id} className="flex-1 flex flex-col items-end gap-0 relative">
                            {isLatest && (
                              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-primary tracking-wider">{t("now")}</span>
                            )}
                            <div
                              className={`w-full rounded-t-md transition-all ${barH(pct)} ${
                                isLatest ? "bg-primary" : "bg-surface-container-highest"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Priority Actions */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-headline text-xl font-bold text-on-surface">{t("quickActions")}</h2>
              <ButtonLink href="/recommendations" size="sm" variant="ghost" className="text-primary font-semibold">
                {t("seeAll")}
              </ButtonLink>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACTION_CARDS.map(({ key, href, icon, iconBg, iconColor, ctaColor }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-start gap-5 p-7 bg-surface-container-lowest rounded-3xl shadow-ambient hover:shadow-xl transition-all duration-200 motion-safe:hover:-translate-y-0.5 no-underline"
                >
                  <div className={`shrink-0 w-12 h-12 ${iconBg} rounded-full flex items-center justify-center ${iconColor} text-xl font-black`} aria-hidden="true">
                    {icon}
                  </div>
                  <div>
                    <p className="font-headline font-bold text-on-surface text-base">{t(`actions.${key}.title`)}</p>
                    <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{t(`actions.${key}.desc`)}</p>
                    <p className={`text-xs font-bold ${ctaColor} tracking-widest uppercase mt-3`}>{t(`actions.${key}.cta`)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </>
      )}

      {/* BEDI Reference — inline grid, no horizontal space stolen */}
      <div className="bg-surface-container-low rounded-2xl p-5 border border-primary/5">
        <div className="flex items-center gap-1.5 text-secondary mb-3">
          <span className="text-xs" aria-hidden="true">✦</span>
          <span className="font-bold text-[10px] uppercase tracking-wider">{t("info.eyebrow")}</span>
        </div>
        <h2 className="font-headline font-bold text-on-surface text-sm mb-1">{t("info.title")}</h2>
        <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
          {t("info.body")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <InfoItem
            iconBg="bg-primary/10" iconColor="text-primary" icon="⚖"
            title={`${tShared("status.balanced")} — Δ ∈ [${fmtSigned(BEDI_THRESHOLDS.khiiBelow)}, ${fmtSigned(BEDI_THRESHOLDS.sharBadganAbove)}]`}
            body={t("info.balancedBody")}
          />
          <InfoItem
            iconBg="bg-primary/10" iconColor="text-primary" icon="💨"
            title={`${tShared("status.khii_excess")} — Δ < ${fmtSigned(BEDI_THRESHOLDS.khiiBelow)}`}
            body={t("info.khiiBody")}
          />
          <InfoItem
            iconBg="bg-secondary/10" iconColor="text-secondary" icon="🔥"
            title={`${t("info.sharBadganTitle")} — Δ > ${fmtSigned(BEDI_THRESHOLDS.sharBadganAbove)}`}
            body={t("info.sharBadganBody")}
          />
        </div>
        <p className="text-[10px] text-on-surface-variant mt-4 italic leading-relaxed border-t border-surface-container-high pt-3">
          {t("info.ktNote")}
        </p>
      </div>

    </div>
  );
}
