"use client";

import { useState } from "react";
import { BEDIStatus } from "@/lib/bediEngine";
import { RemedyResult } from "@/lib/remedyEngine";

interface RemedyPanelProps {
  status: BEDIStatus;
  remedyResult: RemedyResult;
}

type Tab = "remedy" | "lifestyle" | "avoid" | "risk";

const TAB_CONFIG: { id: Tab; label: string; icon: string }[] = [
  { id: "remedy",    label: "Алтан Ерөндөг", icon: "✦" },
  { id: "lifestyle", label: "Амьдралын хэв", icon: "◎" },
  { id: "avoid",     label: "Хориглох",      icon: "✕" },
  { id: "risk",      label: "Эрсдэл",        icon: "⚠" },
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
  const [activeTab, setActiveTab] = useState<Tab>("remedy");
  const { remedies, avoidFoods, riskFactors, ageNote, lifestyle, validation } = remedyResult;
  const accent = STATUS_ACCENT[status];

  const tabItems: Record<Tab, string[]> = {
    remedy:    remedies,
    lifestyle: lifestyle ?? [],
    avoid:     avoidFoods,
    risk:      riskFactors,
  };

  const currentItems = tabItems[activeTab];

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
      {/* Logic Gate warning — validateRemedy */}
      {validation && validation.status !== "OK" && (
        <div className={`flex items-start gap-2 mx-4 mt-4 border rounded-lg px-3 py-2.5 text-xs ${VALIDATION_STYLE[validation.status].bg}`}>
          <span className={`shrink-0 font-bold ${VALIDATION_STYLE[validation.status].text}`}>
            {VALIDATION_STYLE[validation.status].icon}
          </span>
          <span className={VALIDATION_STYLE[validation.status].text}>
            <span className="font-semibold">Logic Gate: </span>
            {validation.action}
          </span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-slate-100 bg-slate-50 mt-4">
        {TAB_CONFIG.map(({ id, label, icon }) => {
          const count = tabItems[id].length;
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 px-2 text-xs font-semibold transition-all border-b-2 ${
                isActive
                  ? `border-current ${accent.text} bg-white`
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? accent.pill : "bg-slate-200 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4">
        {currentItems.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Мэдээлэл байхгүй</p>
        ) : (
          <ul className="space-y-2">
            {currentItems.map((item, i) => (
              <li
                key={i}
                className={`flex items-start gap-3 text-sm px-3 py-2.5 rounded-lg ${accent.bg}`}
              >
                <span
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    activeTab === "remedy"    ? "bg-emerald-500"
                    : activeTab === "lifestyle" ? "bg-indigo-500"
                    : activeTab === "avoid"   ? "bg-red-500"
                    : "bg-amber-500"
                  }`}
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
          <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-500">
            <span className="shrink-0 mt-0.5 text-slate-400">ℹ</span>
            <span>
              <span className="font-semibold text-slate-600">Насны зөвлөмж: </span>
              {ageNote}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
