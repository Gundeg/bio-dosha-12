"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ProfileSheet } from "@/components/ProfileSheet";

const MOBILE_NAV = [
  { href: "/dashboard",       key: "dashboard",       icon: "dashboard" },
  { href: "/calculator",      key: "calculator",      icon: "calculate" },
  { href: "/history",         key: "history",         icon: "history" },
  { href: "/recommendations", key: "recommendations", icon: "spa" },
] as const;

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const [sheetOpen, setSheetOpen] = useState(false);
  const initial = session?.user?.name?.[0]?.toUpperCase() ?? "?";

  const roleLabel =
    session?.user?.role === "PRACTITIONER"
      ? t("roleSpecialist")
      : session?.user?.role === "ADMIN"
      ? t("roleAdmin")
      : t("roleUser");

  return (
    <>
      {/* Desktop: brand strip — sidebar handles nav, this is just identity + user */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-6 py-3.5 bg-surface-container-lowest/85 backdrop-blur-xl border-b border-outline-variant/15 h-16">
        {/* Brand */}
        <div className="flex items-center gap-3 pl-64">
          <div className="w-7 h-7 bg-linear-to-br from-primary to-primary-container rounded-lg flex items-center justify-center text-on-primary text-[11px] font-black select-none">
            BD
          </div>
          <span className="font-headline font-bold text-[15px] text-on-surface tracking-tight">
            {tc("appName")}
          </span>
          <span className="text-outline-variant/60 text-sm select-none">·</span>
          <span className="text-on-surface-variant text-xs font-medium">
            {tc("brandTagline")}
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/help"
            title={t("help")}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
            <span className="sr-only">{t("help")}</span>
          </Link>

          <div className="w-px h-5 bg-outline-variant/30" />

          <div className="flex items-center gap-2.5 pl-0.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-on-primary text-xs font-bold bg-linear-to-br from-primary to-primary-container select-none">
              {initial}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-on-surface leading-tight">
                {session?.user?.name ?? t("roleUser")}
              </p>
              <p className="text-[10px] text-on-surface-variant leading-tight">{roleLabel}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: glass bottom tray */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-6 pt-2 bg-surface-container-lowest/92 backdrop-blur-2xl z-50 rounded-t-3xl shadow-2xl border-t border-outline-variant/20">
        {MOBILE_NAV.map(({ href, key, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center rounded-2xl px-3 py-2 transition-all ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant"
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${active ? "icon-filled" : ""}`}>
                {icon}
              </span>
              <span className="text-[10px] font-medium mt-0.5">{t(key)}</span>
            </Link>
          );
        })}

        {/* Профайл — гарах, гэр бүл, тусламжийн цорын ганц мобайл зам */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          className={`flex flex-col items-center justify-center rounded-2xl px-3 py-2 transition-all ${
            sheetOpen ? "bg-primary/10 text-primary" : "text-on-surface-variant"
          }`}
        >
          <span className="w-[22px] h-[22px] rounded-full bg-linear-to-br from-primary to-primary-container flex items-center justify-center text-on-primary text-[10px] font-bold select-none">
            {initial}
          </span>
          <span className="text-[10px] font-medium mt-0.5">{t("profile")}</span>
        </button>
      </nav>

      <ProfileSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
