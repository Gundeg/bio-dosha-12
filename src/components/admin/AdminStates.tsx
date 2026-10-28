"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { Callout, useErrorMessage } from "@/components/kit";
import type { ApiError } from "@/lib/api";

/** Placeholder while a control-center page loads its first data. */
export function PageSkeleton({ cards = 0, sections = 2 }: { cards?: number; sections?: number }) {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      {cards > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: cards }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}
      {Array.from({ length: sections }).map((_, i) => (
        <Skeleton key={i} className="h-56" />
      ))}
    </div>
  );
}

/**
 * Load failure of a whole page: a dedicated message for records that no longer
 * exist, otherwise the error with a retry button.
 */
export function LoadFailure({
  error,
  onRetry,
  backHref,
  backLabel,
  notFoundTitle,
}: {
  error: ApiError;
  onRetry: () => void;
  backHref?: string;
  backLabel?: string;
  notFoundTitle?: string;
}) {
  const t = useTranslations("admin");
  const describe = useErrorMessage();
  if (error.status === 404 && notFoundTitle) {
    return (
      <EmptyState
        icon="search_off"
        title={notFoundTitle}
        body={t("common.notFoundBody")}
        action={
          backHref ? (
            <ButtonLink href={backHref} variant="outline" size="lg">
              {backLabel}
            </ButtonLink>
          ) : undefined
        }
      />
    );
  }
  return <ErrorState message={describe(error)} onRetry={onRetry} />;
}

/** Shown above content that is still visible after a refresh failed. */
export function StaleNotice({ error, onRetry }: { error: ApiError | null; onRetry: () => void }) {
  const t = useTranslations("admin");
  const tk = useTranslations("kit");
  const describe = useErrorMessage();
  if (!error) return null;
  return (
    <Callout
      tone="warning"
      title={t("common.refreshFailed")}
      action={
        <Button variant="outline" size="lg" onClick={onRetry}>
          {tk("retry")}
        </Button>
      }
    >
      {describe(error)}
    </Callout>
  );
}

/** For pages only the superadmin may open. */
export function SuperadminOnly({ title, body }: { title: string; body: string }) {
  const t = useTranslations("admin");
  return (
    <EmptyState
      icon="lock"
      title={title}
      body={body}
      action={
        <ButtonLink href="/admin" variant="outline" size="lg">
          {t("common.backToOverview")}
        </ButtonLink>
      }
    />
  );
}
