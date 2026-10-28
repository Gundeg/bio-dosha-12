"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Callout } from "@/components/kit/layout";
import { useApiQuery } from "@/components/kit/hooks";
import { ButtonLink } from "@/components/ui/button-link";
import { apiFetch } from "@/lib/api";
import { AuthShell } from "./AuthShell";
import { PRIMARY_BUTTON_CLASS, PrimaryButton, TOUCH_LINK_CLASS, TextButton, TextField } from "./fields";
import { apiErrorStatus, focusField, looksLikeEmail, useKeyText, useProblemText, type Problem } from "./problems";
import { CardSkeleton, LoadError } from "./states";

const EMAIL_ID = "forgot-email";

/**
 * "Forgot password". With email delivery configured, sends a reset link and
 * always answers the same way (so the form cannot reveal who has an account).
 * Without email, explains who can create a reset link instead.
 */
export function ForgotPasswordForm() {
  const t = useTranslations("authFlows");
  const problemText = useProblemText();
  const keyText = useKeyText();
  const config = useApiQuery<{ emailEnabled: boolean }>("/api/public/config");

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  // The server can report that email was switched off after the page loaded.
  const [emailOff, setEmailOff] = useState(false);

  const backToLogin = (
    <Link href="/login" className={TOUCH_LINK_CLASS}>
      {t("shell.backToLogin")}
    </Link>
  );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const value = email.trim();
    const issue = !value ? "shell.errors.emailRequired" : !looksLikeEmail(value) ? "shell.errors.emailInvalid" : null;
    setFieldError(issue);
    setProblem(null);
    if (issue) return focusField(EMAIL_ID);

    setBusy(true);
    try {
      const res = await apiFetch<{ ok: boolean; emailEnabled: boolean }>("/api/public/forgot", {
        method: "POST",
        body: JSON.stringify({ email: value }),
      });
      if (res.emailEnabled) setSentTo(value);
      else setEmailOff(true);
    } catch (err) {
      if (apiErrorStatus(err) === 400) {
        setFieldError("shell.errors.emailInvalid");
        focusField(EMAIL_ID);
      } else {
        setProblem({ error: err });
      }
    } finally {
      setBusy(false);
    }
  }

  if (!config.data) {
    return (
      <AuthShell title={t("forgot.title")}>
        {config.error ? <LoadError error={config.error} onRetry={config.reload} /> : <CardSkeleton />}
      </AuthShell>
    );
  }

  if (!config.data.emailEnabled || emailOff) {
    return (
      <AuthShell icon="support_agent" title={t("forgot.disabled.title")} description={t("forgot.disabled.body")} focusKey="disabled">
        <ol className="space-y-3">
          {(["contact", "link", "set"] as const).map((key, index) => (
            <li key={key} className="flex gap-3 text-sm leading-relaxed text-on-surface">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary"
              >
                {index + 1}
              </span>
              <span>{t(`forgot.disabled.steps.${key}`)}</span>
            </li>
          ))}
        </ol>
        <ButtonLink href="/login" className={`mt-6 ${PRIMARY_BUTTON_CLASS}`}>
          {t("shell.backToLogin")}
        </ButtonLink>
      </AuthShell>
    );
  }

  if (sentTo) {
    return (
      <AuthShell icon="mark_email_read" title={t("forgot.sent.title")} focusKey="sent">
        <div role="status" className="space-y-3 text-sm leading-relaxed text-on-surface">
          <p className="break-words">
            {t.rich("forgot.sent.body", {
              email: sentTo,
              b: (chunks) => <strong className="font-semibold">{chunks}</strong>,
            })}
          </p>
          <p>{t("forgot.sent.expiry")}</p>
          <p className="text-on-surface-variant">{t("forgot.sent.spam")}</p>
        </div>
        <ButtonLink href="/login" className={`mt-6 ${PRIMARY_BUTTON_CLASS}`}>
          {t("shell.backToLogin")}
        </ButtonLink>
        <TextButton onClick={() => setSentTo(null)} className="mt-2">
          {t("forgot.sent.again")}
        </TextButton>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("forgot.title")}
      description={t("forgot.subtitle")}
      footer={
        <p>
          {t("forgot.remembered")} {backToLogin}
        </p>
      }
    >
      <form noValidate onSubmit={submit} className="space-y-5">
        <TextField
          id={EMAIL_ID}
          label={t("forgot.email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          autoFocus
          maxLength={200}
          placeholder={t("shell.emailPlaceholder")}
          value={email}
          onValueChange={(value) => {
            setEmail(value);
            if (fieldError) setFieldError(null);
          }}
          error={fieldError ? keyText(fieldError) : undefined}
        />
        {problem && <Callout tone="danger">{problemText(problem)}</Callout>}
        <PrimaryButton busy={busy} busyLabel={t("forgot.submitting")}>
          {t("forgot.submit")}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
