"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useErrorMessage } from "./hooks";

/**
 * Confirmation for consequential actions. Supports a required reason (shown
 * in the audit log) and type-to-confirm for permanent deletion. The dialog
 * stays open and shows the error if the action fails.
 *
 *   <ConfirmDialog
 *     open={open} onOpenChange={setOpen}
 *     title="Suspend organization?" tone="danger"
 *     reason={{ required: true }}
 *     onConfirm={async ({ reason }) => { await apiFetch(...); reload(); }}
 *   />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  tone = "default",
  requireText,
  reason,
  confirmDisabled = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  tone?: "default" | "danger";
  /** The person must type this exact text (e.g. an email or a name). */
  requireText?: string;
  reason?: { required?: boolean; label?: string; placeholder?: string };
  /** Extra condition from the caller (e.g. a required checkbox inside `children`). */
  confirmDisabled?: boolean;
  onConfirm: (input: { reason: string }) => Promise<void> | void;
}) {
  const t = useTranslations("kit");
  const describe = useErrorMessage();
  const [typed, setTyped] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typedId = useId();
  const reasonId = useId();

  const reasonOk = !reason?.required || reasonText.trim().length >= 3;
  const typedOk = !requireText || typed.trim() === requireText.trim();
  const canConfirm = reasonOk && typedOk && !busy && !confirmDisabled;

  function reset() {
    setTyped("");
    setReasonText("");
    setError(null);
    setBusy(false);
  }

  async function confirm() {
    if (!canConfirm) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm({ reason: reasonText.trim() });
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(describe(err));
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription className="text-sm leading-relaxed">{description}</DialogDescription>}
        </DialogHeader>

        {children}

        {reason && (
          <div className="space-y-1.5">
            <label htmlFor={reasonId} className="text-sm font-medium">
              {reason.label ?? t("reasonLabel")}
              {reason.required && <span className="text-error"> *</span>}
            </label>
            <textarea
              id={reasonId}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder={reason.placeholder ?? t("reasonPlaceholder")}
              maxLength={300}
              rows={3}
              className="w-full rounded-lg border border-input bg-surface-container-lowest px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"
            />
          </div>
        )}

        {requireText && (
          <div className="space-y-1.5">
            <label htmlFor={typedId} className="text-sm font-medium">
              {t("typeToConfirm", { text: requireText })}
            </label>
            <Input
              id={typedId}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-600/20">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            {t("cancel")}
          </Button>
          <Button
            className={cn(tone === "danger" && "bg-red-700 text-white hover:bg-red-800")}
            disabled={!canConfirm}
            onClick={confirm}
          >
            {busy ? t("working") : (confirmLabel ?? t("confirm"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
