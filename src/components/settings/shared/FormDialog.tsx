"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FormMessage } from "./Field";

/**
 * A dialog that is a form: fields, a form-level error and Cancel / submit.
 * Pressing Enter submits. It cannot be closed while the request runs.
 * Use the kit's ConfirmDialog for plain confirmations.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel,
  tone = "default",
  busy,
  error,
  submitDisabled,
  onSubmit,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  /** Plain text: rendered inside a paragraph. */
  description?: React.ReactNode;
  children?: React.ReactNode;
  submitLabel: React.ReactNode;
  tone?: "default" | "danger";
  busy: boolean;
  error?: string | null;
  submitDisabled?: boolean;
  onSubmit: () => void;
  className?: string;
}) {
  const t = useTranslations("kit");
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className={cn("max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md", className)}>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy && !submitDisabled) onSubmit();
          }}
        >
          <DialogHeader className="pr-8">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription className="text-sm leading-relaxed">{description}</DialogDescription>}
          </DialogHeader>

          {children}

          {error && <FormMessage>{error}</FormMessage>}

          <DialogFooter>
            <Button type="button" variant="outline" size="lg" disabled={busy} onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              size="lg"
              // The one filled action of the dialog; red when it cannot be undone.
              className={cn(tone === "danger" && "bg-red-700 text-white hover:bg-red-800")}
              disabled={busy || submitDisabled}
            >
              {busy ? t("working") : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
