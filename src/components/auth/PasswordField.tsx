"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FieldError, FieldLabel, INPUT_CLASS, describedBy } from "./fields";
import { PASSWORD_MIN_LENGTH, passwordStrength, type PasswordStrength } from "./password";

/**
 * Password input with a show/hide button and a Caps Lock warning. With
 * `showRules` it also shows the minimum length rule and a strength hint
 * (for new passwords). The value lives only in the parent's state.
 */
export function PasswordField({
  id,
  label,
  value,
  onValueChange,
  autoComplete,
  error,
  showRules = false,
  autoFocus,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: React.ReactNode;
  /** New password: show the length rule and the strength meter. */
  showRules?: boolean;
  autoFocus?: boolean;
}) {
  const t = useTranslations("authFlows.password");
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const rulesId = showRules ? `${id}-rules` : undefined;
  const capsId = `${id}-caps`;
  const errorId = error ? `${id}-error` : undefined;
  const ruleMet = value.length >= PASSWORD_MIN_LENGTH;

  function trackCapsLock(e: React.KeyboardEvent<HTMLInputElement>) {
    // getModifierState is missing on some virtual keyboards.
    if (typeof e.getModifierState === "function") setCapsLock(e.getModifierState("CapsLock"));
  }

  return (
    // flex + gap: the absolutely positioned live region below takes no space.
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={trackCapsLock}
          onKeyUp={trackCapsLock}
          onBlur={() => setCapsLock(false)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(rulesId, capsLock && capsId, errorId)}
          className={cn(INPUT_CLASS, "pr-12")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={t("show")}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-on-surface-variant hover:text-on-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            {visible ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>

      {/* Always mounted so screen readers announce the change; the visible copy is below. */}
      <p id={capsId} aria-live="polite" className="sr-only">
        {capsLock ? t("capsLock") : ""}
      </p>
      {capsLock && (
        <p aria-hidden="true" className="flex items-center gap-1 text-xs font-medium text-amber-800">
          <span className="material-symbols-outlined text-[16px]">keyboard_capslock</span>
          {t("capsLock")}
        </p>
      )}

      {showRules && rulesId && (
        <div id={rulesId} className="space-y-2">
          <p className="flex items-start gap-1.5 text-xs leading-relaxed text-on-surface-variant">
            <span
              className={cn(
                "material-symbols-outlined mt-px shrink-0 text-[16px]",
                ruleMet ? "icon-filled text-emerald-700" : "text-on-surface-variant"
              )}
              aria-hidden="true"
            >
              {ruleMet ? "check_circle" : "radio_button_unchecked"}
            </span>
            <span>{t("rule", { min: PASSWORD_MIN_LENGTH })}</span>
          </p>
          <StrengthMeter strength={passwordStrength(value)} />
        </div>
      )}

      {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

const STRENGTH_LEVEL: Record<PasswordStrength, { filled: number; bar: string }> = {
  weak: { filled: 1, bar: "bg-red-600" },
  fair: { filled: 2, bar: "bg-amber-500" },
  good: { filled: 3, bar: "bg-primary-container" },
  strong: { filled: 4, bar: "bg-emerald-600" },
};

/** Four bars plus a word, so the level never depends on color alone. */
function StrengthMeter({ strength }: { strength: PasswordStrength | null }) {
  const t = useTranslations("authFlows.password");
  if (!strength) return null;
  const level = STRENGTH_LEVEL[strength];
  return (
    <div className="flex items-center gap-3">
      <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={cn("h-1.5 rounded-full", n <= level.filled ? level.bar : "bg-surface-container-high")}
          />
        ))}
      </div>
      <p className="shrink-0 text-xs text-on-surface-variant">
        {t("strengthLabel")} <span className="font-semibold text-on-surface">{t(`strength.${strength}`)}</span>
      </p>
    </div>
  );
}
