"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Callout } from "@/components/kit/layout";
import { apiFetch } from "@/lib/api";
import { ORGANIZATION_TYPES, type OrganizationType } from "@/lib/schemas/organization";
import { cn } from "@/lib/utils";
import { AuthShell } from "./AuthShell";
import { CheckboxField, FieldError, LINK_CLASS, PrimaryButton, SelectField, TOUCH_LINK_CLASS, TextField } from "./fields";
import { PasswordField } from "./PasswordField";
import { passwordProblem, passwordProblemKey } from "./password";
import {
  apiErrorCode,
  apiErrorStatus,
  apiFieldNames,
  focusField,
  looksLikeEmail,
  problemKey,
  useKeyText,
  useProblemText,
  type Problem,
} from "./problems";
import { signInWithPassword, navigateAfterAuth } from "./session";

type AccountType = "individual" | "organization";

type Field = "orgName" | "orgEmail" | "name" | "email" | "password" | "consent";

/** Visual order, used to focus the first field that needs attention. */
const FIELD_ORDER: Field[] = ["orgName", "orgEmail", "name", "email", "password", "consent"];

const IDS: Record<Field | "orgType" | "orgRegistration" | "orgPhone" | "orgCity" | "orgAddress", string> = {
  orgName: "register-org-name",
  orgType: "register-org-type",
  orgRegistration: "register-org-registration",
  orgPhone: "register-org-phone",
  orgEmail: "register-org-email",
  orgCity: "register-org-city",
  orgAddress: "register-org-address",
  name: "register-name",
  email: "register-email",
  password: "register-password",
  consent: "register-consent",
};

const ACCOUNT_TYPES: { value: AccountType; icon: string }[] = [
  { value: "individual", icon: "person" },
  { value: "organization", icon: "local_hospital" },
];

interface OrganizationDraft {
  name: string;
  type: OrganizationType;
  registrationNumber: string;
  phone: string;
  email: string;
  city: string;
  address: string;
}

const EMPTY_ORGANIZATION: OrganizationDraft = {
  name: "",
  type: "CLINIC",
  registrationNumber: "",
  phone: "",
  email: "",
  city: "",
  address: "",
};

/**
 * Sign-up for a personal account, or a personal account plus a medical
 * organization that waits for platform verification (the registrant becomes
 * its owner). After success the person is signed in and the proxy sends
 * organization owners to the 2-step setup first.
 */
