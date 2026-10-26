"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Callout, DescriptionList, Section, useErrorMessage } from "@/components/kit";
import { apiFetch } from "@/lib/api";
import { FormMessage } from "@/components/settings/shared";
import {
  OrganizationFields,
  focusFirstOrgError,
  toOrgFormValues,
  trimOrgForm,
  useOrgServerErrors,
  useValidateOrgForm,
  type OrgField,
  type OrgFormErrors,
  type OrgFormValues,
} from "./OrganizationFields";
import type { OrgDetail } from "./types";

const ID_PREFIX = "org-settings";

export function OrgSettingsTab({ detail, onSaved }: { detail: OrgDetail; onSaved: () => void }) {
  const t = useTranslations("org.settings");
  const suspended = detail.organization.status === "SUSPENDED";

  if (!detail.canManage || suspended) {
    return (
      <Section title={t("title")} description={t("readOnlyDescription")}>
        <div className="space-y-5">
          <ReadOnlyProfile detail={detail} />
          <p className="text-sm text-on-surface-variant">{suspended ? t("suspendedNote") : t("readOnlyNote")}</p>
        </div>
      </Section>
    );
  }
  // Remount when the saved profile changes so the form starts from the stored values.
  return <ProfileForm key={JSON.stringify(toOrgFormValues(detail.organization))} detail={detail} onSaved={onSaved} />;
}

function ReadOnlyProfile({ detail }: { detail: OrgDetail }) {
  const t = useTranslations("org.form");
  const tTypes = useTranslations("org.types");
  const org = detail.organization;
  const value = (v: string | null) => v || <span className="text-on-surface-variant">—</span>;
  return (
    <DescriptionList
      items={[
        { label: t("name"), value: org.name },
        { label: t("type"), value: tTypes.has(org.type) ? tTypes(org.type) : org.type },
        { label: t("registrationNumber"), value: value(org.registrationNumber) },
        { label: t("phone"), value: value(org.phone) },
        { label: t("email"), value: value(org.email) },
        { label: t("city"), value: value(org.city) },
        { label: t("address"), value: value(org.address) },
      ]}
    />
  );
}

function ProfileForm({ detail, onSaved }: { detail: OrgDetail; onSaved: () => void }) {
  const t = useTranslations("org.settings");
  const router = useRouter();
  const describe = useErrorMessage();
  const validate = useValidateOrgForm();
  const serverErrors = useOrgServerErrors();
  const [initial] = useState<OrgFormValues>(() => toOrgFormValues(detail.organization));
  const [values, setValues] = useState<OrgFormValues>(initial);
  const [errors, setErrors] = useState<OrgFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const current = trimOrgForm(values);
  const changed = (Object.keys(current) as OrgField[]).filter((field) => current[field] !== initial[field]);

  function change(field: OrgField, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (changed.length === 0) return;
    const found = validate(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) {
      focusFirstOrgError(ID_PREFIX, found);
      return;
    }
    // Only the changed fields; an empty optional field is sent as "" and cleared.
    const body = Object.fromEntries(changed.map((field) => [field, current[field]]));
    setBusy(true);
    try {
      await apiFetch(`/api/org/${detail.organization.id}`, { method: "PATCH", body: JSON.stringify(body) });
      toast.success(t("saved"));
      router.refresh();
      onSaved();
    } catch (err) {
      const fields = serverErrors(err);
      if (Object.keys(fields).length) {
        setErrors(fields);
        focusFirstOrgError(ID_PREFIX, fields);
      } else {
        setFormError(describe(err));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title={t("title")} description={t("description")}>
      <form noValidate onSubmit={submit} className="space-y-5">
        <Callout tone="info" icon="visibility">
          {t("visibilityNote")}
        </Callout>
        <OrganizationFields idPrefix={ID_PREFIX} values={values} errors={errors} onChange={change} disabled={busy} />
        {formError && <FormMessage>{formError}</FormMessage>}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="submit" className="h-10 px-5 font-semibold" disabled={busy || changed.length === 0}>
            {busy ? t("saving") : t("save")}
          </Button>
          {changed.length > 0 && !busy && (
            <Button
              type="button"
              variant="ghost"
              className="h-10 px-4"
              onClick={() => {
                setValues(initial);
                setErrors({});
                setFormError(null);
              }}
            >
              {t("discard")}
            </Button>
          )}
          <p className="text-sm text-on-surface-variant">
            {changed.length === 0 ? t("noChanges") : t("unsaved", { count: changed.length })}
          </p>
        </div>
      </form>
    </Section>
  );
}
