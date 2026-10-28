"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/formatDate";
import RemedyPanel from "@/components/RemedyPanel";
import DoshaCard from "@/components/DoshaCard";
import { calcAge, BEDIStatus } from "@/lib/bediEngine";
import { DoshaKey } from "@/lib/ktMapping";
import { RemedyResult } from "@/lib/remedyEngine";
import { ButtonLink } from "@/components/ui/button-link";
import { useApiQuery } from "@/components/kit/hooks";
import { FilterTabs } from "@/components/kit/DataTable";
import { IconTile, PageHeader } from "@/components/kit/layout";
import { EmptyState, ErrorState, PageLoading } from "@/components/states";
import { fullName } from "@/lib/person";
import { cn } from "@/lib/utils";
import type { IconName } from "@/components/ui/icon";

interface StoredRecommendation {
  remedies: string[];
  avoidFoods: string[];
  riskFactors: string[];
  ageNote: string | null;
  lifestyle: string[];
  validationStatus: string | null;
  validationAction: string | null;
}

interface Profile {
  id: string;
  name: string;
  lastName?: string | null;
  relationship: string;
  birthDate: string;
  doshaType: string | null;
  ktScore: number | null;
  bediRecords: Array<{
    deviation: number;
    status: string;
    date: string;
    recommendation: StoredRecommendation | null;
  }>;
}

/** Colours per status; the label is shared.status.<key>, the hint recommendations.statusSub.<key>. */
const STATUS_META = {
  balanced: {
    text: "text-emerald-700",
    dot: "bg-emerald-600",
    badge: "bg-emerald-50 text-emerald-700",
  },
  khii_excess: {
    text: "text-primary",
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary",
  },
  shar_badgan_excess: {
    text: "text-secondary",
    dot: "bg-secondary",
    badge: "bg-secondary/10 text-secondary",
  },
};

/** Text for each card lives under recommendations.context.<key>. Шар/Бадган keeps the Fire colour. */
const CONTEXT_ITEMS: { key: "khii" | "balanced" | "sharBadgan"; icon: IconName; tone: "default" | "primary"; className?: string }[] = [
  { key: "khii", icon: "air", tone: "primary" },
  { key: "balanced", icon: "balance", tone: "default" },
  { key: "sharBadgan", icon: "local_fire_department", tone: "default", className: "bg-secondary/8 text-secondary" },
];

export default function RecommendationsPage() {
  const t = useTranslations("recommendations");
  const tShared = useTranslations("shared");
  const locale = useLocale();
  const query = useApiQuery<Profile[]>("/api/profiles");
  const profiles = query.data ?? [];
  const loading = query.loading && !query.data;
  // An empty message lets ErrorState show its translated default text
  // (network failures carry the browser's English text, so they use it too).
  const loadError = query.error ? (query.error.status === 0 ? "" : query.error.message) : null;
  // Until someone picks a profile, show their own (or the first one).
  const [chosenId, setChosenId] = useState("");
  const selectedId =
    chosenId || ((profiles.find((p) => p.relationship === "self") ?? profiles[0])?.id ?? "");

  const profile = profiles.find((p) => p.id === selectedId);
  const latest = profile?.bediRecords?.[0];
  const age = profile ? calcAge(profile.birthDate) : 0;

  // Stored text stays Mongolian here; RemedyPanel translates it for display.
  const rec = latest?.recommendation ?? null;
  const remedyResult: RemedyResult | null = rec
    ? {
        remedies: rec.remedies,
        avoidFoods: rec.avoidFoods,
        riskFactors: rec.riskFactors,
        ageNote: rec.ageNote ?? "",
        lifestyle: rec.lifestyle ?? [],
        validation: rec.validationStatus
          ? {
              status: rec.validationStatus as "OK" | "WARNING" | "CONTRAINDICATED",
              action: rec.validationAction ?? "",
              adjustedDosePercent:
                rec.validationStatus === "WARNING" ? 70
                : rec.validationStatus === "CONTRAINDICATED" ? 0
                : 100,
            }
          : null,
      }
    : null;

  if (loading) {
    return <PageLoading />;
  }

  const statusKey: keyof typeof STATUS_META | null = latest
    ? Object.prototype.hasOwnProperty.call(STATUS_META, latest.status)
      ? (latest.status as keyof typeof STATUS_META)
      : "balanced"
    : null;
  const statusMeta = statusKey ? STATUS_META[statusKey] : null;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      {profiles.length > 1 && (
        <FilterTabs
          label={t("profilesLabel")}
          value={selectedId}
          onChange={setChosenId}
          options={profiles.map((p) => ({ value: p.id, label: fullName(p) }))}
        />
      )}

      {loadError !== null ? (
        /* ── Error state ── */
        <ErrorState message={loadError} onRetry={query.reload} />
      ) : !latest ? (
        /* ── Empty state ── */
        <EmptyState
          icon="spa"
          title={t("emptyTitle")}
          body={t("emptyBody")}
          action={<ButtonLink href="/calculator">{t("doCalculation")}</ButtonLink>}
        />
      ) : (
        <>
          {/* ── Current status ── */}
          <div className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient">
            <div className="flex flex-wrap items-center justify-between gap-6">
              {/* Deviation number */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-on-surface-variant">
                  {t("currentDeviation")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className={cn("text-4xl font-semibold tabular-nums tracking-tight", statusMeta?.text)}>
                    {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                  </span>
                  <div className="min-w-0">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium", statusMeta?.badge)}>
                      <span className={cn("size-1.5 shrink-0 rounded-full", statusMeta?.dot)} aria-hidden="true" />
                      {statusKey && tShared(`status.${statusKey}`)}
                    </span>
                    <p className="mt-1.5 max-w-xs text-xs leading-snug text-on-surface-variant">
                      {statusKey && t(`statusSub.${statusKey}`)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta info */}
              <div className="grid shrink-0 grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface-container-low px-4 py-3">
                  <p className="text-xs font-medium text-on-surface-variant">{t("age")}</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-on-surface">{age}</p>
                </div>
                <div className="rounded-lg bg-surface-container-low px-4 py-3">
                  <p className="text-xs font-medium text-on-surface-variant">{t("date")}</p>
                  <p className="mt-1 text-sm font-semibold leading-7 text-on-surface">
                    {formatDate(latest.date, locale, "monthDay")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Dosha constitution card ── */}
          {profile?.doshaType && (
            <DoshaCard doshaKey={profile.doshaType as DoshaKey} kt={profile.ktScore ?? 1} />
          )}

          {/* ── Remedy panel ── */}
          {remedyResult ? (
            <RemedyPanel status={latest.status as BEDIStatus} remedyResult={remedyResult} />
          ) : (
            <EmptyState
              icon="quiz"
              title={t("noRemedyTitle")}
              body={t("noRemedyBody")}
              action={<ButtonLink href="/calculator">{t("doCalculation")}</ButtonLink>}
            />
          )}

          {/* ── Context info strip ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CONTEXT_ITEMS.map((item) => (
              <div key={item.key} className="flex items-start gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-ambient">
                <IconTile name={item.icon} tone={item.tone} size="sm" className={item.className} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{t(`context.${item.key}.title`)}</p>
                  <p className="mt-0.5 text-xs leading-snug text-on-surface-variant">{t(`context.${item.key}.body`)}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="pb-2 text-center text-xs text-on-surface-variant">
            {t("disclaimer")}
          </p>
        </>
      )}
    </div>
  );
}
