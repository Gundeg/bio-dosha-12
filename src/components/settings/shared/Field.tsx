"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Props a form control needs to be tied to its label, hint and error. */
export interface FieldControlProps {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  "aria-required"?: true;
}

/**
 * Label + control + hint + inline error, wired for screen readers.
 *
 *   <Field id="org-name" label="Name" required error={errors.name}>
 *     {(control) => <Input {...control} value={name} onChange={...} />}
 *   </Field>
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: (control: FieldControlProps) => React.ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-on-surface">
        {label}
        {required && (
          <span className="text-error" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-required": required ? true : undefined,
      })}
      {error && (
        <p id={errorId} className="flex items-start gap-1 text-sm text-error">
          <span className="material-symbols-outlined mt-px text-[16px]" aria-hidden="true">
            error
          </span>
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-xs text-on-surface-variant">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Text input sized for touch (40px). */
export function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <Input className={cn("h-10 bg-surface-container-lowest", className)} {...props} />;
}

/** Native select in the same look as TextInput (best on phones and with screen readers). */
export function SelectInput({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-input bg-surface-container-lowest pr-9 pl-2.5 text-base text-on-surface outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <span
        className="material-symbols-outlined pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[20px] text-on-surface-variant"
        aria-hidden="true"
      >
        expand_more
      </span>
    </div>
  );
}

/** Password input with a show/hide button. The value lives only in React state. */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const t = useTranslations("settings.shared");
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        className={cn("h-10 bg-surface-container-lowest pr-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={t("showPassword")}
        aria-pressed={visible}
        aria-controls={props.id}
        className="absolute top-0 right-0 flex size-10 items-center justify-center rounded-r-lg text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          {visible ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
}

/** Form-level message (error or success) announced to screen readers. */
export function FormMessage({ tone = "error", children }: { tone?: "error" | "success"; children: React.ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg px-3 py-2 text-sm ring-1",
        tone === "error" ? "bg-red-50 text-red-800 ring-red-600/20" : "bg-emerald-50 text-emerald-900 ring-emerald-600/20"
      )}
    >
      {children}
    </p>
  );
}
