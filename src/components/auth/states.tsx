"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/kit/layout";
import { useErrorMessage } from "@/components/kit/hooks";
import { Skeleton } from "@/components/states";
import { PRIMARY_BUTTON_CLASS, TOUCH_LINK_CLASS } from "./fields";
import { Icon } from "@/components/ui/icon";

/** Placeholder lines while a page loads what it needs (announced once to screen readers). */
export function CardSkeleton() {
  const t = useTranslations("authFlows.shell");
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">{t("loading")}</span>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="mt-6 h-10 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

/** Loading failed: say why, offer to try again, and a way back to sign in. */
export function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const t = useTranslations("authFlows.shell");
  const describe = useErrorMessage();
  return (
    <div className="space-y-4">
      <Callout tone="danger">{describe(error)}</Callout>
      <Button type="button" onClick={onRetry} className={PRIMARY_BUTTON_CLASS}>
        <Icon name="refresh" className="size-4" />
        {t("retry")}
      </Button>
      <Link href="/login" className={TOUCH_LINK_CLASS}>
        {t("backToLogin")}
      </Link>
    </div>
  );
}
