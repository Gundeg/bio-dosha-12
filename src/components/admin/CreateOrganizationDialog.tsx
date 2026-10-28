"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Callout, CopyField, useApiQuery, useErrorMessage } from "@/components/kit";
import { ApiError, apiFetch } from "@/lib/api";
import { ORGANIZATION_TYPES } from "@/lib/schemas/organization";
import { FormError, RadioCards, SelectField, TextAreaField, TextField } from "./fields";
import { useAdminLabels } from "./hooks";
import { invalidFields, looksLikeEmail, type AdminPlan } from "./lib";

interface CreatedOrganization {
  organization: { id: string; name: string; status: string };
  /** Returned to all staff (a new organization has no patient data); null only if that ever changes. */
  inviteUrl: string | null;
  emailSent: boolean;
  expiresAt: string;
}

const EMPTY_FORM = {
  name: "",
  type: "CLINIC" as string,
  registrationNumber: "",
  phone: "",
  email: "",
  city: "",
  address: "",
  ownerEmail: "",
  status: "ACTIVE" as "ACTIVE" | "PENDING",
  planCode: "",
};

/**
 * Staff create an organization (e.g. after signing a contract) and invite its
 * owner in one step. The owner's one-time link is shown once afterwards.
 */
export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const t = useTranslations("admin");
  const tk = useTranslations("kit");
  const labels = useAdminLabels();
  const describe = useErrorMessage();
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const [serverInvalid, setServerInvalid] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<(CreatedOrganization & { ownerEmail: string }) | null>(null);

  const plans = useApiQuery<AdminPlan[]>(open ? "/api/admin/plans" : null);
  const orgPlans = (plans.data ?? []).filter((p) => p.audience === "ORGANIZATION" && p.isActive);
  const defaultPlan = orgPlans.find((p) => p.isDefault);

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const nameError = form.name.trim().length < 2 ? t("orgForm.errors.name") : null;
  const ownerError = !looksLikeEmail(form.ownerEmail) ? t("orgForm.errors.ownerEmail") : null;
  const emailError = form.email.trim() && !looksLikeEmail(form.email) ? t("orgForm.errors.email") : null;
  const fieldError = (key: string, local: string | null, message: string) =>
    (touched && local) || (serverInvalid.has(key) ? message : null);

  function close() {
    if (busy) return;
    onOpenChange(false);
    // Drop the one-time link and the form when the dialog closes.
    setForm(EMPTY_FORM);
    setTouched(false);
    setServerInvalid(new Set());
    setError(null);
    setResult(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (nameError || ownerError || emailError) return;
    setBusy(true);
    setError(null);
    setServerInvalid(new Set());
    const optional = (v: string) => (v.trim() ? v.trim() : null);
    try {
      const created = await apiFetch<CreatedOrganization>("/api/admin/organizations", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          registrationNumber: optional(form.registrationNumber),
          phone: optional(form.phone),
          email: optional(form.email),
          city: optional(form.city),
          address: optional(form.address),
          ownerEmail: form.ownerEmail.trim(),
          status: form.status,
          planCode: form.planCode || null,
        }),
      });
      setResult({ ...created, ownerEmail: form.ownerEmail.trim() });
      toast.success(t("orgForm.created", { name: created.organization.name }));
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) setServerInvalid(invalidFields(err.fieldErrors));
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("orgForm.successTitle")}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {t("orgForm.successBody", { name: result.organization.name })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4" aria-live="polite">
              {result.inviteUrl ? (
                <>
                  {result.emailSent ? (
                    <Callout tone="success" icon="mark_email_read">
                      {t("link.emailSent", { email: result.ownerEmail })}
                    </Callout>
                  ) : (
                    <Callout tone="info" icon="unsubscribe">
                      {t("link.emailNotSent", { email: result.ownerEmail })}
                    </Callout>
                  )}
                  <CopyField
                    label={t("orgForm.ownerLink")}
                    value={result.inviteUrl}
                    note={`${t("link.validUntil", { date: labels.dateTime(result.expiresAt) ?? "" })} ${tk("shownOnce")}`}
                  />
                </>
              ) : result.emailSent ? (
                <Callout tone="success" icon="mark_email_read" title={t("link.emailedOnly", { email: result.ownerEmail })}>
                  {t("link.emailedOnlyHint", { date: labels.dateTime(result.expiresAt) ?? "" })}
                </Callout>
              ) : (
                <Callout tone="danger" icon="unsubscribe" title={t("link.notDeliveredTitle")}>
                  {t("link.notDeliveredBody", { email: result.ownerEmail })}
                </Callout>
              )}
              <ul className="list-disc space-y-1 pl-5 text-sm text-on-surface-variant">
                <li>{t("orgForm.successStep1")}</li>
                <li>{t("orgForm.successStep2")}</li>
                <li>{t("orgForm.successStep3")}</li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" size="lg" onClick={close}>
                {t("common.done")}
              </Button>
              <ButtonLink href={`/admin/organizations/${result.organization.id}`} size="lg">
                {t("orgForm.openOrganization")}
              </ButtonLink>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{t("orgForm.title")}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">{t("orgForm.description")}</DialogDescription>
            </DialogHeader>

            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="mb-1 text-xs font-semibold text-on-surface-variant">
                {t("orgForm.sectionOrganization")}
              </legend>
              <TextField
                className="sm:col-span-2"
                label={t("orgForm.name")}
                value={form.name}
                onChange={(v) => set("name", v)}
                required
                maxLength={150}
                error={fieldError("name", nameError, t("orgForm.errors.name"))}
              />
              <SelectField
                label={t("orgForm.type")}
                value={form.type}
                onChange={(v) => set("type", v)}
                options={ORGANIZATION_TYPES.map((type) => ({ value: type, label: labels.orgType(type) }))}
              />
              <TextField
                label={t("orgForm.registrationNumber")}
                value={form.registrationNumber}
                onChange={(v) => set("registrationNumber", v)}
                maxLength={50}
                hint={t("orgForm.registrationNumberHint")}
                error={serverInvalid.has("registrationNumber") ? t("orgForm.errors.generic") : null}
              />
              <TextField
                label={t("orgForm.phone")}
                type="tel"
                value={form.phone}
                onChange={(v) => set("phone", v)}
                maxLength={50}
                autoComplete="off"
                error={serverInvalid.has("phone") ? t("orgForm.errors.generic") : null}
              />
              <TextField
                label={t("orgForm.email")}
                type="email"
                value={form.email}
                onChange={(v) => set("email", v)}
                maxLength={200}
                error={fieldError("email", emailError, t("orgForm.errors.email"))}
              />
              <TextField
                label={t("orgForm.city")}
                value={form.city}
                onChange={(v) => set("city", v)}
                maxLength={100}
                error={serverInvalid.has("city") ? t("orgForm.errors.generic") : null}
              />
              <div className="sm:col-span-2">
                <TextAreaField
                  label={t("orgForm.address")}
                  value={form.address}
                  onChange={(v) => set("address", v)}
                  maxLength={500}
                  rows={2}
                  error={serverInvalid.has("address") ? t("orgForm.errors.generic") : null}
                />
              </div>
            </fieldset>

            <fieldset className="grid gap-4">
              <legend className="mb-1 text-xs font-semibold text-on-surface-variant">
                {t("orgForm.sectionOwner")}
              </legend>
              <TextField
                label={t("orgForm.ownerEmail")}
                type="email"
                value={form.ownerEmail}
                onChange={(v) => set("ownerEmail", v)}
                required
                maxLength={200}
                hint={t("orgForm.ownerEmailHint")}
                error={fieldError("ownerEmail", ownerError, t("orgForm.errors.ownerEmail"))}
              />
              <RadioCards
                legend={t("orgForm.startAs")}
                value={form.status}
                onChange={(v) => set("status", v)}
                columns={2}
                options={[
                  { value: "ACTIVE", label: t("orgForm.startActive"), description: t("orgForm.startActiveHint") },
                  { value: "PENDING", label: t("orgForm.startPending"), description: t("orgForm.startPendingHint") },
                ]}
              />
              <SelectField
                label={t("orgForm.plan")}
                value={form.planCode}
                onChange={(v) => set("planCode", v)}
                disabled={plans.loading && !plans.data}
                hint={plans.error ? describe(plans.error) : t("orgForm.planHint")}
                options={[
                  {
                    value: "",
                    label: defaultPlan
                      ? t("planAssign.useDefaultNamed", { name: labels.planName(defaultPlan) })
                      : t("planAssign.useDefault"),
                  },
                  ...orgPlans.map((p) => ({ value: p.code, label: `${labels.planName(p)} (${p.code})` })),
                ]}
              />
            </fieldset>

            <FormError message={error} />

            <DialogFooter>
              <Button type="button" variant="outline" size="lg" disabled={busy} onClick={close}>
                {tk("cancel")}
              </Button>
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? tk("working") : t("orgForm.submit")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
