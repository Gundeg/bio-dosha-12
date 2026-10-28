"use client";

import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

/** Share of a plan limit at which the meter turns amber. */
const WARN_AT = 0.8;

/**
 * "3 of 5 used" with a bar. A null or missing limit means unlimited: the
 * count is shown without a bar. Amber from 80%, with a text note (not color alone).
 */
export function UsageMeter({
  label,
  used,
  limit,
  hint,
}: {
  label: string;
  used: number;
  limit: number | null | undefined;
  hint?: React.ReactNode;
}) {
  const t = useTranslations("settings.shared");
  const unlimited = limit === null || limit === undefined;
  const ratio = unlimited ? 0 : limit <= 0 ? 1 : used / limit;
  const level = unlimited ? "ok" : ratio >= 1 ? "full" : ratio >= WARN_AT ? "near" : "ok";
  const valueText = unlimited
    ? t("usageUnlimited", { used: formatNumber(used) })
    : t("usageOf", { used: formatNumber(used), limit: formatNumber(limit) });
  const spokenText = unlimited
    ? valueText
    : t("usageOfAria", { used: formatNumber(used), limit: formatNumber(limit) });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-on-surface">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-on-surface">{valueText}</span>
      </div>
      {!unlimited && (
        <Progress
          value={Math.min(100, Math.round(ratio * 100))}
          aria-label={label}
          aria-valuetext={spokenText}
          trackClassName="h-2 bg-surface-container"
          indicatorClassName={cn(level === "ok" ? "bg-primary" : level === "near" ? "bg-amber-500" : "bg-red-600")}
        />
      )}
      {level !== "ok" && (
        <p className={cn("flex items-center gap-1 text-xs font-medium", level === "near" ? "text-amber-800" : "text-red-800")}>
          <Icon name={level === "near" ? "warning" : "block"} className="size-4" />
          {level === "near" ? t("nearLimit") : t("atLimit")}
        </p>
      )}
      {hint && <p className="text-xs text-on-surface-variant">{hint}</p>}
    </div>
  );
}
