"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useErrorMessage } from "@/components/kit";
import { cn } from "@/lib/utils";

/**
 * The kit's ConfirmDialog plus a checklist that must be ticked before the
 * action can run (verification steps, identity checks) and an extra
 * `canConfirm` gate. Looks and behaves like ConfirmDialog: it stays open and
 * shows the error when the action fails.
 */
export function GuardedConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  checks = [],
  checksLabel,
  requireText,
  canConfirm = true,
  confirmLabel,
  tone = "default",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Every item must be ticked before the confirm button turns on. */
  checks?: React.ReactNode[];
  checksLabel?: React.ReactNode;
  /** The person must type this exact text (e.g. an email). */
  requireText?: string;
  canConfirm?: boolean;
  confirmLabel?: React.ReactNode;
  tone?: "default" | "danger";
  onConfirm: () => Promise<void> | void;
}) {
  const tk = useTranslations("kit");
  const describe = useErrorMessage();
  const baseId = useId();
  const [ticked, setTicked] = useState<Record<number, boolean>>({});
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allTicked = checks.every((_, i) => ticked[i]);
  const typedOk = !requireText || typed.trim() === requireText.trim();
  const ready = allTicked && typedOk && canConfirm && !busy;

  function reset() {
    setTicked({});
    setTyped("");
    setError(null);
    setBusy(false);
  }

  async function confirm() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
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
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg font-bold">{title}</DialogTitle>
          {description && <DialogDescription className="text-sm leading-relaxed">{description}</DialogDescription>}
        </DialogHeader>

        {children}

        {checks.length > 0 && (
          <fieldset className="space-y-1 rounded-xl bg-surface-container-low/60 p-2 ring-1 ring-outline-variant/30">
            {checksLabel && <legend className="px-2 pt-1 text-sm font-semibold text-on-surface">{checksLabel}</legend>}
            {checks.map((check, i) => {
              const id = `${baseId}-check-${i}`;
              return (
                <div key={i} className="flex min-h-10 items-start gap-3 rounded-lg px-2 py-2 hover:bg-surface-container-lowest">
                  <input
                    id={id}
                    type="checkbox"
                    checked={!!ticked[i]}
                    onChange={(e) => setTicked((prev) => ({ ...prev, [i]: e.target.checked }))}
                    className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary"
                  />
                  <label htmlFor={id} className="cursor-pointer text-sm text-on-surface">
                    {check}
                  </label>
                </div>
              );
            })}
          </fieldset>
        )}

        {requireText && (
          <div className="space-y-1.5">
            <label htmlFor={`${baseId}-typed`} className="text-sm font-medium">
              {tk("typeToConfirm", { text: requireText })}
            </label>
            <Input
              id={`${baseId}-typed`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="h-10"
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
            className="h-10 px-4"
            disabled={busy}
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            {tk("cancel")}
          </Button>
          <Button
            className={cn(
              "h-10 px-4 font-semibold",
              tone === "danger" && "bg-red-700 text-white hover:bg-red-800 [a]:hover:bg-red-800"
            )}
            disabled={!ready}
            onClick={confirm}
          >
            {busy ? tk("working") : (confirmLabel ?? tk("confirm"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
