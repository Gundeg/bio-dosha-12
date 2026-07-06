"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LocaleToggle } from "@/components/LocaleToggle";

const NAV_LINKS = [
  { href: "/dashboard",       key: "dashboard",       icon: "dashboard" },
  { href: "/calculator",      key: "calculator",      icon: "calculate" },
  { href: "/history",         key: "history",         icon: "history" },
  { href: "/family",          key: "family",          icon: "group" },
  { href: "/recommendations", key: "recommendations", icon: "spa" },
] as const;

const PRACTITIONER_LINKS = [
  { href: "/patients", key: "patients", icon: "stethoscope" },
  { href: "/reports",  key: "reports",  icon: "summarize" },
] as const;

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 pl-4 pr-5 py-2.5 text-sm font-medium transition-all duration-150 rounded-l-[9999px] relative ${
        active
          ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
      )}
      <span className={`material-symbols-outlined text-[20px] transition-colors ${active ? "icon-filled text-primary" : "group-hover:text-on-surface"}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const isPractitioner = session?.user?.role === "PRACTITIONER";
  const isAdmin = session?.user?.role === "ADMIN";
  const initial = session?.user?.name?.[0]?.toUpperCase() ?? "B";

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low z-40 border-r border-outline-variant/10">
      {/* Top spacer — clears the fixed navbar (h-16) */}
      <div className="h-16 shrink-0" />

      {/* User card */}
      <div className="px-4 py-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-3 px-2">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary to-primary-container flex items-center justify-center text-on-primary text-sm font-bold">
              {initial}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-surface-container-low" />
          </div>
          <div className="min-w-0">
            <p className="font-headline font-bold text-on-surface text-sm leading-tight truncate">
              {session?.user?.name ?? t("roleUser")}
            </p>
            <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
              {isPractitioner ? t("roleSpecialist") : isAdmin ? t("roleAdmin") : t("roleUser")}
            </p>
          </div>
        </div>
      </div>

      {/* Nav — main section */}
      <nav className="flex-1 flex flex-col pl-3 pr-0 py-3 overflow-y-auto">
        <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 select-none">
          {t("mainMenu")}
        </p>

        <div className="space-y-0.5">
          {NAV_LINKS.map((link) => (
            <NavItem key={link.href} href={link.href} label={t(link.key)} icon={link.icon} active={pathname === link.href} />
          ))}
        </div>

        {isPractitioner && (
          <>
            <div className="my-3 mx-4 border-t border-outline-variant/15" />
            <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 select-none">
              {t("specialistSection")}
            </p>
            <div className="space-y-0.5">
              {PRACTITIONER_LINKS.map((link) => (
                <NavItem key={link.href} href={link.href} label={t(link.key)} icon={link.icon} active={pathname === link.href} />
              ))}
            </div>
          </>
        )}

        {isAdmin && (
          <>
            <div className="my-3 mx-4 border-t border-outline-variant/15" />
            <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 select-none">
              {t("adminSection")}
            </p>
            <div className="space-y-0.5">
              <NavItem href="/admin" label={t("admin")} icon="admin_panel_settings" active={pathname === "/admin"} />
            </div>
          </>
        )}
      </nav>

      {/* Bottom: quick action + utility */}
      <div className="px-4 pb-6 space-y-3 border-t border-outline-variant/10 pt-3">
        <Link
          href="/calculator?new=1"
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          {t("newCalculation")}
        </Link>

        <div className="flex flex-col gap-0.5">
          <Link
            href="/help"
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">contact_support</span>
            {t("help")}
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            {t("logout")}
          </button>
          <div className="px-3 pt-2">
            <LocaleToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
