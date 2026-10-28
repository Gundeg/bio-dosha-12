"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Callout, ConfirmDialog, Section, useErrorMessage } from "@/components/kit";
import { ApiError, apiFetch } from "@/lib/api";
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from "@/lib/credentials";
import { formatDate } from "@/lib/formatDate";
import { Field, FormMessage, PasswordInput, byteLength, fieldErrorOf, signOutTo } from "./shared";
import { TwoStepSection } from "./TwoStepSection";
import type { Me } from "./types";
import { Icon } from "@/components/ui/icon";

export function SecurityTab({ me, reload }: { me: Me; reload: () => void }) {
  return (
    <div className="space-y-6">
      <PasswordSection me={me} />
      <TwoStepSection me={me} reload={reload} />
      <SignOutEverywhere />
    </div>
  );
}

type PasswordField = "current" | "next" | "confirm";
const EMPTY = { current: "", next: "", confirm: "" };
const FIELD_ID: Record<PasswordField, string> = {
  current: "password-current",
  next: "password-new",
  confirm: "password-confirm",
};

function PasswordSection({ me }: { me: Me }) {
  const t = useTranslations("settings.password");
  const locale = useLocale();
  const describe = useErrorMessage();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<PasswordField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(field: PasswordField, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): Partial<Record<PasswordField, string>> {
    const next: Partial<Record<PasswordField, string>> = {};
    if (!form.current) next.current = t("currentRequired");
    if (form.next.length < PASSWORD_MIN_LENGTH) next.next = t("tooShort", { min: PASSWORD_MIN_LENGTH });
    else if (byteLength(form.next) > PASSWORD_MAX_BYTES) next.next = t("tooLong");
    else if (form.current && form.next === form.current) next.next = t("samePassword");
    if (!form.confirm) next.confirm = t("confirmRequired");
    else if (form.confirm !== form.next) next.confirm = t("mismatch");
    return next;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError(null);
    const first = (Object.keys(FIELD_ID) as PasswordField[]).find((f) => found[f]);
    if (first) {
      document.getElementById(FIELD_ID[first])?.focus();
      return;
    }

    setBusy(true);
    try {
      await apiFetch("/api/account/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
    } catch (err) {
      setBusy(false);
      const code = err instanceof ApiError ? err.code : undefined;
      if (code === "wrong_password") {
        setErrors({ current: describe(err) });
        document.getElementById(FIELD_ID.current)?.focus();
      } else if (code === "same_password" || fieldErrorOf(err, "newPassword")) {
        setErrors({ next: code === "same_password" ? describe(err) : t("tooShort", { min: PASSWORD_MIN_LENGTH }) });
        document.getElementById(FIELD_ID.next)?.focus();
      } else {
        setFormError(describe(err));
      }
      return;
    }

    setForm(EMPTY);
    toast.success(t("changed"));
    await signOutTo("/login?notice=password_changed");
  }

  return (
    <Section
      title={t("title")}
      description={
        me.passwordChangedAt ? t("lastChanged", { date: formatDate(me.passwordChangedAt, locale, "long") }) : undefined
      }
    >
      <Callout tone="info" icon="devices" className="mb-5">
        {t("signOutNotice")}
      </Callout>
      <form noValidate onSubmit={submit} className="max-w-md space-y-4">
        <Field id={FIELD_ID.current} label={t("current")} required error={errors.current}>
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="current-password"
              value={form.current}
              onChange={(e) => set("current", e.target.value)}
            />
          )}
        </Field>
        <Field
          id={FIELD_ID.next}
          label={t("new")}
          required
          error={errors.next}
          hint={t("newHint", { min: PASSWORD_MIN_LENGTH })}
        >
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="new-password"
              value={form.next}
              onChange={(e) => set("next", e.target.value)}
            />
          )}
        </Field>
        <Field id={FIELD_ID.confirm} label={t("confirm")} required error={errors.confirm}>
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
            />
          )}
        </Field>
        {formError && <FormMessage>{formError}</FormMessage>}
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? t("saving") : t("submit")}
        </Button>
      </form>
    </Section>
  );
}

function SignOutEverywhere() {
  const t = useTranslations("settings.signOutAll");
  const [open, setOpen] = useState(false);

  return (
    <Section title={t("title")} description={t("description")}>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        <Icon name="logout" className="size-4" />
        {t("button")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("confirmTitle")}
        description={t("confirmDescription")}
        confirmLabel={t("confirm")}
        onConfirm={async () => {
          await apiFetch("/api/account/signout-all", { method: "POST" });
          await signOutTo("/login?notice=signed_out");
        }}
      />
    </Section>
  );
}
