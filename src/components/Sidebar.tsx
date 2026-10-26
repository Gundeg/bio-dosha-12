"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LocaleToggle } from "@/components/LocaleToggle";
import { OrgNavHint, useOrgSectionTitle } from "@/components/shell/OrgNavHint";
import { OrgSwitcher } from "@/components/shell/OrgSwitcher";
import { ACCOUNT_ITEMS, NAV_ITEMS, isActivePath, navSections } from "@/components/shell/nav";
import { useRoleLabel, useShell } from "@/components/shell/ShellProvider";
import { cn } from "@/lib/utils";

function NavItem({
  href,
  label,
  icon,
  active,
  hint,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  hint?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-l-full py-2.5 pl-4 pr-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
          active
            ? "bg-surface-container-lowest font-semibold text-primary shadow-sm"
            : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" aria-hidden="true" />
        )}
        <span
          className={cn("material-symbols-outlined text-[20px]", active ? "icon-filled text-primary" : "group-hover:text-on-surface")}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate">{label}</span>
          {hint}
        </span>
      </Link>
    </li>
  );
}

/** Desktop navigation: personal, organization and control center sections, then account links. */
export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { user, access } = useShell();
  const roleLabel = useRoleLabel();
  const orgSectionTitle = useOrgSectionTitle();
  const displayName = user?.name || user?.email || t("personal");
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <aside className="hidden md:flex print:hidden flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low z-40 border-r border-outline-variant/10">
      {/* Clears the fixed top bar (h-16) */}
      <div className="h-16 shrink-0" />

      {/* User card */}
      <div className="space-y-3 border-b border-outline-variant/10 px-4 py-4">
        <div className="flex items-center gap-3 px-2">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-container text-sm font-bold text-on-primary select-none"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate font-headline text-sm font-bold leading-tight text-on-surface">{displayName}</p>
            <p className="mt-0.5 truncate text-[11px] leading-tight text-on-surface-variant" title={roleLabel}>
              {roleLabel}
            </p>
          </div>
        </div>
        <OrgSwitcher className="px-2" />
      </div>

      <nav aria-label={t("mainMenu")} className="flex flex-1 flex-col overflow-y-auto py-3 pl-3">
        {navSections(access).map((section, index) => (
          <div key={section.id} className={cn(index > 0 && "mt-3 border-t border-outline-variant/15 pt-3")}>
            <p
              id={`sidebar-${section.id}`}
              className="mb-2 truncate px-4 pr-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80 select-none"
            >
              {section.id === "organization" ? orgSectionTitle : t(`${section.id}Section`)}
            </p>
            <ul aria-labelledby={`sidebar-${section.id}`} className="space-y-0.5">
              {section.items.map((key) => (
                <NavItem
                  key={key}
                  href={NAV_ITEMS[key].href}
                  icon={NAV_ITEMS[key].icon}
                  label={t(key)}
                  active={isActivePath(pathname, NAV_ITEMS[key].href)}
                  hint={key === "organization" ? <OrgNavHint className="text-[11px]" /> : undefined}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Quick action and account */}
      <div className="space-y-3 border-t border-outline-variant/10 px-4 pb-6 pt-3">
        <Link
          href="/calculator?new=1"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add_circle</span>
          {t("newCalculation")}
        </Link>

        <ul className="flex flex-col gap-0.5" aria-label={t("accountSection")}>
          {ACCOUNT_ITEMS.map((key) => {
            const active = isActivePath(pathname, NAV_ITEMS[key].href);
            return (
              <li key={key}>
                <Link
                  href={NAV_ITEMS[key].href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                    active
                      ? "bg-surface-container-lowest font-semibold text-primary"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{NAV_ITEMS[key].icon}</span>
                  {t(key)}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-on-surface-variant transition-colors hover:bg-error/5 hover:text-error focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">logout</span>
              {t("logout")}
            </button>
          </li>
        </ul>
        <div className="px-3">
          <LocaleToggle />
        </div>
      </div>
    </aside>
  );
}
