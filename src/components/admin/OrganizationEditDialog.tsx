"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useErrorMessage } from "@/components/kit";
import { ApiError } from "@/lib/api";
import { ORGANIZATION_TYPES } from "@/lib/schemas/organization";
import { FormError, SelectField, TextAreaField, TextField } from "./fields";
import { useAdminLabels } from "./hooks";
import { invalidFields, looksLikeEmail } from "./lib";

export interface OrganizationProfile {
  name: string;
  type: string;
  registrationNumber: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
}

type ProfileForm = Record<keyof OrganizationProfile, string>;

const FIELDS = ["name", "type", "registrationNumber", "phone", "email", "city", "address"] as const;

function toForm(p: OrganizationProfile): ProfileForm {
  return {
    name: p.name,
    type: p.type,
    registrationNumber: p.registrationNumber ?? "",
    phone: p.phone ?? "",
    email: p.email ?? "",
    city: p.city ?? "",
    address: p.address ?? "",
  };
}

/**
 * Corrects an organization's profile. Only changed fields are sent; an emptied
 * optional field is sent as "" and cleared by the API.
 */
export function OrganizationEditDialog({
  open,
  onOpenChange,
  profile,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: OrganizationProfile;
  onSave: (fields: Partial<ProfileForm>) => Promise<void>;
}) {
  const t = useTranslations("admin");
  const tk = useTranslations("kit");
  const labels = useAdminLabels();
  const describe = useErrorMessage();
  const initial = toForm(profile);
  const [form, setForm] = useState<ProfileForm>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverInvalid, setServerInvalid] = useState<Set<string>>(new Set());

  // Start from the stored profile every time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(initial);
      setError(null);
      setServerInvalid(new Set());
    }
  }

  const changes: Partial<ProfileForm> = {};
  for (const key of FIELDS) {
    if (form[key].trim() !== initial[key].trim()) changes[key] = form[key].trim();
  }
  const changedCount = Object.keys(changes).length;
  const nameError = form.name.trim().length < 2 ? t("orgForm.errors.name") : null;
  const emailError = form.email.trim() && !looksLikeEmail(form.email) ? t("orgForm.errors.email") : null;
  const genericError = (key: string) => (serverInvalid.has(key) ? t("orgForm.errors.generic") : null);

  function set(key: keyof ProfileForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!changedCount || nameError || emailError || busy) return;
    setBusy(true);
    setError(null);
    setServerInvalid(new Set());
    try {
      await onSave(changes);
      setBusy(false);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setServerInvalid(invalidFields(err.fieldErrors));
      setError(describe(err));
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={save} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("org.edit.title")}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">{t("org.edit.description")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              className="sm:col-span-2"
              label={t("orgForm.name")}
              value={form.name}
              onChange={(v) => set("name", v)}
              required
              maxLength={150}
              error={nameError ?? genericError("name")}
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
              error={genericError("registrationNumber")}
            />
            <TextField
              label={t("orgForm.phone")}
              type="tel"
              value={form.phone}
              onChange={(v) => set("phone", v)}
              maxLength={50}
              error={genericError("phone")}
            />
            <TextField
              label={t("orgForm.email")}
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              maxLength={200}
              error={emailError ?? genericError("email")}
            />
            <TextField
              label={t("orgForm.city")}
              value={form.city}
              onChange={(v) => set("city", v)}
              maxLength={100}
              error={genericError("city")}
            />
            <div className="sm:col-span-2">
              <TextAreaField
                label={t("orgForm.address")}
                value={form.address}
                onChange={(v) => set("address", v)}
                maxLength={500}
                rows={2}
                error={genericError("address")}
              />
            </div>
          </div>

          <p className="text-xs text-on-surface-variant" aria-live="polite">
            {changedCount ? t("org.edit.changed", { count: changedCount }) : t("org.edit.noChanges")}
            {" "}
            {t("org.edit.clearHint")}
          </p>

          <FormError message={error} />

          <DialogFooter>
            <Button type="button" variant="outline" size="lg" disabled={busy} onClick={() => onOpenChange(false)}>
              {tk("cancel")}
            </Button>
            <Button type="submit" size="lg" disabled={busy || !changedCount || !!nameError || !!emailError}>
              {busy ? tk("working") : t("common.saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
