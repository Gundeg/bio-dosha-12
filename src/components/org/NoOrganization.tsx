"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Callout, PageHeader, Section, useErrorMessage } from "@/components/kit";
import { apiFetch } from "@/lib/api";
import { FormMessage } from "@/components/settings/shared";
import { mfaSetupHref, type Me } from "@/components/settings/types";
import {
  EMPTY_ORG_FORM,
  OrganizationFields,
  focusFirstOrgError,
  trimOrgForm,
  useOrgServerErrors,
  useValidateOrgForm,
  type OrgField,
  type OrgFormErrors,
} from "./OrganizationFields";
import { StepList } from "./StepList";
import { Icon } from "@/components/ui/icon";

const ID_PREFIX = "register-org";

/**
 * For people without an active membership: the two ways in. Either a clinic
 * invites them, or they register their own organization (starts pending).
 */
export function NoOrganization({ me, onRegistered }: { me: Me; onRegistered: () => void }) {
  const t = useTranslations("org.none");
  const [registeredName, setRegisteredName] = useState<string | null>(null);
  const disabled = me.memberships.filter((m) => m.status === "DISABLED");

  if (registeredName) {
    // 2-step sign-in is required for organization members: set it up before anything else.
    return <RegisteredNeedsTwoStep name={registeredName} />;
  }

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      {disabled.length > 0 && (
        <Callout tone="warning" className="mb-6" title={t("disabledTitle")}>
          <p>{t("disabledBody")}</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 font-medium">
            {disabled.map((m) => (
              <li key={m.id}>{m.organizationName}</li>
            ))}
          </ul>
        </Callout>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Section className="lg:col-span-2" title={t("joinTitle")} description={t("joinDescription")}>
          <StepList
            steps={[
              { title: t("joinStep1Title"), body: t("joinStep1Body", { email: me.email }) },
              { title: t("joinStep2Title"), body: t("joinStep2Body") },
              { title: t("joinStep3Title"), body: t("joinStep3Body") },
            ]}
          />
        </Section>

        <Section className="lg:col-span-3" title={t("registerTitle")} description={t("registerDescription")}>
          <RegisterForm
            me={me}
            onRegistered={(name, needsTwoStep) => {
              if (needsTwoStep) setRegisteredName(name);
              else onRegistered();
            }}
          />
        </Section>
      </div>
    </div>
  );
}

function RegisterForm({
  me,
  onRegistered,
}: {
  me: Me;
  onRegistered: (name: string, needsTwoStep: boolean) => void;
}) {
  const t = useTranslations("org.none");
  const router = useRouter();
  const describe = useErrorMessage();
  const validate = useValidateOrgForm();
  const serverErrors = useOrgServerErrors();
  const { update } = useSession();
  const [values, setValues] = useState(EMPTY_ORG_FORM);
  const [errors, setErrors] = useState<OrgFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function change(field: OrgField, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) {
      focusFirstOrgError(ID_PREFIX, found);
      return;
    }
    const body = trimOrgForm(values);
    setBusy(true);
    try {
      await apiFetch("/api/org", { method: "POST", body: JSON.stringify(body) });
    } catch (err) {
      setBusy(false);
      const fields = serverErrors(err);
      if (Object.keys(fields).length) {
        setErrors(fields);
        focusFirstOrgError(ID_PREFIX, fields);
      } else {
        setFormError(describe(err));
      }
      return;
    }

    // New claims: the person is now an organization owner (2-step sign-in becomes required).
    await update({}); // {} forces a claim refresh (see src/components/auth/session.ts)
    toast.success(t("registered"));
    const needsTwoStep = !me.mfa.enabled;
    if (!needsTwoStep) router.refresh();
    onRegistered(body.name, needsTwoStep);
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      <OrganizationFields idPrefix={ID_PREFIX} values={values} errors={errors} onChange={change} disabled={busy} />
      <Callout tone="info" icon="verified">
        {t("verifyNote")}
      </Callout>
      {formError && <FormMessage>{formError}</FormMessage>}
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? t("registering") : t("register")}
      </Button>
    </form>
  );
}

function RegisteredNeedsTwoStep({ name }: { name: string }) {
  const t = useTranslations("org.none");
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow={t("eyebrow")} title={t("doneTitle")} description={t("doneDescription", { name })} />
      <Section title={t("doneNextTitle")}>
        <StepList
          steps={[
            { title: t("doneStep1Title"), body: t("doneStep1Body") },
            { title: t("doneStep2Title"), body: t("doneStep2Body") },
            { title: t("doneStep3Title"), body: t("doneStep3Body") },
          ]}
          current={0}
        />
        <ButtonLink href={mfaSetupHref("/org")} size="lg" className="mt-6">
          <Icon name="phonelink_lock" className="size-4" />
          {t("doneAction")}
        </ButtonLink>
      </Section>
    </div>
  );
}
