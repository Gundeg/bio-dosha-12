"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Callout } from "@/components/kit/layout";
import { cn } from "@/lib/utils";
import { AuthShell } from "./AuthShell";
import { PrimaryButton, TOUCH_LINK_CLASS, TextButton, TextField } from "./fields";
import { OTP_LENGTH, OtpCodeInput, RecoveryCodeInput, isCompleteRecoveryCode } from "./OtpCodeInput";
import { PasswordField } from "./PasswordField";
import { focusField, looksLikeEmail, problemKey, useKeyText, useProblemText, type Problem } from "./problems";
import type { LoginNotice } from "./safeNext";
import { signInWithPassword, navigateAfterAuth } from "./session";
import { Icon } from "@/components/ui/icon";

type Step = "password" | "code";
type Method = "app" | "recovery";
type Field = "email" | "password" | "code";

const IDS = { email: "login-email", password: "login-password", code: "login-code" } as const;

/**
 * Sign-in in two steps on one card: email + password, then (only if 2-step
 * sign-in is on) the authenticator code or a recovery code. The password stays
 * in component state for the second step; it never goes to the URL or storage.
 */
export function LoginForm({ next, notice }: { next: string | null; notice: LoginNotice | null }) {
  const t = useTranslations("authFlows");
  const problemText = useProblemText();
  const keyText = useKeyText();

  const [step, setStep] = useState<Step>("password");
  const [method, setMethod] = useState<Method>("app");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  // An authenticator code is accepted only once, so Enter + auto-submit must not send it twice.
  const inFlight = useRef(false);

  function clearFieldError(field: Field) {
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function attempt(secondFactor?: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setProblem(null);

    const outcome = await signInWithPassword(email, password, secondFactor);
    if (outcome === "ok") {
      // Stay busy while the next page loads; the proxy picks the right home for "/".
      navigateAfterAuth(next ?? "/");
      return;
    }

    inFlight.current = false;
    setBusy(false);
    switch (outcome) {
      case "mfa_required":
        if (step === "password") {
          setMethod("app");
          setCode("");
          setFieldErrors({});
          setStep("code");
        } else {
          setFieldErrors({ code: method === "app" ? "login.errors.codeIncomplete" : "login.errors.recoveryIncomplete" });
          focusField(IDS.code);
        }
        return;
      case "mfa_invalid":
        setCode("");
        setFieldErrors({ code: method === "app" ? "login.errors.codeInvalid" : "login.errors.recoveryInvalid" });
        focusField(IDS.code);
        return;
      case "credentials":
        setPassword("");
        setProblem(problemKey("login.errors.credentials"));
        if (step === "code") setStep("password");
        else focusField(IDS.password);
        return;
      case "rate_limited":
        setProblem(problemKey("login.errors.rateLimited"));
        return;
      case "account_disabled":
        setProblem(problemKey("login.errors.disabled"));
        return;
      case "unavailable":
        setProblem(problemKey("shell.errors.unavailable"));
        return;
      default:
        setProblem(problemKey("shell.errors.unknown"));
    }
  }

  function submitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const errors: Partial<Record<Field, string>> = {};
    if (!email.trim()) errors.email = "shell.errors.emailRequired";
    else if (!looksLikeEmail(email)) errors.email = "shell.errors.emailInvalid";
    if (!password) errors.password = "login.errors.passwordRequired";
    setFieldErrors(errors);
    setProblem(null);
    if (errors.email) return focusField(IDS.email);
    if (errors.password) return focusField(IDS.password);
    void attempt();
  }

  function verifyCode(value: string) {
    if (busy) return;
    const complete = method === "app" ? value.length === OTP_LENGTH : isCompleteRecoveryCode(value);
    setProblem(null);
    if (!complete) {
      setFieldErrors({ code: method === "app" ? "login.errors.codeIncomplete" : "login.errors.recoveryIncomplete" });
      focusField(IDS.code);
      return;
    }
    setFieldErrors({});
    void attempt(value);
  }

  function switchMethod() {
    setMethod((m) => (m === "app" ? "recovery" : "app"));
    setCode("");
    setFieldErrors({});
    setProblem(null);
  }

  function backToPassword() {
    setStep("password");
    setCode("");
    setPassword("");
    setFieldErrors({});
    setProblem(null);
  }

  const fieldError = (field: Field) => {
    const key = fieldErrors[field];
    return key ? keyText(key) : undefined;
  };

  if (step === "code") {
    return (
      <AuthShell
        icon={method === "app" ? "phonelink_lock" : "key"}
        title={t("login.mfa.title")}
        description={method === "app" ? t("login.mfa.subtitle") : t("login.mfa.recoverySubtitle")}
      >
        <form
          key="code"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            verifyCode(code);
          }}
          className="space-y-5"
        >
          <p className="break-words rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
            {t.rich("login.mfa.account", {
              email: email.trim(),
              b: (chunks) => <strong className="font-semibold text-on-surface">{chunks}</strong>,
            })}
          </p>

          {method === "app" ? (
            <OtpCodeInput
              id={IDS.code}
              label={t("login.mfa.codeLabel")}
              value={code}
              onValueChange={(value) => {
                setCode(value);
                clearFieldError("code");
              }}
              onComplete={verifyCode}
              hint={t("login.mfa.codeHint")}
              error={fieldError("code")}
            />
          ) : (
            <RecoveryCodeInput
              id={IDS.code}
              label={t("login.mfa.recoveryLabel")}
              value={code}
              onValueChange={(value) => {
                setCode(value);
                clearFieldError("code");
              }}
              placeholder={t("login.mfa.recoveryPlaceholder")}
              hint={t("login.mfa.recoveryHint")}
              error={fieldError("code")}
            />
          )}

          {problem && <Callout tone="danger">{problemText(problem)}</Callout>}

          <PrimaryButton busy={busy} busyLabel={t("login.mfa.submitting")}>
            {t("login.mfa.submit")}
          </PrimaryButton>

          <div className="flex flex-col items-start gap-x-4 sm:flex-row sm:items-center sm:justify-between">
            <TextButton onClick={switchMethod} disabled={busy}>
              {method === "app" ? t("login.mfa.useRecovery") : t("login.mfa.useApp")}
            </TextButton>
            <TextButton onClick={backToPassword} disabled={busy} className="gap-1.5">
              <Icon name="arrow_back" className="size-4" />
              {t("login.mfa.back")}
            </TextButton>
          </div>

          <p className="flex gap-2 rounded-lg bg-surface-container-low p-4 text-xs leading-relaxed text-on-surface-variant">
            <Icon name="help" className="size-4 shrink-0" />
            <span>{t("login.mfa.lostAccess")}</span>
          </p>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("login.title")}
      description={t("login.subtitle")}
      footer={
        <p>
          {t("login.noAccount")}{" "}
          <Link href="/register" className={TOUCH_LINK_CLASS}>
            {t("login.createAccount")}
          </Link>
        </p>
      }
    >
      <form key="password" noValidate onSubmit={submitPassword} className="space-y-5">
        {notice && !problem && (
          <Callout tone={notice === "session_expired" ? "info" : "success"}>{t(`notices.${notice}`)}</Callout>
        )}

        <TextField
          id={IDS.email}
          label={t("login.email")}
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          autoFocus={!email}
          placeholder={t("shell.emailPlaceholder")}
          value={email}
          onValueChange={(value) => {
            setEmail(value);
            clearFieldError("email");
          }}
          error={fieldError("email")}
        />

        <PasswordField
          id={IDS.password}
          label={t("login.password")}
          autoComplete="current-password"
          autoFocus={!!email}
          value={password}
          onValueChange={(value) => {
            setPassword(value);
            clearFieldError("password");
          }}
          error={fieldError("password")}
        />
        {/* After the password in the DOM, so Tab goes email → password without a detour. */}
        <div className="-mt-3 flex justify-end">
          <Link href="/forgot" className={cn(TOUCH_LINK_CLASS, "text-sm")}>
            {t("login.forgot")}
          </Link>
        </div>

        {problem && <Callout tone="danger">{problemText(problem)}</Callout>}

        <PrimaryButton busy={busy} busyLabel={t("login.submitting")}>
          {t("login.submit")}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
