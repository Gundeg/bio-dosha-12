"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Callout, useErrorMessage } from "@/components/kit";
import { IconTile } from "@/components/kit/layout";
import type { ApiError } from "@/lib/api";
import { Icon } from "@/components/ui/icon";

export interface QueryLike<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Error with a retry button (40px touch target), in the kit's look. When the
 * session has ended (401) retrying cannot help, so it offers to sign in again.
 */
export function LoadError({ message, status, onRetry }: { message: string; status?: number; onRetry: () => void }) {
  const t = useTranslations("settings.shared");
  const tKit = useTranslations("kit");
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-red-600/25 bg-red-50 px-6 py-12 text-center"
    >
      <IconTile name="error" tone="danger" size="lg" className="bg-surface-container-lowest" />
      <p className="max-w-md text-sm text-red-950">{message}</p>
      {status === 401 ? (
        <ButtonLink href="/login" size="lg">
          {t("signInAgain")}
        </ButtonLink>
      ) : (
        <Button variant="outline" size="lg" onClick={onRetry}>
          <Icon name="refresh" className="size-4" />
          {tKit("retry")}
        </Button>
      )}
    </div>
  );
}

/**
 * Shows exactly one state for a `useApiQuery` result: the content, a skeleton
 * on first load, or an error with retry. When a refresh fails after data was
 * shown, the old content stays with a notice and a retry button.
 */
export function QueryView<T>({
  query,
  skeleton,
  children,
}: {
  query: QueryLike<T>;
  skeleton: React.ReactNode;
  children: (data: T) => React.ReactNode;
}) {
  const t = useTranslations("settings.shared");
  const tKit = useTranslations("kit");
  const describe = useErrorMessage();

  if (query.data !== null) {
    return (
      <>
        {query.error && (
          <Callout
            tone="warning"
            className="mb-4"
            title={t("refreshFailed")}
            action={
              <Button variant="outline" size="lg" onClick={query.reload}>
                {tKit("retry")}
              </Button>
            }
          >
            {describe(query.error)}
          </Callout>
        )}
        {children(query.data)}
      </>
    );
  }
  if (query.error) {
    return <LoadError message={describe(query.error)} status={query.error.status} onRetry={query.reload} />;
  }
  return <div aria-busy="true">{skeleton}</div>;
}
