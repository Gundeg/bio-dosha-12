"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocaleToggle } from "@/components/LocaleToggle";

interface SheetLink {
  href: string;
  labelKey: "family" | "retakeAssessment" | "help" | "patients" | "reports" | "adminPanel";
  icon: string;
}

const PERSONAL_LINKS: SheetLink[] = [
  { href: "/family", labelKey: "family", icon: "group" },
  { href: "/calculator?tab=assessment", labelKey: "retakeAssessment", icon: "quiz" },
  { href: "/help", labelKey: "help", icon: "contact_support" },
];

const PRACTITIONER_LINKS: SheetLink[] = [
  { href: "/patients", labelKey: "patients", icon: "stethoscope" },
  { href: "/reports", labelKey: "reports", icon: "summarize" },
];

function SheetItem({
  href,
  label,
  icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
    >
      <span className="material-symbols-outlined text-[20px] text-on-surface-variant" aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  );
}

/**
 * Мобайл доод цэсний "Профайл" таб — доороос гарч ирэх хуудас (bottom sheet).
 * Мобайл дээр гарах (logout), гэр бүл, тусламж, эмчийн холбоосуудын цорын
 * ганц хүрэх зам.
 */
export function ProfileSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: session } = useSession();
  const t = useTranslations("nav");
  const role = session?.user?.role;
  const initial = session?.user?.name?.[0]?.toUpperCase() ?? "?";
  const close = () => onOpenChange(false);

  const roleLabel =
    role === "PRACTITIONER"
      ? t("roleSpecialist")
      : role === "ADMIN"
      ? t("roleAdmin")
      : t("roleUser");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 left-0 right-0 translate-x-0 translate-y-0 w-full max-w-full sm:max-w-full rounded-b-none rounded-t-3xl p-0 gap-0 data-open:slide-in-from-bottom-8 data-closed:slide-out-to-bottom-8"
      >
        {/* Чирэх бариул */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-outline-variant/40" />
        </div>

        <DialogTitle className="sr-only">{t("profileMenu")}</DialogTitle>

        {/* Хэрэглэгчийн карт */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-primary to-primary-container flex items-center justify-center text-on-primary text-base font-bold select-none">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">
                {session?.user?.name ?? t("roleUser")}
              </p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
          <LocaleToggle />
        </div>

        {/* Холбоосууд */}
        <nav className="px-2 py-2">
          {PERSONAL_LINKS.map((link) => (
            <SheetItem
              key={link.href}
              href={link.href}
              label={t(link.labelKey)}
              icon={link.icon}
              onNavigate={close}
            />
          ))}

          {role === "PRACTITIONER" && (
            <>
              <div className="my-1.5 mx-4 border-t border-outline-variant/15" />
              <p className="px-4 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 select-none">
                {t("specialistSection")}
              </p>
              {PRACTITIONER_LINKS.map((link) => (
                <SheetItem
                  key={link.href}
                  href={link.href}
                  label={t(link.labelKey)}
                  icon={link.icon}
                  onNavigate={close}
                />
              ))}
            </>
          )}

          {role === "ADMIN" && (
            <>
              <div className="my-1.5 mx-4 border-t border-outline-variant/15" />
              <SheetItem
                href="/admin"
                label={t("adminPanel")}
                icon="admin_panel_settings"
                onNavigate={close}
              />
            </>
          )}

          <div className="my-1.5 mx-4 border-t border-outline-variant/15" />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-error hover:bg-error/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden>
              logout
            </span>
            {t("logout")}
          </button>
        </nav>

        <div className="h-6" aria-hidden />
      </DialogContent>
    </Dialog>
  );
}
