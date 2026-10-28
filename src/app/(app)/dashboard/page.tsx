"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/formatDate";
import { apiFetch, ApiError } from "@/lib/api";
import { EmptyState, ErrorState, PageLoading } from "@/components/states";
import DoshaRadar from "@/components/DoshaRadar";
import DoshaCard from "@/components/DoshaCard";
import { ButtonLink } from "@/components/ui/button-link";
import { FilterTabs } from "@/components/kit/DataTable";
import { IconTile, PageHeader, Section, StatCard } from "@/components/kit/layout";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { DoshaKey } from "@/lib/ktMapping";
import { BEDI_THRESHOLDS } from "@/lib/bediConfig";
import { fullName } from "@/lib/person";

interface Profile {
  id: string;
  name: string;
  lastName?: string | null;
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

const fmtSigned = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}`;

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

  const trendDelta =
    recentRecords.length > 1 ? recentRecords[recentRecords.length - 1].bedi - recentRecords[0].bedi : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t("greeting")} ${session?.user?.name ?? ""}`.trim()}
        description={
          latest ? t("lastMeasurement", { date: formatDate(latest.date, locale, "monthDayLong") }) : undefined
        }
        actions={
          <>
            {profiles.length > 0 && !selected?.doshaType && (
              <ButtonLink variant="outline" href="/calculator?tab=assessment">{t("assessment")}</ButtonLink>
            )}
            <ButtonLink href="/calculator">
              <Icon name="add" className="size-4" />
              {t("newCalculation")}
            </ButtonLink>
          </>
        }
      />

      {loadError !== null ? (
        <ErrorState message={loadError} onRetry={retry} />
      ) : profiles.length === 0 ? (
        <EmptyState
          title={t("noProfileTitle")}
          body={t("noProfileBody")}
          action={<ButtonLink href="/calculator?tab=assessment">{t("startAssessment")}</ButtonLink>}
        />
      ) : (
        <>
          {profiles.length > 1 && selected && (
            <FilterTabs
              label={t("profilesLabel")}
              value={selected.id}
              onChange={(id) => setSelected(profiles.find((p) => p.id === id) ?? null)}
              options={profiles.map((p) => ({ value: p.id, label: fullName(p) }))}
            />
          )}

          {latest && (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <StatCard
                label={t("statusLabel")}
                value={<span className={cn("text-xl", statusCfg?.text)}>{tShared(`status.${latest.status}`)}</span>}
                hint={t("balancedRange", {
                  from: fmtSigned(BEDI_THRESHOLDS.khiiBelow),
                  to: fmtSigned(BEDI_THRESHOLDS.sharBadganAbove),
                })}
                icon="monitor_heart"
                tone={latest.status === "balanced" ? "success" : "primary"}
              />
              <StatCard label={t("deviation")} value={fmtSigned(latest.deviation)} icon="tune" />
              <StatCard label={t("bediIndex")} value={latest.bedi.toFixed(2)} icon="monitoring" />
              <StatCard
                label={t("statWeight")}
                value={t("weightValue", { weight: latest.weightKg })}
                hint={`${tShared(`season.${latest.season}`)}, ${formatDate(latest.date, locale)}`}
                icon="monitor_weight"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Section title={t("balanceTitle")} className="lg:col-span-5" bodyClassName="p-4">
              {latest && selected?.doshaType ? (
                <div className="flex justify-center">
                  <DoshaRadar
                    doshaKey={selected.doshaType as DoshaKey}
                    deviation={latest.deviation}
                    status={latest.status}
                    size={320}
                    compact
                  />
                </div>
              ) : (
                <EmptyState
                  className="border-0 py-10"
                  icon="analytics"
                  title={latest ? t("ktMissing") : t("noRecord")}
                  action={
                    latest ? (
                      <ButtonLink variant="outline" href="/calculator?tab=assessment">{t("takeAssessment")}</ButtonLink>
                    ) : (
                      <ButtonLink variant="outline" href="/calculator">{t("doCalculation")}</ButtonLink>
                    )
                  }
                />
              )}
            </Section>

            <div className="lg:col-span-7">
              {selected?.doshaType ? (
                <DoshaCard doshaKey={selected.doshaType as DoshaKey} kt={selected.ktScore ?? 1.0} />
              ) : (
                <EmptyState
                  className="h-full bg-surface-container-lowest"
                  icon="quiz"
                  title={t("constitutionMissingTitle")}
                  body={t("constitutionMissingBody")}
                  action={<ButtonLink variant="outline" href="/calculator?tab=assessment">{t("startAssessment")}</ButtonLink>}
                />
              )}
            </div>
          </div>

          {recentRecords.length > 0 && (
            <Section
              title={t("trendTitle")}
              description={t("trendHint", { count: recentRecords.length })}
              actions={
                trendDelta !== null ? (
                  <span className="rounded-md bg-surface-container-low px-2 py-1 text-xs font-medium tabular-nums text-on-surface">
                    {fmtSigned(trendDelta)}
                  </span>
                ) : undefined
              }
            >
              <div className="flex h-24 items-end gap-2" aria-hidden="true">
                {recentRecords.map((r, i) => {
                  const isLatest = i === recentRecords.length - 1;
                  const pct = Math.max(8, (r.bedi / maxBedi) * 100);
                  return (
                    <div key={r.id} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className={cn("w-full max-w-10 rounded-t-md", barH(pct), isLatest ? "bg-primary" : "bg-surface-container-high")}
                      />
                      <span className={cn("text-[11px] tabular-nums", isLatest ? "font-medium text-primary" : "text-on-surface-variant")}>
                        {isLatest ? t("now") : formatDate(r.date, locale, "monthDay")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </>
      )}

      <Section title={t("info.title")} description={t("info.body")}>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: "balance" as const,
              title: `${tShared("status.balanced")}: Δ ${fmtSigned(BEDI_THRESHOLDS.khiiBelow)}…${fmtSigned(BEDI_THRESHOLDS.sharBadganAbove)}`,
              body: t("info.balancedBody"),
            },
            {
              icon: "air" as const,
              title: `${tShared("status.khii_excess")}: Δ < ${fmtSigned(BEDI_THRESHOLDS.khiiBelow)}`,
              body: t("info.khiiBody"),
            },
            {
              icon: "local_fire_department" as const,
              title: `${t("info.sharBadganTitle")}: Δ > ${fmtSigned(BEDI_THRESHOLDS.sharBadganAbove)}`,
              body: t("info.sharBadganBody"),
            },
          ].map((item) => (
            <li key={item.icon} className="flex gap-3">
              <IconTile name={item.icon} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-on-surface">{item.title}</p>
                <p className="mt-0.5 text-sm text-on-surface-variant">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-outline-variant pt-3 text-xs text-on-surface-variant">{t("info.ktNote")}</p>
      </Section>
    </div>
  );
}
