"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Callout } from "@/components/kit/layout";
import { useApiQuery } from "@/components/kit/hooks";
import { ButtonLink } from "@/components/ui/button-link";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/formatDate";
import { AuthShell } from "./AuthShell";
import { CheckboxField, LINK_CLASS, PRIMARY_BUTTON_CLASS, PrimaryButton, TOUCH_LINK_CLASS, TextField } from "./fields";
import { PasswordField } from "./PasswordField";
import { passwordProblem, passwordProblemKey } from "./password";
import {
  apiErrorCode,
  apiErrorStatus,
  apiFieldNames,
  focusField,
  problemKey,
  useKeyText,
  useProblemText,
  type Problem,
} from "./problems";
import { loginHref } from "./safeNext";
import { refreshSessionClaims, signInWithPassword, navigateAfterAuth } from "./session";
import { CardSkeleton, LoadError } from "./states";

/** GET /api/public/invite/[token] (src/app/api/public/invite/[token]/route.ts). */
interface InviteInfo {
  email: string;
  kind: "staff" | "organization";
  platformRole: string | null;
  orgRole: "OWNER" | "ADMIN" | "PRACTITIONER" | null;
  organization: { name: string; status: "PENDING" | "ACTIVE" | "SUSPENDED" } | null;
  accountExists: boolean;
  expiresAt: string;
}

type RoleKey = "owner" | "manager" | "practitioner" | "platformAdmin" | "platformOwner";

function roleKeyOf(invite: InviteInfo): RoleKey | null {
  if (invite.kind === "staff") return invite.platformRole === "SUPERADMIN" ? "platformOwner" : "platformAdmin";
  if (invite.orgRole === "OWNER") return "owner";
  if (invite.orgRole === "ADMIN") return "manager";
  if (invite.orgRole === "PRACTITIONER") return "practitioner";
  return null;
}

const sameEmail = (a: string | null | undefined, b: string) => !!a && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Accepting an invitation to a medical organization or to the platform team.
 * New people create their account here; people who already have one accept
 * while signed in with the invited email.
 */
export function InviteAcceptance({ token }: { token: string }) {
  const t = useTranslations("authFlows");
  const query = useApiQuery<InviteInfo>(`/api/public/invite/${encodeURIComponent(token)}`);
  // Accepting can find the link used up or withdrawn meanwhile.
  const [gone, setGone] = useState(false);

  if (gone || query.error?.status === 404) {
    return (
      <AuthShell icon="link_off" title={t("invite.invalid.title")} description={t("invite.invalid.body")} focusKey="invalid">
        <ButtonLink href="/login" className={PRIMARY_BUTTON_CLASS}>
          {t("invite.invalid.signIn")}
        </ButtonLink>
        <Link href="/" className={`mt-2 ${TOUCH_LINK_CLASS}`}>
          {t("shell.goHome")}
        </Link>
      </AuthShell>
    );
  }

  if (!query.data) {
    return (
      <AuthShell title={t("invite.title")}>
        {query.error ? <LoadError error={query.error} onRetry={query.reload} /> : <CardSkeleton />}
      </AuthShell>
    );
  }

  return <InviteDetails invite={query.data} token={token} onGone={() => setGone(true)} />;
}

function InviteDetails({ invite, token, onGone }: { invite: InviteInfo; token: string; onGone: () => void }) {
  const t = useTranslations("authFlows");
  const locale = useLocale();
  const roleKey = roleKeyOf(invite);
  const organization = invite.organization?.name ?? "";
  const invitePath = `/invite/${token}`;

  return (
    <AuthShell
      icon={invite.kind === "staff" ? "admin_panel_settings" : "domain_add"}
      title={t("invite.title")}
      description={
        invite.kind === "staff"
          ? t("invite.staffLead")
          : t.rich("invite.orgLead", {
              organization,
              b: (chunks) => <strong className="font-semibold text-on-surface">{chunks}</strong>,
            })
      }
    >
      <div className="space-y-4">
        {roleKey && (
          <div className="rounded-xl bg-surface-container-low p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{t("invite.roleLabel")}</p>
            <p className="mt-1 font-headline text-lg font-bold text-on-surface">{t(`roles.${roleKey}.name`)}</p>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{t(`roles.${roleKey}.desc`)}</p>
          </div>
        )}

        <ul className="space-y-2.5 text-sm leading-relaxed text-on-surface">
          <li className="flex gap-2.5">
            <span className="material-symbols-outlined shrink-0 text-[20px] text-primary" aria-hidden="true">
              mail
            </span>
            <span className="min-w-0 break-words">{t("invite.forEmail", { email: invite.email })}</span>
          </li>
          <li className="flex gap-2.5">
            <span className="material-symbols-outlined shrink-0 text-[20px] text-primary" aria-hidden="true">
              phonelink_lock
            </span>
            <span>{t("invite.mfa")}</span>
          </li>
          <li className="flex gap-2.5">
            <span className="material-symbols-outlined shrink-0 text-[20px] text-primary" aria-hidden="true">
              schedule
            </span>
            <span>{t("invite.expires", { date: formatDate(invite.expiresAt, locale, "long") })}</span>
          </li>
        </ul>

        {invite.organization?.status === "PENDING" && (
          <Callout tone="info" icon="hourglass_top">
            {t("invite.pending", { organization })}
          </Callout>
        )}
        {invite.organization?.status === "SUSPENDED" && (
          <Callout tone="warning">{t("invite.suspended", { organization })}</Callout>
        )}
      </div>

      <div className="mt-6 border-t border-outline-variant/40 pt-6">
        {invite.accountExists ? (
          <ExistingAccount invite={invite} token={token} invitePath={invitePath} onGone={onGone} />
        ) : (
          <NewAccountForm invite={invite} token={token} invitePath={invitePath} onGone={onGone} />
        )}
      </div>
    </AuthShell>
  );
}

