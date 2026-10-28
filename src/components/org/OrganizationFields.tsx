"use client";

import { useTranslations } from "next-intl";
import { ORGANIZATION_TYPES, type OrganizationType } from "@/lib/schemas/organization";
import { ApiError } from "@/lib/api";
import { Field, SelectInput, TextInput, looksLikeEmail } from "@/components/settings/shared";
import type { OrgDetail } from "./types";

/** Organization profile as edited in a form (empty string = not given). */
export interface OrgFormValues {
  name: string;
  type: OrganizationType;
  registrationNumber: string;
  phone: string;
  email: string;
  city: string;
  address: string;
}

export type OrgField = keyof OrgFormValues;
export type OrgFormErrors = Partial<Record<OrgField, string>>;

export const EMPTY_ORG_FORM: OrgFormValues = {
  name: "",
  type: "CLINIC",
  registrationNumber: "",
  phone: "",
  email: "",
  city: "",
  address: "",
};

/** Limits from src/lib/schemas/organization.ts. */
const MAX: Record<Exclude<OrgField, "type">, number> = {
  name: 150,
  registrationNumber: 50,
  phone: 50,
  email: 200,
  city: 100,
  address: 500,
};

const ORDER: OrgField[] = ["name", "type", "registrationNumber", "phone", "email", "city", "address"];

function isOrganizationType(value: string): value is OrganizationType {
  return (ORGANIZATION_TYPES as readonly string[]).includes(value);
}

export function toOrgFormValues(org: OrgDetail["organization"]): OrgFormValues {
  return {
    name: org.name,
    type: isOrganizationType(org.type) ? org.type : "OTHER",
    registrationNumber: org.registrationNumber ?? "",
    phone: org.phone ?? "",
    email: org.email ?? "",
    city: org.city ?? "",
    address: org.address ?? "",
  };
}

/** Trimmed values ready for the API (empty optional fields become ""). */
export function trimOrgForm(values: OrgFormValues): OrgFormValues {
  return {
    name: values.name.trim(),
    type: values.type,
    registrationNumber: values.registrationNumber.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    city: values.city.trim(),
    address: values.address.trim(),
  };
}

/** Client-side checks; the API validates again. */
export function useValidateOrgForm() {
  const t = useTranslations("org.form");
  return (values: OrgFormValues): OrgFormErrors => {
    const v = trimOrgForm(values);
    const errors: OrgFormErrors = {};
    if (v.name.length < 2) errors.name = t("nameRequired");
    if (v.email && !looksLikeEmail(v.email)) errors.email = t("emailInvalid");
    return errors;
  };
}

/** Field errors the API returned for an organization body, in the interface language. */
export function useOrgServerErrors() {
  const t = useTranslations("org.form");
  return (err: unknown): OrgFormErrors => {
    if (!(err instanceof ApiError) || !err.fieldErrors) return {};
    const errors: OrgFormErrors = {};
    for (const field of ORDER) {
      if (err.fieldErrors[field]?.length) {
        errors[field] = field === "name" ? t("nameRequired") : field === "email" ? t("emailInvalid") : t("fieldInvalid");
      }
    }
    return errors;
  };
}

/** Focuses the first field with an error. */
export function focusFirstOrgError(idPrefix: string, errors: OrgFormErrors) {
  const first = ORDER.find((f) => errors[f]);
  if (first) document.getElementById(`${idPrefix}-${first}`)?.focus();
}

/** The organization profile fields: used to register an organization and in its settings. */
export function OrganizationFields({
  idPrefix,
  values,
  errors,
  onChange,
  disabled,
}: {
  idPrefix: string;
  values: OrgFormValues;
  errors: OrgFormErrors;
  onChange: (field: OrgField, value: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("org.form");
  const tTypes = useTranslations("org.types");
  const id = (field: OrgField) => `${idPrefix}-${field}`;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field id={id("name")} label={t("name")} required error={errors.name} hint={t("nameHint")} className="sm:col-span-2">
        {(control) => (
          <TextInput
            {...control}
            value={values.name}
            maxLength={MAX.name}
            autoComplete="organization"
            disabled={disabled}
            onChange={(e) => onChange("name", e.target.value)}
          />
        )}
      </Field>
      <Field id={id("type")} label={t("type")} error={errors.type}>
        {(control) => (
          <SelectInput
            {...control}
            value={values.type}
            disabled={disabled}
            onChange={(e) => onChange("type", e.target.value)}
          >
            {ORGANIZATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {tTypes(type)}
              </option>
            ))}
          </SelectInput>
        )}
      </Field>
      <Field id={id("registrationNumber")} label={t("registrationNumber")} error={errors.registrationNumber} hint={t("registrationNumberHint")}>
        {(control) => (
          <TextInput
            {...control}
            value={values.registrationNumber}
            maxLength={MAX.registrationNumber}
            autoComplete="off"
            disabled={disabled}
            onChange={(e) => onChange("registrationNumber", e.target.value)}
          />
        )}
      </Field>
      <Field id={id("phone")} label={t("phone")} error={errors.phone}>
        {(control) => (
          <TextInput
            {...control}
            type="tel"
            inputMode="tel"
            value={values.phone}
            maxLength={MAX.phone}
            autoComplete="tel"
            disabled={disabled}
            onChange={(e) => onChange("phone", e.target.value)}
          />
        )}
      </Field>
      <Field id={id("email")} label={t("email")} error={errors.email} hint={t("emailHint")}>
        {(control) => (
          <TextInput
            {...control}
            type="email"
            inputMode="email"
            value={values.email}
            maxLength={MAX.email}
            autoComplete="email"
            disabled={disabled}
            onChange={(e) => onChange("email", e.target.value)}
          />
        )}
      </Field>
      <Field id={id("city")} label={t("city")} error={errors.city} className="sm:col-span-2">
        {(control) => (
          <TextInput
            {...control}
            value={values.city}
            maxLength={MAX.city}
            autoComplete="address-level1"
            disabled={disabled}
            onChange={(e) => onChange("city", e.target.value)}
            className="sm:max-w-sm"
          />
        )}
      </Field>
      <Field id={id("address")} label={t("address")} error={errors.address} className="sm:col-span-2">
        {(control) => (
          <textarea
            {...control}
            value={values.address}
            maxLength={MAX.address}
            rows={3}
            autoComplete="street-address"
            disabled={disabled}
            onChange={(e) => onChange("address", e.target.value)}
            className="w-full rounded-lg border border-input bg-surface-container-lowest px-2.5 py-2 text-base text-on-surface outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm"
          />
        )}
      </Field>
    </div>
  );
}
