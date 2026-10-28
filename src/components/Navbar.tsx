"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ProfileSheet } from "@/components/ProfileSheet";
import { NAV_ITEMS, isActivePath, mobilePrimaryItems } from "@/components/shell/nav";
import { useShell } from "@/components/shell/ShellProvider";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const TAB =
  "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";

/**
 * Phones: a bottom bar with the four places used most and "Цэс", which opens
 * the sheet with everything else (more places, account, language, sign out).
 * Desktop navigation is the sidebar alone.
 */
export default function Navbar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { access } = useShell();
  const [sheetOpen, setSheetOpen] = useState(false);

  const primary = mobilePrimaryItems(access);
  const primaryActive = primary.some((key) => isActivePath(pathname, NAV_ITEMS[key].href));

  return (
    <>
      <nav
        aria-label={t("mainMenu")}
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-outline-variant bg-surface-container-lowest pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
      >
        {primary.map((key) => {
          const { href, icon } = NAV_ITEMS[key];
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(TAB, active ? "text-primary" : "text-on-surface-variant")}
            >
              <Icon name={icon} className="size-[22px]" />
              <span className="max-w-full truncate">{key === "controlCenter" ? t("controlCenterShort") : t(key)}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          className={cn(TAB, sheetOpen || !primaryActive ? "text-primary" : "text-on-surface-variant")}
        >
          <Icon name="menu" className="size-[22px]" />
          <span className="max-w-full truncate">{t("menu")}</span>
        </button>
      </nav>

      <ProfileSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
