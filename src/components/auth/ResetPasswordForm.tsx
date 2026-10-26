"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Callout } from "@/components/kit/layout";
import { useApiQuery } from "@/components/kit/hooks";
import { ButtonLink } from "@/components/ui/button-link";
import { apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/formatDate";
import { AuthShell } from "./AuthShell";
import { PRIMARY_BUTTON_CLASS, PrimaryButton, TOUCH_LINK_CLASS } from "./fields";
import { PasswordField } from "./PasswordField";
import { passwordProblem, passwordProblemKey } from "./password";
import { apiErrorStatus, apiFieldNames, focusField, useKeyText, useProblemText, type Problem } from "./problems";
import { CardSkeleton, LoadError } from "./states";

const IDS = { password: "reset-password", confirm: "reset-confirm" } as const;
const DONE_URL = "/login?notice=password_reset";

interface ResetInfo {
  /** Masked, e.g. "bo•••@example.com". */
  email: string;
  expiresAt: string;
}

/** Sets a new password from a one-time link (by email or from an admin). */
export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("authFlows");
  const query = useApiQuery<ResetInfo>(`/api/public/reset/${encodeURIComponent(token)}`);
  // The link can expire (or be used in another tab) while the form is open.
  const [expired, setExpired] = useState(false);

  if (expired || query.error?.status === 404) {
    return (
      <AuthShell icon="link_off" title={t("reset.invalid.title")} description={t("reset.invalid.body")} focusKey="invalid">
        <ButtonLink href="/forgot" className={PRIMARY_BUTTON_CLASS}>
          {t("reset.invalid.action")}
        </ButtonLink>
        <Link href="/login" className={`mt-2 ${TOUCH_LINK_CLASS}`}>
          {t("shell.backToLogin")}
        </Link>
      </AuthShell>
    );
  }

  if (!query.data) {
    return (
      <AuthShell title={t("reset.title")}>
        {query.error ? <LoadError error={query.error} onRetry={query.reload} /> : <CardSkeleton />}
      </AuthShell>
    );
  }

  return <ResetForm token={token} info={query.data} onExpired={() => setExpired(true)} />;
}

function ResetForm({ token, info, onExpired }: { token: string; info: ResetInfo; onExpired: () => void }) {
  const t = useTranslations("authFlows");
  const locale = useLocale();
  const router = useRouter();
  const { status } = useSession();
  const problemText = useProblemText();
  const keyText = useKeyText();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const issue = passwordProblem(password);
    const found: { password?: string; confirm?: string } = {};
    if (issue) found.password = passwordProblemKey(issue);
    if (!confirm) found.confirm = "password.confirmRequired";
    else if (confirm !== password) found.confirm = "password.mismatch";
    setErrors(found);
    setProblem(null);
    if (found.password) return focusField(IDS.password);
    if (found.confirm) return focusField(IDS.confirm);

    setBusy(true);
    try {
      await apiFetch(`/api/public/reset/${encodeURIComponent(token)}`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
    } catch (err) {
      setBusy(false);
      if (apiErrorStatus(err) === 404) return onExpired();
      if (apiErrorStatus(err) === 400 && apiFieldNames(err).includes("password")) {
        setErrors({ password: passwordProblemKey(passwordProblem(password) ?? "tooShort") });
        return focusField(IDS.password);
      }
      setProblem({ error: err });
      return;
    }

    // The change ends every session. If this browser has one, clear its cookie
    // too, otherwise the proxy would still treat it as signed in.
    if (status === "unauthenticated") {
      router.replace(DONE_URL);
      return;
    }
    try {
      await signOut({ redirectTo: DONE_URL });
    } catch {
      router.replace(DONE_URL);
    }
  }

  return (
    <AuthShell
      icon="password"
      title={t("reset.title")}
      description={
        <div className="space-y-1">
          <p className="break-words">
            {t.rich("reset.account", {
              email: info.email,
              b: (chunks) => <strong className="font-semibold text-on-surface">{chunks}</strong>,
            })}
          </p>
          <p>{t("reset.expires", { time: formatDateTime(info.expiresAt, locale) })}</p>
        </div>
      }
      footer={
        <Link href="/login" className={TOUCH_LINK_CLASS}>
          {t("shell.backToLogin")}
        </Link>
      }
    >
      <form noValidate onSubmit={submit} className="space-y-5">
        <PasswordField
          id={IDS.password}
          label={t("reset.newPassword")}
          autoComplete="new-password"
          autoFocus
          showRules
          value={password}
          onValueChange={(value) => {
            setPassword(value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password ? keyText(errors.password) : undefined}
        />
        <PasswordField
          id={IDS.confirm}
          label={t("reset.confirmPassword")}
          autoComplete="new-password"
          value={confirm}
          onValueChange={(value) => {
            setConfirm(value);
            if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }));
          }}
          error={errors.confirm ? keyText(errors.confirm) : undefined}
        />
        <p className="flex gap-2 rounded-xl bg-surface-container-low p-4 text-sm leading-relaxed text-on-surface-variant">
          <span className="material-symbols-outlined shrink-0 text-[20px] text-primary" aria-hidden="true">
            devices
          </span>
          <span>{t("reset.signOutNote")}</span>
        </p>
        {problem && <Callout tone="danger">{problemText(problem)}</Callout>}
        <PrimaryButton busy={busy} busyLabel={t("reset.submitting")}>
          {t("reset.submit")}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
