"use client";

import { signIn, type UpdateSession } from "next-auth/react";

/** What a credentials sign-in attempt ended with (codes come from src/lib/auth.ts). */
export type SignInOutcome =
  | "ok"
  | "mfa_required"
  | "mfa_invalid"
  | "rate_limited"
  | "account_disabled"
  | "credentials"
  /** The request failed or the answer could not be read (offline, server down). */
  | "unavailable"
  | "unknown";

const KNOWN_CODES = new Set<SignInOutcome>(["mfa_required", "mfa_invalid", "rate_limited", "account_disabled", "credentials"]);

/**
 * Signs in with email + password (+ authenticator or recovery code) without
 * leaving the page. The password is passed straight through and never stored.
 * NextAuth answers 200 even for failures, so `error`/`code` decide the outcome.
 */
export async function signInWithPassword(email: string, password: string, code?: string): Promise<SignInOutcome> {
  try {
    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      ...(code ? { code } : {}),
      redirect: false,
    });
    if (!res) return "unknown";
    if (!res.error) return "ok";
    return KNOWN_CODES.has(res.code as SignInOutcome) ? (res.code as SignInOutcome) : "unknown";
  } catch {
    return "unavailable";
  }
}

/**
 * Re-reads the session claims (role, organization, 2-step status) right now.
 * `update()` without an argument only GETs the session, and the server then
 * refreshes claims at most once a minute; passing data makes it a POST with
 * trigger "update", which reloads them immediately (src/lib/auth.ts).
 * Failure is not fatal: the proxy sends the person back here and the claims
 * refresh on the next request.
 */
export async function refreshSessionClaims(update: UpdateSession): Promise<void> {
  try {
    await update({});
  } catch {
    // ignored, see above
  }
}

/**
 * Leaves an auth page after the session changed (signed in, 2-step turned on,
 * invitation accepted). A full page load makes the proxy and server components
 * read the new session cookie; `router.replace()` followed by
 * `router.refresh()` races, and the refresh of the old page could redirect
 * somewhere else (e.g. /mfa-setup → /settings once 2-step is on).
 */
export function navigateAfterAuth(path: string): void {
  window.location.assign(path);
}
