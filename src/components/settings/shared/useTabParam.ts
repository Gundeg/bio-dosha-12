"use client";

import { useCallback, useOptimistic, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * The selected tab of a page, kept in `?tab=` so links such as
 * /settings?tab=security open the right tab and the back button works.
 * The switch shows at once (optimistic) while router.replace updates the URL.
 * Must be used below a <Suspense> boundary (useSearchParams).
 */
export function useTabParam<T extends string>(tabs: readonly T[], fallback: T) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requested = searchParams.get("tab");
  const fromUrl = tabs.find((tab) => tab === requested) ?? fallback;

  const [tab, setOptimisticTab] = useOptimistic(fromUrl);
  const [, startTransition] = useTransition();

  const selectTab = useCallback(
    (next: T) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      startTransition(() => {
        setOptimisticTab(next);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router, setOptimisticTab]
  );

  return [tab, selectTab] as const;
}
