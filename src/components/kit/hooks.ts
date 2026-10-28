"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ApiError, apiFetch } from "@/lib/api";

function toApiError(err: unknown): ApiError {
  return err instanceof ApiError ? err : new ApiError(0, err instanceof Error ? err.message : String(err));
}

interface QueryState<T> {
  /** Which request (url + reload count) the data belongs to. */
  key: string | null;
  data: T | null;
  error: ApiError | null;
}

/**
 * Loads JSON from an API route. Keeps the previous data while reloading, so a
 * refresh after an action never flashes an empty page.
 *
 *   const { data, error, loading, reload } = useApiQuery<Overview>("/api/admin/overview");
 *
 * Pass `null` as the url to wait (e.g. until a route param is known).
 */
export function useApiQuery<T>(url: string | null) {
  const [nonce, setNonce] = useState(0);
  const key = url ? `${url}#${nonce}` : null;
  const [state, setState] = useState<QueryState<T>>({ key: null, data: null, error: null });

  useEffect(() => {
    if (!url || !key) return;
    let cancelled = false;
    apiFetch<T>(url).then(
      (data) => {
        if (!cancelled) setState({ key, data, error: null });
      },
      (err) => {
        if (!cancelled) setState((s) => ({ key, data: s.data, error: toApiError(err) }));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [url, key]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const mutate = useCallback((update: (prev: T | null) => T | null) => {
    setState((s) => ({ ...s, data: update(s.data) }));
  }, []);

  return {
    data: state.data,
    error: state.key === key ? state.error : null,
    /** True until the current request finished (also during a reload). */
    loading: !!key && state.key !== key,
    reload,
    mutate,
  };
}

/**
 * Turns any thrown error into a sentence for the person using the app.
 * English uses the translated text for the API's error code; Mongolian keeps
 * the server's message, which is already Mongolian and often more specific
 * (e.g. names the plan and its limit).
 */
export function useErrorMessage() {
  const t = useTranslations("errors");
  const locale = useLocale();
  return useCallback(
    (err: unknown): string => {
      if (err instanceof ApiError) {
        if (err.status === 0) return t("network");
        const code = err.code;
        if (locale !== "mn" && code && t.has(code)) return t(code);
        if (err.message) return err.message;
        if (code && t.has(code)) return t(code);
      }
      return t("unknown");
    },
    [t, locale]
  );
}

/** Value that follows `value` after it stopped changing for `delayMs`. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/** Builds "/api/x?a=1&b=2", skipping empty values. */
export function withQuery(path: string, params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    search.set(k, String(v));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}
