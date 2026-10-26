"use client";

import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/kit";
import { formatNumber } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import { hasPdfReports, limitOf, type PlanAudience, type PlanLimits } from "./lib";

/** Limit keys that matter for each audience. */
export const AUDIENCE_LIMITS: Record<PlanAudience, ("maxProfiles" | "maxPractitioners" | "maxPatients")[]> = {
  INDIVIDUAL: ["maxProfiles"],
  ORGANIZATION: ["maxPractitioners", "maxPatients"],
};

/** One line such as "3 practitioners · 300 patients · PDF reports". */
export function PlanLimitsSummary({ audience, limits }: { audience: PlanAudience; limits: PlanLimits }) {
  const t = useTranslations("admin");
  const parts = AUDIENCE_LIMITS[audience].map((key) => {
    const limit = limitOf(limits, key);
    return limit === null
      ? t(`limits.unlimitedOf.${key}`)
      : t(`limits.countOf.${key}`, { count: limit, value: formatNumber(limit) });
  });
  if (audience === "ORGANIZATION") parts.push(hasPdfReports(limits) ? t("limits.pdfIncluded") : t("limits.pdfNotIncluded"));
  return <>{parts.join(" · ")}</>;
}

/** Usage against a plan limit. A missing limit means unlimited. */
export function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const t = useTranslations("admin");
  const tk = useTranslations("kit");

  if (limit === null) {
    return (
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium text-on-surface">{label}</span>
          <span className="tabular-nums text-on-surface">
            {formatNumber(used)} <span className="text-on-surface-variant">· {tk("unlimited")}</span>
          </span>
        </div>
      </div>
    );
  }

  const ratio = limit === 0 ? (used > 0 ? 1 : 0) : used / limit;
  const pct = Math.min(100, Math.round(ratio * 100));
  const state = ratio >= 1 ? "full" : ratio >= 0.8 ? "near" : "ok";
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-medium text-on-surface">{label}</span>
        <span className="flex items-center gap-2 tabular-nums text-on-surface">
          {t("limits.usedOf", { used: formatNumber(used), limit: formatNumber(limit) })}
          {state === "full" && <StatusBadge tone="danger">{t("limits.full")}</StatusBadge>}
          {state === "near" && <StatusBadge tone="warning">{t("limits.near")}</StatusBadge>}
        </span>
      </div>
      <Progress
        value={pct}
        aria-label={`${label}: ${t("limits.usedOf", { used: formatNumber(used), limit: formatNumber(limit) })}`}
        trackClassName="h-2"
        indicatorClassName={cn(state === "full" ? "bg-red-600" : state === "near" ? "bg-amber-500" : "bg-primary")}
      />
    </div>
  );
}
