"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BEDIStatus } from "@/lib/bediEngine";
import { RemedyResult } from "@/lib/remedyEngine";
import { translateRemedy } from "@/lib/remedyTranslations";
import { Callout } from "@/components/kit/layout";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface RemedyPanelProps {
  status: BEDIStatus;
  remedyResult: RemedyResult;
}

type Tab = "remedy" | "lifestyle" | "avoid" | "risk";

/**
 * Tab labels live under remedy.tabs.<id>. `marker` is the icon in front of each
 * item, coloured by what the list means (do, routine, avoid, watch out).
 */
const TAB_CONFIG: { id: Tab; icon: IconName; marker: IconName; markerColor: string }[] = [
  { id: "remedy",    icon: "spa",           marker: "check",         markerColor: "text-emerald-700" },
  { id: "lifestyle", icon: "monitor_heart", marker: "chevron_right", markerColor: "text-primary" },
  { id: "avoid",     icon: "block",         marker: "close",         markerColor: "text-red-700" },
  { id: "risk",      icon: "warning",       marker: "priority_high", markerColor: "text-amber-700" },
];

/** The active tab takes the colour of the BEDI status (Шар/Бадган uses the Fire colour). */
const STATUS_ACCENT: Record<BEDIStatus, { text: string; pill: string }> = {
  khii_excess:        { text: "text-primary",     pill: "bg-primary/10 text-primary" },
  balanced:           { text: "text-emerald-700", pill: "bg-emerald-50 text-emerald-700" },
  shar_badgan_excess: { text: "text-secondary",   pill: "bg-secondary/10 text-secondary" },
};

const VALIDATION_TONE = {
  WARNING:         { tone: "warning", icon: "warning" },
  CONTRAINDICATED: { tone: "danger",  icon: "block" },
} as const;

export default function RemedyPanel({ status, remedyResult }: RemedyPanelProps) {
  const t = useTranslations("remedy");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>("remedy");
  const { remedies, avoidFoods, riskFactors, ageNote, lifestyle, validation } = remedyResult;
  const accent = STATUS_ACCENT[status];

  // Engine text (and stored recommendations) is Mongolian; show it in the UI language.
  const tr = (items: string[]) => items.map((item) => translateRemedy(item, locale));
  const tabItems: Record<Tab, string[]> = {
    remedy:    tr(remedies),
    lifestyle: tr(lifestyle ?? []),
    avoid:     tr(avoidFoods),
    risk:      tr(riskFactors),
  };

  const currentItems = tabItems[activeTab];
  const activeConfig = TAB_CONFIG.find((c) => c.id === activeTab) ?? TAB_CONFIG[0];
  const warning = validation && validation.status !== "OK" ? VALIDATION_TONE[validation.status] : null;

  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient">
      {/* Logic Gate warning — validateRemedy */}
      {validation && warning && (
        <div className="px-4 pt-4">
          <Callout tone={warning.tone} icon={warning.icon} className="p-3">
            <span className="font-semibold">{t("safetyCheck")}: </span>
            {translateRemedy(validation.action, locale)}
          </Callout>
        </div>
      )}

      {/* Tab bar — labels stay visible on phones (short text, wraps if needed) */}
      <div
        className={cn("flex border-b border-outline-variant", warning && "mt-4")}
        role="tablist"
        aria-label={t("tablistLabel")}
      >
        {TAB_CONFIG.map(({ id, icon }, index) => {
          const count = tabItems[id].length;
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              id={`remedy-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="remedy-tabpanel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(id)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                e.preventDefault();
                const step = e.key === "ArrowRight" ? 1 : -1;
                const next = TAB_CONFIG[(index + step + TAB_CONFIG.length) % TAB_CONFIG.length];
                setActiveTab(next.id);
                document.getElementById(`remedy-tab-${next.id}`)?.focus();
              }}
              className={cn(
                "-mb-px flex min-w-0 flex-1 flex-col items-center gap-1 border-b-2 px-1 py-3 text-center text-xs font-medium leading-tight transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:px-2",
                isActive
                  ? cn("border-current", accent.text)
                  : "border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              )}
            >
              <Icon name={icon} className="size-[18px]" />
              <span>{t(`tabs.${id}`)}</span>
              <span
                className={cn(
                  "rounded-md px-1.5 text-[11px] font-medium tabular-nums",
                  isActive ? accent.pill : "bg-surface-container text-on-surface-variant"
                )}
                aria-hidden="true"
              >
                {count}
              </span>
              <span className="sr-only">{t("itemCount", { count })}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4" role="tabpanel" id="remedy-tabpanel" aria-labelledby={`remedy-tab-${activeTab}`}>
        {currentItems.length === 0 ? (
          <p className="py-4 text-center text-sm text-on-surface-variant">{t("empty")}</p>
        ) : (
          <ul className="space-y-2">
            {currentItems.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg bg-surface-container-low px-3 py-2.5 text-sm"
              >
                <Icon name={activeConfig.marker} className={cn("mt-0.5 size-4", activeConfig.markerColor)} />
                <span className="leading-snug text-on-surface">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Age note footer */}
      {ageNote && (
        <div className="px-4 pb-4">
          <div className="flex items-start gap-2 rounded-lg bg-surface-container-low px-3 py-2.5 text-xs text-on-surface-variant">
            <Icon name="info" className="mt-px size-4" />
            <span>
              <span className="font-semibold text-on-surface">{t("ageNote")}: </span>
              {translateRemedy(ageNote, locale)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
