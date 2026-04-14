"use client";

import { ReactNode } from "react";

// ── InfoItem ──────────────────────────────────────────────────────────────────

export interface InfoItemData {
  iconBg: string;    // e.g. "bg-primary/10"
  iconColor: string; // e.g. "text-primary"
  icon: string;      // emoji or short symbol
  title: string;
  body: string;
}

export function InfoItem({ iconBg, iconColor, icon, title, body }: InfoItemData) {
  return (
    <div className="p-4 bg-surface-container-lowest rounded-xl hover:shadow-ambient transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className={`${iconBg} p-2 rounded-lg ${iconColor} shrink-0 text-base leading-none`}>
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-xs text-on-surface mb-0.5">{title}</h4>
          <p className="text-[11px] text-on-surface-variant leading-snug">{body}</p>
        </div>
      </div>
    </div>
  );
}

// ── InfoPanel ─────────────────────────────────────────────────────────────────

interface InfoPanelProps {
  badge?: string;
  title: string;
  description?: string;
  items?: InfoItemData[];
  footer?: string;
  children?: ReactNode;
}

export function InfoPanel({ badge, title, description, items, footer, children }: InfoPanelProps) {
  return (
    <aside className="hidden xl:block w-72 shrink-0">
      <div className="sticky top-8 space-y-3">
        <div className="bg-surface-container-low rounded-2xl p-6 border border-primary/5">
          {badge && (
            <div className="flex items-center gap-1.5 text-secondary mb-3">
              <span className="text-xs">✦</span>
              <span className="font-bold text-[10px] uppercase tracking-wider">{badge}</span>
            </div>
          )}
          <h2 className="font-headline font-bold text-on-surface text-sm mb-1">{title}</h2>
          {description && (
            <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">{description}</p>
          )}
          <div className="space-y-2.5">
            {items?.map((item, i) => <InfoItem key={i} {...item} />)}
            {children}
          </div>
          {footer && (
            <p className="text-[10px] text-on-surface-variant/60 mt-4 italic leading-relaxed border-t border-surface-container-high pt-3">
              {footer}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
