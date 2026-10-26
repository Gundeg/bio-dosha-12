"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

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
    <nav aria-label={t("layout.navLabel")} className="border-t border-outline-variant/20">
      <ul ref={listRef} className="relative flex gap-1 overflow-x-auto px-2 sm:px-3">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-12 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                  active ? "text-primary" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                )}
              >
                <span
                  className={cn("material-symbols-outlined text-[20px]", active && "icon-filled")}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                {t(`nav.${item.key}`)}
                {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
