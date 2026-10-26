import { z } from "zod";

/** Minimum password length for new accounts. */
export const PASSWORD_MIN_LENGTH = 8;

/** bcrypt only uses the first 72 bytes of a password, so longer ones are rejected. */
export const PASSWORD_MAX_BYTES = 72;

/**
 * Emails are compared and stored in lower case. Without this, "Boss@x.mn" and
 * "boss@x.mn" were two different accounts while the ADMIN_EMAILS check treated
 * them as the same person.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .refine((p) => new TextEncoder().encode(p).length <= PASSWORD_MAX_BYTES, {
    message: `Password must be at most ${PASSWORD_MAX_BYTES} bytes`,
  });
