"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Form controls for control-center dialogs: a visible label on every input,
 * hints and errors wired with aria-describedby, 40px tall controls.
 */

const CONTROL =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-sm text-on-surface outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

function joinIds(...ids: (string | null)[]): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

function FieldLabel({ htmlFor, id, children, required }: { htmlFor?: string; id?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} id={id} className="block text-sm font-medium text-on-surface">
      {children}
      {required && (
        <span className="text-error" aria-hidden="true">
          {" "}
          *
        </span>
      )}
    </label>
  );
}

function FieldMessages({ hintId, errorId, hint, error }: { hintId: string; errorId: string; hint?: React.ReactNode; error?: React.ReactNode }) {
  return (
    <>
      {hint && (
        <p id={hintId} className="text-xs text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-error">
          {error}
        </p>
      )}
    </>
  );
}

export function TextField({
  label,
  value,
  onChange,
  required,
  type = "text",
  hint,
  error,
  maxLength,
  placeholder,
  autoComplete,
  inputMode,
  disabled,
  mono,
  className,
  min,
  max,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "email" | "tel" | "number" | "date" | "search";
  hint?: React.ReactNode;
  error?: React.ReactNode;
  maxLength?: number;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  disabled?: boolean;
  mono?: boolean;
  className?: string;
  min?: number | string;
  max?: number | string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete ?? "off"}
        inputMode={inputMode}
        disabled={disabled}
        min={min}
        max={max}
        aria-invalid={error ? true : undefined}
        aria-describedby={joinIds(hint ? hintId : null, error ? errorId : null)}
        className={cn("h-10 px-3", mono && "font-mono")}
      />
      <FieldMessages hintId={hintId} errorId={errorId} hint={hint} error={error} />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  required,
  hint,
  error,
  maxLength,
  placeholder,
  rows = 3,
  disabled,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  maxLength?: number;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={joinIds(hint ? hintId : null, error ? errorId : null)}
        className={cn(CONTROL, "py-2")}
      />
      <FieldMessages hintId={hintId} errorId={errorId} hint={hint} error={error} />
    </div>
  );
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Native select: reliable on phones and with screen readers. */
export function SelectField({
  label,
  value,
  onChange,
  options,
  groups,
  required,
  hint,
  error,
  disabled,
  className,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  /** Options shown in <optgroup>s after `options`. */
  groups?: { label: string; options: SelectOption[] }[];
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={joinIds(hint ? hintId : null, error ? errorId : null)}
        className={cn(CONTROL, "h-10 bg-surface-container-lowest")}
      >
        {options?.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
        {groups?.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <FieldMessages hintId={hintId} errorId={errorId} hint={hint} error={error} />
    </div>
  );
}

/** Checkbox with its label and an optional explanation; the whole row is clickable. */
export function CheckboxField({
  label,
  description,
  checked,
  onChange,
  disabled,
  className,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const descriptionId = `${id}-description`;
  return (
    <div
      className={cn(
        "flex min-h-10 items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-container-low/70",
        disabled && "opacity-60",
        className
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-describedby={description ? descriptionId : undefined}
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
      />
      <div className="min-w-0 text-sm">
        <label htmlFor={id} className={cn("cursor-pointer font-medium text-on-surface", disabled && "cursor-not-allowed")}>
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="mt-0.5 text-xs text-on-surface-variant">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/** On/off switch (ARIA switch pattern) with a label and an optional explanation. */
export function SwitchField({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-4 py-1", disabled && "opacity-60")}>
      <div className="min-w-0 text-sm">
        <p id={`${id}-label`} className="font-medium text-on-surface">
          {label}
        </p>
        {description && (
          <p id={`${id}-description`} className="mt-0.5 text-xs text-on-surface-variant">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-description` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed",
          checked ? "bg-primary" : "bg-outline-variant"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-6 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

/** A choice between a few options, each with an explanation. */
export function RadioCards<V extends string>({
  legend,
  value,
  onChange,
  options,
  columns = 1,
}: {
  legend: React.ReactNode;
  value: V;
  onChange: (value: V) => void;
  options: { value: V; label: React.ReactNode; description?: React.ReactNode; disabled?: boolean; aside?: React.ReactNode }[];
  columns?: 1 | 2;
}) {
  const name = useId();
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 text-sm font-medium text-on-surface">{legend}</legend>
      <div className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2")}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 transition has-focus-visible:ring-2 has-focus-visible:ring-primary",
                active ? "bg-primary/5 ring-primary/50" : "ring-outline-variant/40 hover:bg-surface-container-low/70",
                o.disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={active}
                disabled={o.disabled}
                onChange={() => onChange(o.value)}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span className="min-w-0 flex-1 text-sm">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-on-surface">{o.label}</span>
                  {o.aside}
                </span>
                {o.description && <span className="mt-0.5 block text-xs text-on-surface-variant">{o.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Error box for a form that could not be saved. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-600/20">
      {message}
    </p>
  );
}
