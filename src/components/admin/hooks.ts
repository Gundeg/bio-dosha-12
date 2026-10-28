"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import { planName, type PlanRef } from "./lib";

/**
 * A list filter kept in the URL (?status=PENDING), so links from the overview
 * open the right view, the browser's back button works and the section link in
 * the navigation resets the filter. Updates use history.replaceState, which
 * Next.js syncs with useSearchParams without a server round trip.
 * Components using it must render inside <Suspense>.
 */
export function useQueryParam<V extends string>(name: string, allowed: readonly V[], fallback: V): [V, (next: V) => void] {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const raw = searchParams.get(name);
  const value = raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as V) : fallback;

  const setValue = useCallback(
    (next: V) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === fallback) params.delete(name);
      else params.set(name, next);
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [searchParams, pathname, name, fallback]
  );

  return [value, setValue];
}

/** Page number that starts again at 1 whenever `resetKey` (the filters) changes. */
export function usePageFor(resetKey: string): [number, (page: number) => void] {
  const [state, setState] = useState({ key: resetKey, page: 1 });
  const page = state.key === resetKey ? state.page : 1;
  const setPage = useCallback((next: number) => setState({ key: resetKey, page: next }), [resetKey]);
  return [page, setPage];
}

/** Translated labels for codes the control center shows everywhere. */
export function useAdminLabels() {
  const t = useTranslations("admin");
  const locale = useLocale();

  return useMemo(() => {
    const label = (prefix: string, code: string | null | undefined): string => {
      if (!code) return "—";
      const key = `${prefix}.${code}`;
      return t.has(key) && typeof t.raw(key) === "string" ? t(key) : code;
    };
    return {
      locale,
      role: (role: string | null | undefined) => label("roles", role),
      orgRole: (role: string | null | undefined) => label("orgRoles", role),
      orgType: (type: string | null | undefined) => label("orgTypes", type),
      orgStatus: (status: string) => label("statuses.org", status),
      memberStatus: (status: string) => label("statuses.member", status),
      inviteState: (state: string) => label("statuses.invite", state),
      audience: (audience: string) => label("audiences", audience),
      planSource: (source: string) => label("planSource", source),
      targetType: (type: string | null | undefined) => label("targetTypes", type),
      /** Human label of an audit action code; unknown codes are shown as they are. */
      action: (code: string) => label("actions", code),
      planName: (plan: PlanRef) => planName(plan, locale),
      date: (value: string | null | undefined) => (value ? formatDate(value, locale) : null),
      dateTime: (value: string | null | undefined) => (value ? formatDateTime(value, locale) : null),
    };
  }, [t, locale]);
}
