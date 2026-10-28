"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

/**
 * Read-only value with a copy button, used for one-time invitation and
 * password-reset links. The links are shown once because only their hash is
 * stored, so the note says so by default.
 */
export function CopyField({
  label,
  value,
  note,
  className,
}: {
  label?: React.ReactNode;
  value: string;
  /** Shown under the field; pass null to hide the default "shown once" note. */
  note?: React.ReactNode | null;
  className?: string;
}) {
  const t = useTranslations("kit");
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      inputRef.current?.select();
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <input
          id={id}
          ref={inputRef}
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-surface-container-low px-3 font-mono text-xs text-on-surface outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="button" onClick={copy} className="h-10 shrink-0 px-4 font-semibold">
          <Icon name={state === "copied" ? "check" : "content_copy"} className="size-4.5" />
          {state === "copied" ? t("copied") : t("copy")}
        </Button>
      </div>
      <p aria-live="polite" className="text-xs text-on-surface-variant">
        {state === "failed" ? t("copyFailed") : note === null ? null : (note ?? t("shownOnce"))}
      </p>
    </div>
  );
}
