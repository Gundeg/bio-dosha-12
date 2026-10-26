"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useErrorMessage } from "@/components/kit";
import { apiFetch } from "@/lib/api";
import { FormError, TextField } from "./fields";
import { looksLikeEmail, type OneTimeLinkResponse } from "./lib";
import type { OneTimeLink } from "./OneTimeLinkDialog";

/** Superadmin invites a new platform admin; the one-time link goes to `onCreated`. */
export function StaffInviteDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (link: OneTimeLink) => void;
}) {
  const t = useTranslations("admin");
  const tk = useTranslations("kit");
  const describe = useErrorMessage();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = !looksLikeEmail(email) ? t("staffInvite.emailError") : null;

  function resetForm() {
    setEmail("");
    setTouched(false);
    setError(null);
  }

  function close() {
    if (busy) return;
    onOpenChange(false);
    resetForm();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (emailError || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<OneTimeLinkResponse>("/api/admin/invites", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      const invited = email.trim();
      setBusy(false);
      onOpenChange(false);
      resetForm();
      onCreated({ url: res.inviteUrl ?? null, emailSent: res.emailSent, email: invited, expiresAt: res.expiresAt });
    } catch (err) {
      setError(describe(err));
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="font-headline text-lg font-bold">{t("staffInvite.title")}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">{t("staffInvite.description")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-600/20">
              <p className="font-semibold text-emerald-900">{t("user.role.canTitle")}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-emerald-950/90">
                <li>{t("user.role.can1")}</li>
                <li>{t("user.role.can2")}</li>
                <li>{t("user.role.can3")}</li>
              </ul>
            </div>
            <div className="rounded-xl bg-red-50 p-3 ring-1 ring-red-600/20">
              <p className="font-semibold text-red-900">{t("user.role.cannotTitle")}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-red-950/90">
                <li>{t("user.role.cannot1")}</li>
                <li>{t("user.role.cannot2")}</li>
                <li>{t("user.role.cannot3")}</li>
              </ul>
            </div>
          </div>

          <TextField
            label={t("staffInvite.email")}
            type="email"
            value={email}
            onChange={setEmail}
            required
            maxLength={200}
            hint={t("staffInvite.emailHint")}
            error={touched ? emailError : null}
          />

          <FormError message={error} />

          <DialogFooter>
            <Button type="button" variant="outline" className="h-10 px-4" disabled={busy} onClick={close}>
              {tk("cancel")}
            </Button>
            <Button type="submit" className="h-10 px-4 font-semibold" disabled={busy}>
              {busy ? tk("working") : t("staffInvite.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
