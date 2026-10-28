import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** The app's mark and name; links to the person's start page. */
export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  const t = useTranslations("common");
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary" aria-hidden="true">
        <Icon name="spa" className="size-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold leading-tight text-on-surface">{t("appName")}</span>
        {!compact && (
          <span className="block text-xs leading-snug text-on-surface-variant">{t("brandTagline")}</span>
        )}
      </span>
    </Link>
  );
}
