"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ProfileSheet } from "@/components/ProfileSheet";
import { NAV_ITEMS, isActivePath, mobilePrimaryItems } from "@/components/shell/nav";
import { useRoleLabel, useShell } from "@/components/shell/ShellProvider";
import { cn } from "@/lib/utils";

/**
 * Desktop: a slim top strip with the brand, help and the signed-in person
 * (the sidebar holds the navigation). Phones: a bottom bar with four
 * destinations and "More", which opens the sheet with everything else.
 */
export default function Navbar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const { user, access } = useShell();
  const roleLabel = useRoleLabel();
  const [sheetOpen, setSheetOpen] = useState(false);
  const displayName = user?.name || user?.email || t("personal");
  const initial = displayName[0]?.toUpperCase() ?? "?";

  const primary = mobilePrimaryItems(access);
  const primaryActive = primary.some((key) => isActivePath(pathname, NAV_ITEMS[key].href));

  return (
    <>
      {/* Desktop: brand strip */}
      <header className="hidden md:flex print:hidden fixed top-0 left-0 right-0 z-50 h-16 items-center justify-between border-b border-outline-variant/15 bg-surface-container-lowest/85 px-6 py-3.5 backdrop-blur-xl">
        <div className="flex items-center gap-3 pl-64">
          <div
            className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary-container text-[11px] font-black text-on-primary select-none"
            aria-hidden="true"
          >
            BD
          </div>
          <span className="font-headline text-[15px] font-bold tracking-tight text-on-surface">{tc("appName")}</span>
          <span className="text-sm text-outline-variant/60 select-none" aria-hidden="true">·</span>
          <span className="text-xs font-medium text-on-surface-variant">{tc("brandTagline")}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/help"
            title={t("help")}
            className="flex size-8 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">help_outline</span>
            <span className="sr-only">{t("help")}</span>
          </Link>

          <div className="h-5 w-px bg-outline-variant/30" aria-hidden="true" />

          <Link
            href="/settings"
            title={t("settings")}
            className="flex items-center gap-2.5 rounded-xl py-1 pl-0.5 pr-2 transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="sr-only">{t("settings")}</span>
            <span
              className="flex size-8 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-container text-xs font-bold text-on-primary select-none"
              aria-hidden="true"
            >
              {initial}
            </span>
            <span className="hidden max-w-56 lg:block">
              <span className="block truncate text-xs font-semibold leading-tight text-on-surface">{displayName}</span>
              <span className="block truncate text-[10px] leading-tight text-on-surface-variant">{roleLabel}</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Phones: bottom bar */}
      <nav
        aria-label={t("mainMenu")}
        className="md:hidden fixed bottom-0 left-0 z-50 flex w-full items-stretch justify-around gap-1 rounded-t-3xl border-t border-outline-variant/20 bg-surface-container-lowest/92 px-2 pb-6 pt-2 shadow-2xl backdrop-blur-2xl"
      >
        {primary.map((key) => {
          const { href, icon } = NAV_ITEMS[key];
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center rounded-2xl px-1 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                active ? "bg-primary/10 text-primary" : "text-on-surface-variant"
              )}
            >
              <span className={cn("material-symbols-outlined text-[22px]", active && "icon-filled")} aria-hidden="true">
                {icon}
              </span>
              <span className="mt-0.5 max-w-full truncate text-[10px] font-medium">
                {key === "controlCenter" ? t("controlCenterShort") : t(key)}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          className={cn(
            "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center rounded-2xl px-1 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-primary",
            sheetOpen || !primaryActive ? "bg-primary/10 text-primary" : "text-on-surface-variant"
          )}
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">menu</span>
          <span className="mt-0.5 max-w-full truncate text-[10px] font-medium">{t("more")}</span>
        </button>
      </nav>

      <ProfileSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
