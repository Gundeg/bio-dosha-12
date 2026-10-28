"use client";

import { cn } from "@/lib/utils";
import { FieldError, FieldHint, FieldLabel, describedBy } from "./fields";

export const OTP_LENGTH = 6;

/**
 * One input for a 6-digit authenticator code. A single field (instead of six
 * boxes) works with paste, password managers, iOS/Android code suggestions
 * and screen readers. Anything that is not a digit is dropped, so pasting
 * "123 456" works. `onComplete` fires when the sixth digit is entered.
 */
export function OtpCodeInput({
  id,
  label,
  value,
  onValueChange,
  onComplete,
  hint,
  error,
  autoFocus = true,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  onComplete?: (code: string) => void;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  autoFocus?: boolean;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, OTP_LENGTH);
    onValueChange(digits);
    if (digits.length === OTP_LENGTH && value.length !== OTP_LENGTH) onComplete?.(digits);
  }

  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        autoCorrect="off"
        spellCheck={false}
        required
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId)}
        className={cn(
          // tracking adds space after every digit; the matching left padding keeps the code centered.
          "h-14 w-full rounded-lg border border-input bg-surface-container-lowest pl-[0.45em] text-center font-mono text-3xl font-semibold tracking-[0.45em] text-on-surface tabular-nums outline-none transition-colors",
          "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15",
          error && "border-error ring-3 ring-error/15"
        )}
      />
      {hint && hintId && <FieldHint id={hintId}>{hint}</FieldHint>}
      {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

export const RECOVERY_CODE_LENGTH = 12;

/** Shapes what is typed into the XXXX-XXXX-XXXX form of recovery codes (the server ignores the dashes). */
export function formatRecoveryCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, RECOVERY_CODE_LENGTH);
  return clean.match(/.{1,4}/g)?.join("-") ?? "";
}

export function isCompleteRecoveryCode(value: string): boolean {
  return value.replace(/[^A-Z0-9]/gi, "").length === RECOVERY_CODE_LENGTH;
}

/** Input for a one-time recovery code, used instead of the authenticator code. */
export function RecoveryCodeInput({
  id,
  label,
  value,
  onValueChange,
  placeholder,
  hint,
  error,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type="text"
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        required
        autoFocus
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(formatRecoveryCode(e.target.value))}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId)}
        className={cn(
          "h-14 w-full rounded-lg border border-input bg-surface-container-lowest px-3 text-center font-mono text-xl font-semibold text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50",
          "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15",
          error && "border-error ring-3 ring-error/15"
        )}
      />
      {hint && hintId && <FieldHint id={hintId}>{hint}</FieldHint>}
      {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
