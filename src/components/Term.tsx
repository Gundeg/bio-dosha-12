"use client";

import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import { useLocale, useTranslations } from "next-intl";
import { GLOSSARY_BY_KEY } from "@/lib/glossary";
import { L } from "@/lib/i18nData";
import { Icon } from "@/components/ui/icon";

/**
 * Нэр томьёог тайлбартай нь холбоно: тасархай доогуур зураастай үгэн дээр
 * дарахад товч тодорхойлолт бүхий popover гарна. Хаана ч жаргон гарсан
 * `<Term k="kt">Kt</Term>` гэж ороож хэрэглэнэ.
 */
export function Term({
  k,
  children,
  className = "",
}: {
  k: string;
  children: React.ReactNode;
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("help.term");
  const entry = GLOSSARY_BY_KEY[k];
  if (!entry) return <>{children}</>;

  return (
    <Popover.Root>
      <Popover.Trigger
        className={`inline cursor-help border-b border-dotted border-current/50 hover:border-solid focus-visible:outline-2 focus-visible:outline-primary rounded-sm ${className}`}
      >
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} className="z-[60]">
          <Popover.Popup className="max-w-72 rounded-xl bg-popover p-3.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:fade-in-0 data-open:motion-safe:zoom-in-95 data-closed:animate-out data-closed:fade-out-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Icon name={entry.icon} className="size-4 text-on-surface-variant" />
              {L(entry.term, locale)}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {L(entry.short, locale)}
            </p>
            <Link
              href={`/help#${entry.key}`}
              className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
            >
              {t("more")}
            </Link>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