/** Errors both ways of accepting share. Returns true when handled. */
function handleInviteError(
  err: unknown,
  invite: InviteInfo,
  onGone: () => void,
  setProblem: (problem: Problem) => void
): boolean {
  if (apiErrorStatus(err) === 404) {
    onGone();
    return true;
  }
  if (apiErrorCode(err) === "plan_limit") {
    setProblem(problemKey("invite.errors.planLimit", { organization: invite.organization?.name ?? "" }));
    return true;
  }
  if (apiErrorCode(err) === "login_required") {
    setProblem(problemKey("invite.errors.loginRequired", { email: invite.email }));
    return true;
  }
  return false;
}

function ProblemCallout({ problem, invitePath }: { problem: Problem; invitePath: string }) {
  const t = useTranslations("authFlows");
  const problemText = useProblemText();
  const needsLogin = "key" in problem && problem.key === "invite.errors.loginRequired";
  return (
    <Callout
      tone="danger"
      action={
        needsLogin ? (
          <ButtonLink href={loginHref(invitePath)} className="h-11 px-4 font-semibold">
            {t("invite.existing.signIn")}
          </ButtonLink>
        ) : undefined
      }
    >
      {problemText(problem)}
    </Callout>
  );
}

function ExistingAccount({
  invite,
  token,
  invitePath,
  onGone,
}: {
  invite: InviteInfo;
  token: string;
  invitePath: string;
  onGone: () => void;
}) {
  const t = useTranslations("authFlows");
  const { data: session, status, update } = useSession();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  async function accept() {
    if (busy) return;
    setBusy(true);
    setProblem(null);
    try {
      await apiFetch(`/api/public/invite/${encodeURIComponent(token)}`, { method: "POST", body: JSON.stringify({}) });
    } catch (err) {
      setBusy(false);
      if (!handleInviteError(err, invite, onGone, setProblem)) setProblem({ error: err });
      return;
    }
    // New membership or staff role: reload the claims so the proxy routes correctly.
    await refreshSessionClaims(update);
    toast.success(t("invite.accepted"));
    navigateAfterAuth("/");
  }

  if (status === "loading") return <CardSkeleton />;

  const current = session?.user?.email ?? null;

  if (status === "authenticated" && sameEmail(current, invite.email)) {
    return (
      <div className="space-y-4">
        <p className="break-words text-sm text-on-surface">
          {t.rich("invite.existing.signedIn", {
            email: invite.email,
            b: (chunks) => <strong className="font-semibold">{chunks}</strong>,
          })}
        </p>
        {problem && <ProblemCallout problem={problem} invitePath={invitePath} />}
        <PrimaryButton type="button" onClick={accept} busy={busy} busyLabel={t("invite.existing.accepting")}>
          {t("invite.existing.accept")}
        </PrimaryButton>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="space-y-4">
        <Callout tone="warning" title={t("invite.existing.otherTitle")}>
          <span className="break-words">
            {t("invite.existing.otherBody", { current: current ?? "", email: invite.email })}
          </span>
        </Callout>
        <PrimaryButton
          type="button"
          busy={busy}
          busyLabel={t("invite.existing.signingOut")}
          onClick={() => {
            setBusy(true);
            // Full page load to the sign-in page, which brings the person back here.
            void signOut({ redirectTo: loginHref(invitePath) });
          }}
        >
          {t("invite.existing.signOut")}
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="break-words text-sm leading-relaxed text-on-surface">
        {t.rich("invite.existing.signedOutBody", {
          email: invite.email,
          b: (chunks) => <strong className="font-semibold">{chunks}</strong>,
        })}
      </p>
      <ButtonLink href={loginHref(invitePath)} className={PRIMARY_BUTTON_CLASS}>
        {t("invite.existing.signIn")}
      </ButtonLink>
      <Link href="/forgot" className={TOUCH_LINK_CLASS}>
        {t("invite.existing.forgot")}
      </Link>
    </div>
  );
}

type NewField = "name" | "password" | "confirm" | "consent";
const NEW_IDS: Record<NewField, string> = {
  name: "invite-name",
  password: "invite-password",
  confirm: "invite-confirm",
  consent: "invite-consent",
};
const NEW_ORDER: NewField[] = ["name", "password", "confirm", "consent"];

function NewAccountForm({
  invite,
  token,
  invitePath,
  onGone,
}: {
  invite: InviteInfo;
  token: string;
  invitePath: string;
  onGone: () => void;
}) {
  const t = useTranslations("authFlows");
  const router = useRouter();
  const { data: session, status } = useSession();
  const keyText = useKeyText();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<NewField, string>>>({});
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);

  const otherSession = status === "authenticated" && !sameEmail(session?.user?.email, invite.email);

  function clearError(field: NewField) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function showErrors(found: Partial<Record<NewField, string>>): boolean {
    setErrors(found);
    const first = NEW_ORDER.find((field) => found[field]);
    if (first) focusField(NEW_IDS[first]);
    return !!first;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const found: Partial<Record<NewField, string>> = {};
    if (!name.trim()) found.name = "register.errors.nameRequired";
    const issue = passwordProblem(password);
    if (issue) found.password = passwordProblemKey(issue);
    if (!confirm) found.confirm = "password.confirmRequired";
    else if (confirm !== password) found.confirm = "password.mismatch";
    if (!consent) found.consent = "register.errors.consentRequired";
    setProblem(null);
    if (showErrors(found)) return;

    setBusy(true);
    try {
      await apiFetch(`/api/public/invite/${encodeURIComponent(token)}`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), password, acceptPrivacy: true }),
      });
    } catch (err) {
      setBusy(false);
      if (handleInviteError(err, invite, onGone, setProblem)) return;
      if (apiErrorCode(err) === "privacy_required") {
        showErrors({ consent: "register.errors.consentRequired" });
        return;
      }
      const fields = apiFieldNames(err);
      if (apiErrorStatus(err) === 400 && fields.length > 0) {
        const mapped: Partial<Record<NewField, string>> = {};
        if (fields.includes("name")) mapped.name = "register.errors.nameRequired";
        if (fields.includes("password")) mapped.password = passwordProblemKey(passwordProblem(password) ?? "tooShort");
        if (showErrors(mapped)) return;
      }
      setProblem({ error: err });
      return;
    }

    const outcome = await signInWithPassword(invite.email, password);
    if (outcome === "ok") {
      toast.success(t("invite.accepted"));
      // The proxy sends new members and staff to the 2-step setup first.
      navigateAfterAuth("/");
      return;
    }
    router.replace("/login?notice=account_created");
  }

  const errorText = (field: NewField) => {
    const key = errors[field];
    return key ? keyText(key) : undefined;
  };

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      <h2 className="font-headline text-lg font-bold text-on-surface">{t("invite.newAccount.title")}</h2>

      {otherSession && (
        <Callout tone="info">
          <span className="break-words">
            {t("invite.newAccount.otherSession", { current: session?.user?.email ?? "", email: invite.email })}
          </span>
        </Callout>
      )}

      {/* Read-only, so password managers save the new password under the right email. */}
      <TextField
        id="invite-email"
        label={t("invite.newAccount.email")}
        type="email"
        autoComplete="username"
        readOnly
        value={invite.email}
        onValueChange={() => undefined}
        hint={t("invite.newAccount.emailHint")}
        className="bg-surface-container-low"
      />
      {/* No autofocus: on phones it would scroll past the invitation details and open the keyboard over them. */}
      <TextField
        id={NEW_IDS.name}
        label={t("register.name")}
        autoComplete="name"
        maxLength={100}
        required
        value={name}
        onValueChange={(value) => {
          setName(value);
          clearError("name");
        }}
        error={errorText("name")}
      />
      <PasswordField
        id={NEW_IDS.password}
        label={t("register.password")}
        autoComplete="new-password"
        showRules
        value={password}
        onValueChange={(value) => {
          setPassword(value);
          clearError("password");
        }}
        error={errorText("password")}
      />
      <PasswordField
        id={NEW_IDS.confirm}
        label={t("password.confirmLabel")}
        autoComplete="new-password"
        value={confirm}
        onValueChange={(value) => {
          setConfirm(value);
          clearError("confirm");
        }}
        error={errorText("confirm")}
      />
      <CheckboxField
        id={NEW_IDS.consent}
        checked={consent}
        onCheckedChange={(value) => {
          setConsent(value);
          if (value) clearError("consent");
        }}
        error={errorText("consent")}
      >
        {t.rich("invite.newAccount.consent", {
          link: (chunks) => (
            <Link href="/privacy" target="_blank" rel="noopener" className={LINK_CLASS}>
              {chunks}
              <span className="sr-only"> {t("shell.newTab")}</span>
            </Link>
          ),
        })}
      </CheckboxField>

      {problem && <ProblemCallout problem={problem} invitePath={invitePath} />}

      <PrimaryButton busy={busy} busyLabel={t("invite.newAccount.submitting")}>
        {t("invite.newAccount.submit")}
      </PrimaryButton>
    </form>
  );
}
