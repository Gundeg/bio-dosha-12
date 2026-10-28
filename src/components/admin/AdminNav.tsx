"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { TAB_STRIP_CLASS, tabItemClass } from "@/components/settings/shared/PageTabs";

const SECTIONS = [
  { href: "/admin", key: "overview", icon: "space_dashboard", superadmin: false },
  { href: "/admin/organizations", key: "organizations", icon: "domain", superadmin: false },
  { href: "/admin/users", key: "users", icon: "group", superadmin: false },
  { href: "/admin/plans", key: "plans", icon: "workspace_premium", superadmin: false },
  { href: "/admin/invites", key: "invites", icon: "forward_to_inbox", superadmin: false },
  { href: "/admin/audit", key: "audit", icon: "receipt_long", superadmin: true },
  { href: "/admin/system", key: "system", icon: "monitor_heart", superadmin: true },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Control-center sections. Scrolls sideways on phones; the active tab stays in view. */
export function AdminNav({ isSuperadmin }: { isSuperadmin: boolean }) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const items = SECTIONS.filter((s) => !s.superadmin || isSuperadmin);

  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>("[aria-current='page']");
    if (!list || !active) return;
    // Scroll only the tab strip, never the page.
    const left = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ left: Math.max(0, left), behavior: reduceMotion ? "auto" : "smooth" });
  }, [pathname]);

  return (
    <nav aria-label={t("layout.navLabel")}>
      {/* The list is the scroll container, so the active tab can be scrolled into view. */}
      <ul ref={listRef} className={cn(TAB_STRIP_CLASS, "relative flex gap-1")}>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link href={item.href} aria-current={active ? "page" : undefined} className={tabItemClass(active)}>
                <Icon name={item.icon} className="size-[18px]" />
                {t(`nav.${item.key}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
