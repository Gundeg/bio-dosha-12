"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BEDIStatus } from "@/lib/bediEngine";
import { RemedyResult } from "@/lib/remedyEngine";
import { translateRemedy } from "@/lib/remedyTranslations";

interface RemedyPanelProps {
  status: BEDIStatus;
  remedyResult: RemedyResult;
}

type Tab = "remedy" | "lifestyle" | "avoid" | "risk";

/** Tab labels live under remedy.tabs.<id>. */
const TAB_CONFIG: { id: Tab; icon: string }[] = [
  { id: "remedy",    icon: "✦" },
  { id: "lifestyle", icon: "◎" },
  { id: "avoid",     icon: "✕" },
  { id: "risk",      icon: "⚠" },
];

const STATUS_ACCENT: Record<BEDIStatus, { border: string; bg: string; text: string; pill: string }> = {
  khii_excess:       { border: "border-blue-200",   bg: "bg-blue-50",   text: "text-blue-700",   pill: "bg-blue-100 text-blue-700" },
  balanced:          { border: "border-emerald-200", bg: "bg-emerald-50",text: "text-emerald-700",pill: "bg-emerald-100 text-emerald-700" },
  shar_badgan_excess:{ border: "border-red-200",     bg: "bg-red-50",    text: "text-red-700",    pill: "bg-red-100 text-red-700" },
};

const VALIDATION_STYLE = {
  OK:            { bg: "bg-emerald-50 border-emerald-200", icon: "✓", text: "text-emerald-700" },
  WARNING:       { bg: "bg-amber-50 border-amber-200",     icon: "⚠", text: "text-amber-700" },
  CONTRAINDICATED:{ bg: "bg-red-50 border-red-200",        icon: "✕", text: "text-red-700" },
};

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

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
      {/* Logic Gate warning — validateRemedy */}
      {validation && validation.status !== "OK" && (
        <div className={`flex items-start gap-2 mx-4 mt-4 border rounded-lg px-3 py-2.5 text-xs ${VALIDATION_STYLE[validation.status].bg}`}>
          <span className={`shrink-0 font-bold ${VALIDATION_STYLE[validation.status].text}`} aria-hidden="true">
            {VALIDATION_STYLE[validation.status].icon}
          </span>
          <span className={VALIDATION_STYLE[validation.status].text}>
            <span className="font-semibold">{t("safetyCheck")}: </span>
            {translateRemedy(validation.action, locale)}
          </span>
        </div>
      )}

      {/* Tab bar — labels stay visible on phones (short text, wraps if needed) */}
      <div className="flex border-b border-slate-100 bg-slate-50 mt-4" role="tablist" aria-label={t("tablistLabel")}>
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
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 px-1 sm:px-2 text-[11px] sm:text-xs font-semibold leading-tight text-center transition-all border-b-2 ${
                isActive
                  ? `border-current ${accent.text} bg-white`
                  : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <span className="text-base leading-none" aria-hidden="true">{icon}</span>
              <span>{t(`tabs.${id}`)}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? accent.pill : "bg-slate-200 text-slate-600"
                }`}
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
          <p className="text-sm text-slate-600 text-center py-4">{t("empty")}</p>
        ) : (
          <ul className="space-y-2">
            {currentItems.map((item, i) => (
              <li
                key={i}
                className={`flex items-start gap-3 text-sm px-3 py-2.5 rounded-lg ${accent.bg}`}
              >
                <span
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    activeTab === "remedy"    ? "bg-emerald-700"
                    : activeTab === "lifestyle" ? "bg-indigo-700"
                    : activeTab === "avoid"   ? "bg-red-700"
                    : "bg-amber-700"
                  }`}
                  aria-hidden="true"
                >
                  {activeTab === "remedy" ? "✓" : activeTab === "lifestyle" ? "◎" : activeTab === "avoid" ? "✕" : "!"}
                </span>
                <span className="text-slate-700 leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Age note footer */}
      {ageNote && (
        <div className="px-4 pb-4">
          <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-600">
            <span className="shrink-0 mt-0.5 text-slate-500" aria-hidden="true">ℹ</span>
            <span>
              <span className="font-semibold text-slate-700">{t("ageNote")}: </span>
              {translateRemedy(ageNote, locale)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
