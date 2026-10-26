import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * One calm line with the emergency number. Shown wherever health results or
 * advice appear (docs/platform-architecture.md, "Health safety"). Works in
 * server and client components.
 */
export function EmergencyNote({ className }: { className?: string }) {
  const t = useTranslations("legal");
  return (
    <p className={cn("flex items-start gap-2 text-xs leading-relaxed text-on-surface-variant", className)}>
      <span className="material-symbols-outlined mt-px text-[16px] text-error" aria-hidden="true">
        emergency
      </span>
      <span>
        {t.rich("emergency", {
          call: (chunks) => (
            <a
              href="tel:103"
              className="rounded-sm font-semibold text-on-surface underline underline-offset-2 hover:text-error focus-visible:outline-2 focus-visible:outline-primary"
            >
              {chunks}
            </a>
          ),
        })}
      </span>
    </p>
  );
}
