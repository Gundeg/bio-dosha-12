import { signOut } from "next-auth/react";
import { ApiError } from "@/lib/api";

/**
 * Ends the session in this browser and goes to `redirectTo`. Used after the
 * server already ended every session (password change, sign out everywhere,
 * account deletion), so if the sign-out request itself fails we still leave
 * the page: the old session no longer works anyway.
 */
export async function signOutTo(redirectTo: string): Promise<void> {
  try {
    await signOut({ redirectTo });
  } catch {
    window.location.assign(redirectTo);
  }
}

/** True when the API rejected this field of the request body. */
export function fieldErrorOf(err: unknown, field: string): boolean {
  return err instanceof ApiError && !!err.fieldErrors?.[field]?.length;
}

/** UTF-8 length; bcrypt reads at most 72 bytes of a password. */
export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** Quick shape check before sending; the API validates properly. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * A 6-digit authenticator code, or a recovery code such as K7QM-2XPR-9TBW
 * (the same input as the second sign-in step; see src/lib/totp.ts).
 */
export function looksLikeTwoStepCode(value: string): boolean {
  if (/^\d{6}$/.test(value.replace(/\s/g, ""))) return true;
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").length === 12;
}
