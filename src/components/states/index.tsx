"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Аппын нэгдсэн төлөвийн дүрэм: fetch бүр яг НЭГИЙГ нь харуулна —
 * өгөгдөл | Skeleton | ErrorState | EmptyState. Алдаа хэзээ ч
 * "хоосон" мэт харагдах ёсгүй.
 */

export function Spinner({ className }: { className?: string }) {
  const t = useTranslations("states");
  return (
    <span
      role="status"
      aria-label={t("loadingLabel")}
      className={cn(
        "inline-block size-5 motion-safe:animate-spin rounded-full border-2 border-primary/30 border-t-primary",
        className
      )}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("motion-safe:animate-pulse rounded-xl bg-muted/60", className)}
    />
  );
}

export function PageLoading({ label }: { label?: string }) {
  const t = useTranslations("states");
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
      <Spinner className="size-7" />
      <p className="text-sm">{label ?? t("loading")}</p>
    </div>
  );
}

export function EmptyState({
  icon = "🌿",
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center",
        className
      )}
    >
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <p className="font-semibold">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const t = useTranslations("states");
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center",
        className
      )}
    >
      <span className="text-4xl" aria-hidden>
        ⚠️
      </span>
      <p className="max-w-sm text-sm text-foreground">{message || t("loadError")}</p>
      {onRetry && (
        <Button variant="outline" className="h-10 px-4" onClick={onRetry}>
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
