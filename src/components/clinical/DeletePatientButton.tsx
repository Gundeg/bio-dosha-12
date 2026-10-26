"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useErrorMessage } from "@/components/kit/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Permanently deletes a patient and all of their records. Shown to the
 * organization owner and to the practitioner who registered the patient (the
 * API allows nobody else). The name must be typed to confirm, because the
 * action cannot be undone.
 */
export function DeletePatientButton({ patientId, patientName }: { patientId: string; patientName: string }) {
  const t = useTranslations("clinical.delete");
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const confirmed = confirmText.trim() === patientName.trim();

  async function handleDelete() {
    if (!confirmed) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/patients/${patientId}`, { method: "DELETE" });
      toast.success(t("success"));
      router.push("/patients");
      router.refresh();
    } catch (err) {
      toast.error(t("error"), { description: errorMessage(err) });
      setDeleting(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="lg" className="px-3 text-red-700 border-red-200 hover:bg-red-50" onClick={() => setOpen(true)}>
        {t("button")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setConfirmText("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-patient-name">
              <span>
                {t.rich("confirmLabel", {
                  name: patientName,
                  b: (chunks) => <span className="font-semibold">{chunks}</span>,
                })}
              </span>
            </Label>
            <Input
              id="confirm-patient-name"
              value={confirmText}
              autoComplete="off"
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!confirmed || deleting}>
              {deleting ? t("deleting") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
