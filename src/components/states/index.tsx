"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Аппын нэгдсэн төлөвийн дүрэм: fetch бүр яг НЭГИЙГ нь харуулна —
 * өгөгдөл | Skeleton | ErrorState | EmptyState. Алдаа хэзээ ч
 * "хоосон" мэт харагдах ёсгүй.
 */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Ачааллаж байна"
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary",
        className
      )}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-xl bg-muted/60", className)}
    />
  );
}

export function PageLoading({ label = "Ачааллаж байна..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
      <Spinner className="size-7" />
      <p className="text-sm">{label}</p>
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
  message = "Мэдээлэл ачаалахад алдаа гарлаа.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
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
      <p className="max-w-sm text-sm text-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Дахин оролдох
        </Button>
      )}
    </div>
  );
}
