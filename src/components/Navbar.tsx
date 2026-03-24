"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/dashboard", label: "Хяналтын самбар" },
  { href: "/calculator", label: "Тооцоолол" },
  { href: "/assessment", label: "Үнэлгээ" },
  { href: "/history", label: "Түүх" },
  { href: "/family", label: "Гэр бүл" },
  { href: "/recommendations", label: "Ерөндөг" },
];

const practitionerLinks = [
  { href: "/patients", label: "Өвчтөнүүд" },
  { href: "/reports", label: "Тайлан" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const links =
    session?.user?.role === "PRACTITIONER"
      ? [...navLinks, ...practitionerLinks]
      : navLinks;

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-800">Bio-Dosha-12</span>
            <span className="text-xs text-muted-foreground hidden sm:block">Тб оточ</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  pathname === href
                    ? "bg-slate-100 font-semibold text-slate-900"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {session?.user?.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Гарах
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
