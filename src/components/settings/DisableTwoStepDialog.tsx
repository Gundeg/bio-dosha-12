"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useErrorMessage } from "@/components/kit";
import { ApiError, apiFetch } from "@/lib/api";
import { Field, FormDialog, PasswordInput, TwoStepCodeInput, looksLikeTwoStepCode } from "./shared";

export function DisableTwoStepDialog({
  open,
  onOpenChange,
  onDisabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDisabled: () => void;
}) {
  const t = useTranslations("settings.disableTwoStep");
  const describe = useErrorMessage();
  const { update } = useSession();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<{ password?: string; code?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function close() {
    setPassword("");
    setCode("");
    setErrors({});
    setFormError(null);
    onOpenChange(false);
  }

  async function submit() {
    const found: { password?: string; code?: string } = {};
    if (!password) found.password = t("passwordRequired");
    if (!code.trim()) found.code = t("codeRequired");
    else if (!looksLikeTwoStepCode(code)) found.code = t("codeInvalid");
    setErrors(found);
    setFormError(null);
    if (found.password || found.code) {
      document.getElementById(found.password ? "disable-2fa-password" : "disable-2fa-code")?.focus();
      return;
    }

    setBusy(true);
    try {
      await apiFetch("/api/account/mfa/disable", {
        method: "POST",
        body: JSON.stringify({ password, code: code.trim() }),
      });
      toast.success(t("done"));
      await update({}); // {} forces a claim refresh (see src/components/auth/session.ts)
      onDisabled();
      setBusy(false);
      close();
    } catch (err) {
      setBusy(false);
      const errCode = err instanceof ApiError ? err.code : undefined;
      if (errCode === "wrong_password") setErrors({ password: describe(err) });
      else if (errCode === "mfa_invalid") setErrors({ code: describe(err) });
      // "mfa_required" here means the role requires 2-step sign-in (the generic text asks for a code).
      else if (errCode === "mfa_required") setFormError(t("requiredForRole"));
      else setFormError(describe(err));
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={t("title")}
      description={t("description")}
      submitLabel={t("submit")}
      tone="danger"
      busy={busy}
      error={formError}
      onSubmit={submit}
    >
      <Field id="disable-2fa-password" label={t("password")} required error={errors.password}>
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
      <Field id="disable-2fa-code" label={t("code")} required error={errors.code} hint={t("codeHint")}>
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
