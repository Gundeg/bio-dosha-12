"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

/**
 * Form pieces shared by the sign-in, sign-up, password and invitation pages.
 * Inputs use the shared 40px Input, labels are always visible, and every
 * error is linked to its field with aria-describedby.
 */

export const INPUT_CLASS = "text-on-surface";

export const LINK_CLASS =
  "rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** A standalone text link with a 44px touch target. */
export const TOUCH_LINK_CLASS = cn(LINK_CLASS, "inline-flex min-h-11 items-center");

/**
 * Main action of a step: full width and 44px for touch (h-11). A label too
 * long for one line wraps and the button grows, instead of overflowing.
 */
export const PRIMARY_BUTTON_CLASS = "h-auto min-h-11 w-full whitespace-normal rounded-lg py-2 text-center";

export function describedBy(...ids: (string | false | null | undefined)[]): string | undefined {
  const list = ids.filter(Boolean).join(" ");
  return list || undefined;
}

export function FieldLabel({
  htmlFor,
  optional,
  children,
}: {
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("authFlows.shell");
  return (
    <Label htmlFor={htmlFor} className="block leading-snug text-on-surface">
      {children}
      {optional && <span className="ml-1 font-normal text-on-surface-variant">{t("optional")}</span>}
    </Label>
  );
}

export function FieldHint({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="text-xs leading-relaxed text-on-surface-variant">
      {children}
    </p>
  );
}

/** Error under a field. The icon keeps it from relying on color alone. */
export function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm font-medium text-error">
      <Icon name="error" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

type TextFieldProps = Omit<React.ComponentProps<"input">, "id" | "value" | "onChange" | "children"> & {
  id: string;
  label: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  optional?: boolean;
};

export function TextField({
  id,
  label,
  value,
  onValueChange,
  hint,
  error,
  optional,
  className,
  ...inputProps
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} optional={optional}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId)}
        className={cn(INPUT_CLASS, className)}
        {...inputProps}
      />
      {hint && hintId && <FieldHint id={hintId}>{hint}</FieldHint>}
      {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

export function SelectField({
  id,
  label,
  value,
  onValueChange,
  options,
  optional,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  optional?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} optional={optional}>
        {label}
      </FieldLabel>
      <select
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="h-10 w-full min-w-0 rounded-lg border border-input bg-surface-container-lowest px-3 text-base text-on-surface outline-none transition-colors focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 md:text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** A consent or acknowledgement checkbox with a 44px tall clickable label. */
export function CheckboxField({
  id,
  checked,
  onCheckedChange,
  error,
  children,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: React.ReactNode;
  children: React.ReactNode;
}) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg py-2 text-sm leading-relaxed text-on-surface"
      >
        <input
          id={id}
          type="checkbox"
          required
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
        />
        <span>{children}</span>
      </label>
      {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

export function ButtonSpinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 shrink-0 rounded-full border-2 border-current/30 border-t-current motion-safe:animate-spin"
    />
  );
}

/**
 * The main action of a step (a form submit by default). While busy it stays
 * focusable (keyboard and screen reader users keep their place), ignores
 * clicks and says what is happening.
 */
export function PrimaryButton({
  busy = false,
  busyLabel,
  children,
  className,
  type = "submit",
  onClick,
}: {
  busy?: boolean;
  busyLabel?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={busy}
      focusableWhenDisabled
      aria-busy={busy || undefined}
      className={cn(PRIMARY_BUTTON_CLASS, className)}
    >
      {busy ? (
        <>
          <ButtonSpinner />
          {busyLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/** A secondary action that reads like a link but is a button (it changes the step, it does not navigate). */
export function TextButton({
  onClick,
  children,
  className,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(TOUCH_LINK_CLASS, "text-left disabled:opacity-50", className)}
    >
      {children}
    </button>
  );
}
