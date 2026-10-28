"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LocaleToggle } from "@/components/LocaleToggle";
import { OrgNavHint, useOrgSectionTitle } from "@/components/shell/OrgNavHint";
import { OrgSwitcher } from "@/components/shell/OrgSwitcher";
import { ACCOUNT_ITEMS, NAV_ITEMS, isActivePath, mobilePrimaryItems, navSections } from "@/components/shell/nav";
import { useRoleLabel, useShell } from "@/components/shell/ShellProvider";
import { useSignOut } from "@/components/shell/useSignOut";
import { cn } from "@/lib/utils";

function SheetItem({
  href,
  label,
  icon,
  active,
  hint,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  hint?: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
          active ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container"
        )}
      >
        <span
          className={cn("material-symbols-outlined text-[20px]", active ? "icon-filled text-primary" : "text-on-surface-variant")}
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

/**
 * The phone "More" sheet: everything the bottom bar has no room for, the
 * organization switcher, settings, help, language and sign-out.
 */
export function ProfileSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { signOut, pending: signingOut } = useSignOut();
  const { user, access } = useShell();
  const roleLabel = useRoleLabel();
  const orgSectionTitle = useOrgSectionTitle();
  const displayName = user?.name || user?.email || t("personal");
  const initial = displayName[0]?.toUpperCase() ?? "?";
  const close = () => onOpenChange(false);

  const inBottomBar = new Set(mobilePrimaryItems(access));
  const sections = navSections(access)
    .map((section) => ({ ...section, items: section.items.filter((key) => !inBottomBar.has(key)) }))
    .filter((section) => section.items.length > 0);

  const renderItem = (key: keyof typeof NAV_ITEMS) => (
    <SheetItem
      key={key}
      href={NAV_ITEMS[key].href}
      label={t(key)}
      icon={NAV_ITEMS[key].icon}
      active={isActivePath(pathname, NAV_ITEMS[key].href)}
      hint={key === "organization" ? <OrgNavHint className="text-xs" /> : undefined}
      onNavigate={close}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 left-0 right-0 translate-x-0 translate-y-0 w-full max-w-full sm:max-w-full max-h-[85dvh] overflow-y-auto rounded-b-none rounded-t-3xl p-0 gap-0 data-open:slide-in-from-bottom-8 data-closed:slide-out-to-bottom-8"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-outline-variant/40" />
        </div>

        <DialogTitle className="sr-only">{t("menu")}</DialogTitle>

        {/* Person */}
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant/15 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-container text-base font-bold text-on-primary select-none"
              aria-hidden="true"
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-on-surface-variant">{roleLabel}</p>
            </div>
          </div>
          <LocaleToggle />
        </div>

        <OrgSwitcher className="px-5 pt-4" onSwitched={close} />

        <nav aria-label={t("menu")} className="px-2 py-2">
          {sections.map((section) => (
            <div key={section.id} className="border-b border-outline-variant/15 py-1.5">
              <p
                id={`sheet-${section.id}`}
                className="truncate px-4 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80 select-none"
              >
                {section.id === "organization" ? orgSectionTitle : t(`${section.id}Section`)}
              </p>
              <ul aria-labelledby={`sheet-${section.id}`}>{section.items.map(renderItem)}</ul>
            </div>
          ))}

          <ul className="border-b border-outline-variant/15 py-1.5" aria-label={t("accountSection")}>
            {ACCOUNT_ITEMS.map(renderItem)}
          </ul>

          <div className="py-1.5">
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={signingOut}
              aria-busy={signingOut || undefined}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
              {t("logout")}
            </button>
          </div>
        </nav>

        <div className="h-6" aria-hidden="true" />
      </DialogContent>
    </Dialog>
  );
}
