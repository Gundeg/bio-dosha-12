"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useErrorMessage } from "@/components/kit/hooks";
import { ApiError } from "@/lib/api";
import { PASSWORD_MIN_LENGTH } from "./password";

/**
 * Something to tell the person: a message key under `authFlows`, or an error
 * thrown by an API call. Forms keep the key or the error in state (not the
 * translated text), so switching the language mid-flow re-translates it.
 */
export type Problem = { key: string; values?: Record<string, string> } | { error: unknown };

export function problemKey(key: string, values?: Record<string, string>): Problem {
  return { key, values };
}

/**
 * Translates a message key kept in state (under `authFlows`). Always supplies
 * {min} so password-rule messages can be shown from any form.
 */
export function useKeyText() {
  const t = useTranslations("authFlows");
  return useCallback(
    (key: string, values?: Record<string, string>): string => t(key, { min: PASSWORD_MIN_LENGTH, ...values }),
    [t]
  );
}

/** Returns a function that turns a Problem into a sentence in the current language. */
export function useProblemText() {
  const keyText = useKeyText();
  const describe = useErrorMessage();
  return useCallback(
    (problem: Problem): string => ("key" in problem ? keyText(problem.key, problem.values) : describe(problem.error)),
    [keyText, describe]
  );
}

/** The API's machine-readable error code, if any. */
export function apiErrorCode(err: unknown): string | undefined {
  return err instanceof ApiError ? err.code : undefined;
}

export function apiErrorStatus(err: unknown): number | undefined {
  return err instanceof ApiError ? err.status : undefined;
}

/** Field names that failed validation on the server (zod `fieldErrors`). */
export function apiFieldNames(err: unknown): string[] {
  return err instanceof ApiError && err.fieldErrors ? Object.keys(err.fieldErrors) : [];
}

/** A light format check; the server makes the final decision. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Moves keyboard focus to a field by id (used after a failed submit). */
export function focusField(id: string): void {
  const el = document.getElementById(id);
  if (el instanceof HTMLElement) el.focus();
}
