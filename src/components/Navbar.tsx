"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard",       label: "Самбар" },
  { href: "/calculator",      label: "Тооцоолол" },
  { href: "/history",         label: "Түүх" },
  { href: "/family",          label: "Гэр бүл" },
  { href: "/recommendations", label: "Ерөндөг" },
];

const PRACTITIONER_LINKS = [
  { href: "/patients", label: "Өвчтөнүүд" },
  { href: "/reports",  label: "Тайлан" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links =
    session?.user?.role === "PRACTITIONER"
      ? [...NAV_LINKS, ...PRACTITIONER_LINKS]
      : NAV_LINKS;

  const initial = session?.user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-15 items-center justify-between gap-4 py-3">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">BD</span>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-sm font-bold text-slate-800 tracking-tight">Bio-Dosha-12</span>
              <span className="text-[10px] text-slate-400 font-medium">Тб оточ</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {links.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Avatar + name */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-linear-to-br from-blue-400 to-violet-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{initial}</span>
              </div>
              <span className="text-sm text-slate-600 font-medium max-w-30 truncate">
                {session?.user?.name}
              </span>
            </div>

            {/* Sign out */}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-2.5 py-1.5 rounded-md transition-colors font-medium"
            >
              Гарах
            </button>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-50 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Цэс нээх"
            >
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l12 12M16 4L4 16" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h14M3 10h14M3 14h14" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2.5" />
                )}
                {label}
              </Link>
            );
          })}
          <div className="pt-2 mt-2 border-t flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-linear-to-br from-blue-400 to-violet-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initial}</span>
            </div>
            <span className="text-sm text-slate-600 font-medium">{session?.user?.name}</span>
          </div>
        </div>
      )}
    </nav>
  );
}
