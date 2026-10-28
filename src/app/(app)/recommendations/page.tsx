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
import { ErrorState, PageLoading } from "@/components/states";
import { fullName } from "@/lib/person";

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
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    text: "text-emerald-700",
    dot: "bg-emerald-600",
    badge: "bg-emerald-500/10 text-emerald-800",
  },
  khii_excess: {
    bg: "bg-primary/6",
    border: "border-primary/20",
    text: "text-primary",
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary",
  },
  shar_badgan_excess: {
    bg: "bg-secondary/6",
    border: "border-secondary/20",
    text: "text-secondary",
    dot: "bg-secondary",
    badge: "bg-secondary/10 text-secondary",
  },
};

/** Text for each card lives under recommendations.context.<key>. */
const CONTEXT_ITEMS = [
  { key: "khii", icon: "💨", iconBg: "bg-primary/8", iconColor: "text-primary" },
  { key: "balanced", icon: "⚖", iconBg: "bg-surface-container", iconColor: "text-on-surface" },
  { key: "sharBadgan", icon: "🔥", iconBg: "bg-secondary/8", iconColor: "text-secondary" },
] as const;

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

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            {t("eyebrow")}
          </p>
          <h1 className="font-headline text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            {t("title")}
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            {t("subtitle")}
          </p>
        </div>

        {profiles.length > 1 && (
          <div className="flex gap-2 flex-wrap" role="group" aria-label={t("profilesLabel")}>
            {profiles.map((p) => (
              <button
                type="button"
                key={p.id}
                aria-pressed={selectedId === p.id}
                onClick={() => setChosenId(p.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedId === p.id
                    ? "bg-primary text-on-primary shadow-ambient"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                {fullName(p)}
              </button>
            ))}
          </div>
        )}
      </div>

      {loadError !== null ? (
        /* ── Error state ── */
        <ErrorState message={loadError} onRetry={query.reload} />
      ) : !latest ? (
        /* ── Empty state ── */
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient text-center py-20 px-8">
          <p className="text-5xl mb-4" aria-hidden="true">🌿</p>
          <p className="text-lg font-semibold text-on-surface">{t("emptyTitle")}</p>
          <p className="text-sm text-on-surface-variant mt-1 mb-6">
            {t("emptyBody")}
          </p>
          <ButtonLink href="/calculator">{t("doCalculation")}</ButtonLink>
        </div>
      ) : (
        <>
          {/* ── Status hero card ── */}
          <div className={`relative overflow-hidden rounded-3xl px-7 py-6 border ${statusMeta?.bg} ${statusMeta?.border}`}>
            {/* Decorative circle */}
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-current opacity-[0.04] pointer-events-none" aria-hidden="true" />

            <div className="flex items-center justify-between gap-6 flex-wrap">
              {/* Deviation number */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  {t("currentDeviation")}
                </p>
                <div className="flex items-baseline gap-3">
                  <span className={`font-headline text-5xl font-black ${statusMeta?.text}`}>
                    {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                  </span>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusMeta?.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusMeta?.dot}`} aria-hidden="true" />
                      {statusKey && tShared(`status.${statusKey}`)}
                    </span>
                    <p className="text-[11px] text-on-surface-variant mt-1.5 max-w-48 leading-snug">
                      {statusKey && t(`statusSub.${statusKey}`)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 text-center shrink-0">
                <div className="bg-surface-container-lowest/70 rounded-2xl px-5 py-3">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold mb-1">{t("age")}</p>
                  <p className="font-headline text-2xl font-bold text-on-surface">{age}</p>
                </div>
                <div className="bg-surface-container-lowest/70 rounded-2xl px-5 py-3">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold mb-1">{t("date")}</p>
                  <p className="text-sm font-semibold text-on-surface">
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
            <div className="bg-surface-container-lowest rounded-3xl shadow-ambient text-center py-14 px-8">
              <p className="text-3xl mb-3" aria-hidden="true">📋</p>
              <p className="font-semibold text-on-surface">{t("noRemedyTitle")}</p>
              <p className="text-sm text-on-surface-variant mt-1 mb-5">
                {t("noRemedyBody")}
              </p>
              <ButtonLink href="/calculator">{t("doCalculation")}</ButtonLink>
            </div>
          )}

          {/* ── Context info strip ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CONTEXT_ITEMS.map((item) => (
              <div key={item.key} className="bg-surface-container-low rounded-2xl p-4 flex items-start gap-3">
                <div className={`shrink-0 w-8 h-8 ${item.iconBg} rounded-lg flex items-center justify-center ${item.iconColor} text-base`} aria-hidden="true">
                  {item.icon}
                </div>
                <div>
                  <p className="font-bold text-xs text-on-surface mb-0.5">{t(`context.${item.key}.title`)}</p>
                  <p className="text-[11px] text-on-surface-variant leading-snug">{t(`context.${item.key}.body`)}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-on-surface-variant italic text-center pb-2">
            {t("disclaimer")}
          </p>
        </>
      )}
    </div>
  );
}