export function RegisterForm({ initialType = "individual" }: { initialType?: AccountType }) {
  const t = useTranslations("authFlows");
  const router = useRouter();
  const problemText = useProblemText();
  const keyText = useKeyText();

  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [org, setOrg] = useState<OrganizationDraft>(EMPTY_ORGANIZATION);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);

  const isOrganization = accountType === "organization";

  function clearError(field: Field) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function updateOrg<K extends keyof OrganizationDraft>(key: K, value: OrganizationDraft[K]) {
    setOrg((prev) => ({ ...prev, [key]: value }));
  }

  function chooseAccountType(value: AccountType) {
    setAccountType(value);
    // Errors of the organization fields must not outlive the fields themselves.
    setErrors((prev) => ({ ...prev, orgName: undefined, orgEmail: undefined }));
    setProblem((prev) => (prev && "key" in prev && prev.key === "register.errors.orgInvalid" ? null : prev));
  }

  function validate(): Partial<Record<Field, string>> {
    const found: Partial<Record<Field, string>> = {};
    if (isOrganization) {
      if (org.name.trim().length < 2) found.orgName = "register.errors.orgNameRequired";
      if (org.email.trim() && !looksLikeEmail(org.email)) found.orgEmail = "register.errors.orgEmailInvalid";
    }
    if (!name.trim()) found.name = "register.errors.nameRequired";
    if (!email.trim()) found.email = "shell.errors.emailRequired";
    else if (!looksLikeEmail(email)) found.email = "shell.errors.emailInvalid";
    const issue = passwordProblem(password);
    if (issue) found.password = passwordProblemKey(issue);
    if (!consent) found.consent = "register.errors.consentRequired";
    return found;
  }

  function showErrors(found: Partial<Record<Field, string>>): boolean {
    setErrors(found);
    const first = FIELD_ORDER.find((field) => found[field]);
    if (first) focusField(IDS[first]);
    return !!first;
  }

  function handleApiError(err: unknown) {
    if (apiErrorCode(err) === "email_taken") {
      showErrors({ email: "register.errors.emailTaken" });
      return;
    }
    const fields = apiFieldNames(err);
    if (apiErrorStatus(err) === 400 && fields.length > 0) {
      const found: Partial<Record<Field, string>> = {};
      if (fields.includes("name")) found.name = "register.errors.nameRequired";
      if (fields.includes("email")) found.email = "shell.errors.emailInvalid";
      if (fields.includes("password")) found.password = passwordProblemKey(passwordProblem(password) ?? "tooShort");
      if (fields.includes("acceptPrivacy")) found.consent = "register.errors.consentRequired";
      // Nested organization errors arrive as a single "organization" entry.
      const organizationProblem = fields.includes("organization");
      if (organizationProblem) setProblem(problemKey("register.errors.orgInvalid"));
      const focused = showErrors(found);
      if (!focused && organizationProblem) focusField(IDS.orgName);
      if (focused || organizationProblem) return;
    }
    setProblem({ error: err });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setProblem(null);
    if (showErrors(validate())) return;

    setBusy(true);
    try {
      await apiFetch("/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          acceptPrivacy: true,
          accountType,
          ...(isOrganization
            ? {
                organization: {
                  name: org.name.trim(),
                  type: org.type,
                  registrationNumber: org.registrationNumber.trim(),
                  phone: org.phone.trim(),
                  email: org.email.trim(),
                  city: org.city.trim(),
                  address: org.address.trim(),
                },
              }
            : {}),
        }),
      });
    } catch (err) {
      setBusy(false);
      handleApiError(err);
      return;
    }

    const outcome = await signInWithPassword(email, password);
    if (outcome === "ok") {
      toast.success(t("register.welcome"));
      navigateAfterAuth("/");
      return;
    }
    // The account exists; signing in by hand is the safe fallback.
    router.replace("/login?notice=account_created");
  }

  const errorText = (field: Field) => {
    const key = errors[field];
    if (!key) return undefined;
    if (key === "register.errors.emailTaken") {
      return t.rich(key, {
        login: (chunks) => (
          <Link href="/login" className={LINK_CLASS}>
            {chunks}
          </Link>
        ),
        forgot: (chunks) => (
          <Link href="/forgot" className={LINK_CLASS}>
            {chunks}
          </Link>
        ),
      });
    }
    return keyText(key);
  };

  const privacyLink = (chunks: React.ReactNode) => (
    <Link href="/privacy" target="_blank" rel="noopener" className={LINK_CLASS}>
      {chunks}
      <span className="sr-only"> {t("shell.newTab")}</span>
    </Link>
  );

  return (
    <AuthShell
      width="wide"
      title={t("register.title")}
      description={t("register.subtitle")}
      footer={
        <p>
          {t("register.haveAccount")}{" "}
          <Link href="/login" className={TOUCH_LINK_CLASS}>
            {t("register.signIn")}
          </Link>
        </p>
      }
    >
      <form noValidate onSubmit={submit} className="space-y-8">
        {/* Account type: native radios (arrow keys, form semantics) drawn as large cards. */}
        <fieldset className="min-w-0 space-y-3">
          <legend className="mb-3 text-sm font-semibold text-on-surface">{t("register.typeLegend")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {ACCOUNT_TYPES.map(({ value, icon }) => {
              const checked = accountType === value;
              return (
                <label
                  key={value}
                  className={cn(
                    "relative flex cursor-pointer gap-3 rounded-xl p-4 ring-1 transition-colors",
                    "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
                    checked
                      ? "bg-primary/5 ring-2 ring-primary"
                      : "bg-surface-container-lowest ring-on-surface-variant/30 hover:ring-on-surface-variant/60"
                  )}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value={value}
                    checked={checked}
                    onChange={() => chooseAccountType(value)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "material-symbols-outlined flex size-10 shrink-0 items-center justify-center rounded-xl text-[22px]",
                      checked ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                    )}
                  >
                    {icon}
                  </span>
                  <span className="min-w-0 flex-1 pr-6">
                    <span className="block font-headline font-bold text-on-surface">
                      {t(`register.types.${value}.title`)}
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-on-surface-variant">
                      {t(`register.types.${value}.desc`)}
                    </span>
                  </span>
                  {/* Radio mark: filled when chosen, so the choice is not shown by color alone. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute right-4 top-4 flex size-5 items-center justify-center rounded-full ring-2",
                      checked ? "ring-primary" : "ring-on-surface-variant/50"
                    )}
                  >
                    {checked && <span className="size-2.5 rounded-full bg-primary" />}
                  </span>
                </label>
              );
            })}
          </div>
          <p className="flex gap-2 text-sm leading-relaxed text-on-surface-variant">
            <span className="material-symbols-outlined shrink-0 text-[18px] text-primary" aria-hidden="true">
              mail
            </span>
            <span>{t("register.inviteHint")}</span>
          </p>
        </fieldset>

        {isOrganization && (
          <fieldset className="min-w-0 space-y-4">
            <legend className="mb-4 font-headline text-base font-bold text-on-surface">{t("register.orgSection")}</legend>
            <TextField
              id={IDS.orgName}
              label={t("register.orgName")}
              autoComplete="organization"
              maxLength={150}
              required
              value={org.name}
              onValueChange={(value) => {
                updateOrg("name", value);
                clearError("orgName");
              }}
              error={errorText("orgName")}
            />
            <SelectField
              id={IDS.orgType}
              label={t("register.orgType")}
              value={org.type}
              onValueChange={(value) => updateOrg("type", value as OrganizationType)}
              options={ORGANIZATION_TYPES.map((type) => ({ value: type, label: t(`register.orgTypes.${type}`) }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id={IDS.orgRegistration}
                label={t("register.registrationNumber")}
                optional
                autoComplete="off"
                maxLength={50}
                value={org.registrationNumber}
                onValueChange={(value) => updateOrg("registrationNumber", value)}
              />
              <TextField
                id={IDS.orgPhone}
                label={t("register.phone")}
                optional
                type="tel"
                inputMode="tel"
                autoComplete="section-org tel"
                maxLength={50}
                value={org.phone}
                onValueChange={(value) => updateOrg("phone", value)}
              />
            </div>
            <TextField
              id={IDS.orgEmail}
              label={t("register.orgEmail")}
              optional
              type="email"
              inputMode="email"
              autoComplete="section-org email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={200}
              value={org.email}
              onValueChange={(value) => {
                updateOrg("email", value);
                clearError("orgEmail");
              }}
              error={errorText("orgEmail")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id={IDS.orgCity}
                label={t("register.city")}
                optional
                autoComplete="section-org address-level1"
                maxLength={100}
                value={org.city}
                onValueChange={(value) => updateOrg("city", value)}
              />
              <TextField
                id={IDS.orgAddress}
                label={t("register.address")}
                optional
                autoComplete="section-org street-address"
                maxLength={500}
                value={org.address}
                onValueChange={(value) => updateOrg("address", value)}
              />
            </div>
          </fieldset>
        )}

        <fieldset className="min-w-0 space-y-4">
          <legend className="mb-1 font-headline text-base font-bold text-on-surface">
            {isOrganization ? t("register.accountSectionOrg") : t("register.accountSection")}
          </legend>
          {isOrganization && (
            <p className="text-sm leading-relaxed text-on-surface-variant">{t("register.accountSectionOrgHint")}</p>
          )}
          <TextField
            id={IDS.name}
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
          <TextField
            id={IDS.email}
            label={t("register.email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={200}
            required
            placeholder={t("shell.emailPlaceholder")}
            hint={t("register.emailHint")}
            value={email}
            onValueChange={(value) => {
              setEmail(value);
              clearError("email");
            }}
            error={errorText("email")}
          />
          <PasswordField
            id={IDS.password}
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
        </fieldset>

        <CheckboxField
          id={IDS.consent}
          checked={consent}
          onCheckedChange={(value) => {
            setConsent(value);
            if (value) clearError("consent");
          }}
          error={errorText("consent")}
        >
          {t.rich(isOrganization ? "register.consentOrg" : "register.consent", { link: privacyLink })}
        </CheckboxField>

        {isOrganization && (
          <section aria-labelledby="register-next-title" className="rounded-xl bg-surface-container-low p-4 sm:p-5">
            <h2 id="register-next-title" className="font-headline text-sm font-bold text-on-surface">
              {t("register.next.title")}
            </h2>
            <ol className="mt-3 space-y-3">
              {(["review", "prepare", "open"] as const).map((key, index) => (
                <li key={key} className="flex gap-3 text-sm leading-relaxed text-on-surface">
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary"
                  >
                    {index + 1}
                  </span>
                  <span>{t(`register.next.${key}`)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="space-y-4">
          {problem && <Callout tone="danger">{problemText(problem)}</Callout>}
          {Object.values(errors).some(Boolean) && !problem && (
            <FieldError id="register-summary">{t("register.errors.fixAbove")}</FieldError>
          )}
          <PrimaryButton busy={busy} busyLabel={t("register.submitting")}>
            {t("register.submit")}
          </PrimaryButton>
        </div>
      </form>
    </AuthShell>
  );
}
