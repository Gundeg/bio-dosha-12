"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AccountMenu } from "@/components/shell/AccountMenu";
import { BrandMark } from "@/components/shell/BrandMark";
import { OrgNavHint, useOrgSectionTitle } from "@/components/shell/OrgNavHint";
import { OrgSwitcher } from "@/components/shell/OrgSwitcher";
import { NAV_ITEMS, isActivePath, navSections } from "@/components/shell/nav";
import { useShell } from "@/components/shell/ShellProvider";
import { Icon, type IconName } from "@/components/ui/icon";
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
  icon: IconName;
  active: boolean;
  hint?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-9 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
          active
            ? "bg-primary/8 font-medium text-primary"
            : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
        )}
      >
        <Icon name={icon} className="size-[18px]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate">{label}</span>
          {hint}
        </span>
      </Link>
    </li>
  );
}

/**
 * Desktop navigation: the places to work in, grouped by who they belong to
 * (personal, organization, platform). Everything about the account itself
 * (settings, help, language, sign out) sits in the account menu at the foot.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { access } = useShell();
  const orgSectionTitle = useOrgSectionTitle();
  const sections = navSections(access);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-outline-variant bg-surface-container-lowest md:flex print:hidden">
      <div className="px-4 pb-3 pt-5">
        <BrandMark compact />
      </div>

      <OrgSwitcher className="px-4 pb-2" />

      <nav aria-label={t("mainMenu")} className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-2">
        {sections.map((section) => {
          const labelled = sections.length > 1;
          const labelId = `sidebar-${section.id}`;
          return (
            <div key={section.id}>
              {labelled && (
                <p id={labelId} className="truncate px-3 pb-1.5 text-xs font-medium text-on-surface-variant">
                  {section.id === "organization" ? orgSectionTitle : t(`${section.id}Section`)}
                </p>
              )}
              <ul aria-labelledby={labelled ? labelId : undefined} className="space-y-0.5">
                {section.items.map((key) => (
                  <NavItem
                    key={key}
                    href={NAV_ITEMS[key].href}
                    icon={NAV_ITEMS[key].icon}
                    label={t(key)}
                    active={isActivePath(pathname, NAV_ITEMS[key].href)}
                    hint={key === "organization" ? <OrgNavHint className="text-xs" /> : undefined}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-outline-variant p-2">
        <AccountMenu />
      </div>
    </aside>
  );
}
