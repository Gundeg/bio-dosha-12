"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Callout, useErrorMessage } from "@/components/kit";
import { ApiError, apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/formatDate";
import { Field, FormDialog, PasswordInput, TwoStepCodeInput, looksLikeTwoStepCode } from "./shared";
import { downloadTextFile, printRecoverySheet, recoveryText, type RecoverySheet } from "./recoveryCodesExport";
import { Icon } from "@/components/ui/icon";

type Errors = { password?: string; code?: string };

/**
 * Two steps: confirm with the password and a current 2-step code, then show
 * the ten new codes once. The codes dialog closes only after the person
 * confirms they saved them.
 */
export function RecoveryCodesDialog({
  open,
  onOpenChange,
  email,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onCreated: () => void;
}) {
  const t = useTranslations("settings.recovery");
  const describe = useErrorMessage();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [createdAt, setCreatedAt] = useState<Date | null>(null);

  function close() {
    // Forget the password, the code and the new codes as soon as the dialog closes.
    setPassword("");
    setCode("");
    setErrors({});
    setFormError(null);
    setCodes(null);
    setCreatedAt(null);
    onOpenChange(false);
  }

  async function create() {
    const found: Errors = {};
    if (!password) found.password = t("passwordRequired");
    if (!code.trim()) found.code = t("codeRequired");
    else if (!looksLikeTwoStepCode(code)) found.code = t("codeInvalid");
    setErrors(found);
    setFormError(null);
    if (found.password || found.code) {
      document.getElementById(found.password ? "recovery-password" : "recovery-code")?.focus();
      return;
    }

    setBusy(true);
    try {
      const res = await apiFetch<{ recoveryCodes: string[] }>("/api/account/mfa/recovery", {
        method: "POST",
        body: JSON.stringify({ password, code: code.trim() }),
      });
      setPassword("");
      setCode("");
      setCodes(res.recoveryCodes);
      setCreatedAt(new Date());
      onCreated();
    } catch (err) {
      // rate_limited and other failures go to the form-level message.
      const errCode = err instanceof ApiError ? err.code : undefined;
      if (errCode === "wrong_password") setErrors({ password: describe(err) });
      else if (errCode === "mfa_invalid") setErrors({ code: describe(err) });
      else setFormError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  if (codes && createdAt) {
    return <CodesView open={open} codes={codes} createdAt={createdAt} email={email} onDone={close} />;
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={t("confirmTitle")}
      description={t("confirmDescription")}
      submitLabel={t("create")}
      busy={busy}
      error={formError}
      onSubmit={create}
    >
      <Field id="recovery-password" label={t("password")} required error={errors.password}>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
            }}
          />
        )}
      </Field>
      <Field id="recovery-code" label={t("code")} required error={errors.code} hint={t("codeHint")}>
        {(control) => (
          <TwoStepCodeInput
            {...control}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (errors.code) setErrors((x) => ({ ...x, code: undefined }));
            }}
          />
        )}
      </Field>
    </FormDialog>
  );
}

function CodesView({
  open,
  codes,
  createdAt,
  email,
  onDone,
}: {
  open: boolean;
  codes: string[];
  createdAt: Date;
  email: string;
  onDone: () => void;
}) {
  const t = useTranslations("settings.recovery");
  const tKit = useTranslations("kit");
  const locale = useLocale();
  const savedId = useId();
  const [saved, setSaved] = useState(false);
  const [announce, setAnnounce] = useState("");

  const sheet: RecoverySheet = {
    title: t("file.title"),
    meta: [t("file.account", { email }), t("file.created", { date: formatDateTime(createdAt, locale) })],
    codes,
    note: t("file.note"),
    locale,
  };

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setAnnounce(t("copied"));
    } catch {
      setAnnounce(tKit("copyFailed"));
    }
  }

  function download() {
    downloadTextFile("bio-dosha-12-recovery-codes.txt", recoveryText(sheet));
    setAnnounce(t("downloaded"));
  }

  function print() {
    if (!printRecoverySheet(sheet)) toast.error(t("printBlocked"));
  }

  return (
    <Dialog
      open={open}
      disablePointerDismissal
      onOpenChange={(next) => {
        // Only "Done" closes this step, so the codes are not lost by accident.
        if (!next && saved) onDone();
      }}
    >
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("codesTitle")}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{t("codesDescription")}</DialogDescription>
        </DialogHeader>

        <Callout tone="warning" title={t("shownOnceTitle")}>
          {t("shownOnceBody")}
        </Callout>

        <ol
          aria-label={t("codesListLabel")}
          className="grid grid-cols-1 gap-2 rounded-xl bg-surface-container-low p-4 font-mono text-base tracking-wider text-on-surface ring-1 ring-outline-variant/30 min-[400px]:grid-cols-2"
        >
          {codes.map((code, i) => (
            <li key={code} className="flex items-baseline gap-2 select-all">
              <span className="w-6 text-right text-xs text-on-surface-variant select-none" aria-hidden="true">
                {i + 1}.
              </span>
              {code}
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button type="button" variant="outline" size="lg" onClick={copyAll}>
            <Icon name="content_copy" className="size-4" />
            {t("copyAll")}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={download}>
            <Icon name="download" className="size-4" />
            {t("download")}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={print}>
            <Icon name="print" className="size-4" />
            {t("print")}
          </Button>
        </div>
        <p aria-live="polite" className="min-h-5 text-xs text-on-surface-variant">
          {announce}
        </p>

        <label htmlFor={savedId} className="flex cursor-pointer items-start gap-3 rounded-lg bg-surface-container-low p-3 text-sm">
          <input
            id={savedId}
            type="checkbox"
            checked={saved}
            onChange={(e) => setSaved(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span>{t("savedConfirm")}</span>
        </label>

        <DialogFooter>
          <Button type="button" size="lg" disabled={!saved} onClick={onDone}>
            {t("done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
