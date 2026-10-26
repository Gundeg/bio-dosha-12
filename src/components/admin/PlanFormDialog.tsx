"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Callout, useErrorMessage } from "@/components/kit";
import { apiFetch } from "@/lib/api";
import { CheckboxField, FormError, RadioCards, SwitchField, TextAreaField, TextField } from "./fields";
import { useAdminLabels } from "./hooks";
import { hasPdfReports, limitOf, type AdminPlan, type PlanAudience, type PlanLimits } from "./lib";
import { AUDIENCE_LIMITS } from "./PlanUsage";

type LimitKey = "maxProfiles" | "maxPractitioners" | "maxPatients";
const MAX_LIMIT = 1_000_000;
const MAX_PRICE = 1_000_000_000;

interface LimitInput {
  value: string;
  unlimited: boolean;
}

interface PlanForm {
  code: string;
  audience: PlanAudience;
  nameMn: string;
  nameEn: string;
  descriptionMn: string;
  descriptionEn: string;
  price: string;
  limits: Record<LimitKey, LimitInput>;
  pdfReports: boolean;
  sortOrder: string;
  isActive: boolean;
  isDefault: boolean;
}

function toForm(plan: AdminPlan | null): PlanForm {
  const limitInput = (key: LimitKey): LimitInput => {
    if (!plan) return { value: "", unlimited: false };
    const limit = limitOf(plan.limits, key);
    return limit === null ? { value: "", unlimited: true } : { value: String(limit), unlimited: false };
  };
  return {
    code: plan?.code ?? "",
    audience: plan?.audience ?? "INDIVIDUAL",
    nameMn: plan?.nameMn ?? "",
    nameEn: plan?.nameEn ?? "",
    descriptionMn: plan?.descriptionMn ?? "",
    descriptionEn: plan?.descriptionEn ?? "",
    price: plan?.priceMonthlyMnt === null || plan?.priceMonthlyMnt === undefined ? "" : String(plan.priceMonthlyMnt),
    limits: { maxProfiles: limitInput("maxProfiles"), maxPractitioners: limitInput("maxPractitioners"), maxPatients: limitInput("maxPatients") },
    pdfReports: plan ? hasPdfReports(plan.limits) : true,
    sortOrder: String(plan?.sortOrder ?? 0),
    isActive: plan?.isActive ?? true,
    isDefault: plan?.isDefault ?? false,
  };
}

/** Whole number within range, or null when the text is not one. */
function wholeNumber(text: string, max: number): number | null {
  if (!/^\d+$/.test(text.trim())) return null;
  const n = Number(text.trim());
  return Number.isSafeInteger(n) && n <= max ? n : null;
}

const textOrNull = (text: string) => (text.trim() ? text.trim() : null);

/**
 * Creates or edits a plan (superadmin). Edits send only the fields that
 * changed. Limits are sent as a whole object (the API replaces it), starting
 * from the stored limits so keys of the other audience are kept.
 */
export function PlanFormDialog({
  open,
  onOpenChange,
  plan,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null creates a new plan. */
  plan: AdminPlan | null;
  onSaved: (message: string) => void;
}) {
  const t = useTranslations("admin");
  const tk = useTranslations("kit");
  const labels = useAdminLabels();
  const describe = useErrorMessage();
  const editing = plan !== null;
  const [form, setForm] = useState<PlanForm>(() => toForm(plan));
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from the stored plan (or an empty form) every time the dialog opens.
  const [openedFor, setOpenedFor] = useState<string | null>(open ? (plan?.id ?? "new") : null);
  const target = open ? (plan?.id ?? "new") : null;
  if (target !== openedFor) {
    setOpenedFor(target);
    if (target) {
      setForm(toForm(plan));
      setTouched(false);
      setError(null);
    }
  }

  const relevantKeys = AUDIENCE_LIMITS[form.audience];
  const willBeDefault = editing ? plan.isDefault || form.isDefault : form.isDefault;

  // ── Validation ──
  const errors: Partial<Record<string, string>> = {};
  if (!editing && !/^[A-Z0-9_]{2,50}$/.test(form.code)) errors.code = t("planForm.errors.code");
  if (!form.nameMn.trim()) errors.nameMn = t("planForm.errors.name");
  if (!form.nameEn.trim()) errors.nameEn = t("planForm.errors.name");
  if (form.price.trim() && wholeNumber(form.price, MAX_PRICE) === null) errors.price = t("planForm.errors.price");
  if (wholeNumber(form.sortOrder, 10_000) === null) errors.sortOrder = t("planForm.errors.sortOrder");
  for (const key of relevantKeys) {
    const input = form.limits[key];
    if (!input.unlimited && wholeNumber(input.value, MAX_LIMIT) === null) errors[key] = t("planForm.errors.limit");
  }
  const valid = Object.keys(errors).length === 0;
  const shownError = (key: string) => (touched ? errors[key] : undefined);

  function buildLimits(): PlanLimits {
    const out: PlanLimits = { ...(plan?.limits ?? {}) };
    for (const key of relevantKeys) {
      const input = form.limits[key];
      out[key] = input.unlimited ? null : (wholeNumber(input.value, MAX_LIMIT) ?? 0);
    }
    if (form.audience === "ORGANIZATION") out.pdfReports = form.pdfReports;
    return out;
  }

  function limitsChanged(next: PlanLimits): boolean {
    if (!plan) return true;
    const before = plan.limits;
    const keys = new Set([...Object.keys(before), ...Object.keys(next)]) as Set<keyof PlanLimits>;
    for (const key of keys) {
      const a = key === "pdfReports" ? hasPdfReports(before) : limitOf(before, key);
      const b = key === "pdfReports" ? hasPdfReports(next) : limitOf(next, key);
      if (a !== b) return true;
    }
    return false;
  }

  function editChanges(): Record<string, unknown> {
    if (!plan) return {};
    const changes: Record<string, unknown> = {};
    if (form.nameMn.trim() !== plan.nameMn) changes.nameMn = form.nameMn.trim();
    if (form.nameEn.trim() !== plan.nameEn) changes.nameEn = form.nameEn.trim();
    if (textOrNull(form.descriptionMn) !== (plan.descriptionMn ?? null)) changes.descriptionMn = textOrNull(form.descriptionMn);
    if (textOrNull(form.descriptionEn) !== (plan.descriptionEn ?? null)) changes.descriptionEn = textOrNull(form.descriptionEn);
    const price = form.price.trim() ? wholeNumber(form.price, MAX_PRICE) : null;
    if (price !== plan.priceMonthlyMnt) changes.priceMonthlyMnt = price;
    const limits = buildLimits();
    if (limitsChanged(limits)) changes.limits = limits;
    const sortOrder = wholeNumber(form.sortOrder, 10_000);
    if (sortOrder !== null && sortOrder !== plan.sortOrder) changes.sortOrder = sortOrder;
    const isActive = willBeDefault ? true : form.isActive;
    if (isActive !== plan.isActive) changes.isActive = isActive;
    if (!plan.isDefault && form.isDefault) changes.isDefault = true;
    return changes;
  }

  const changes = editing ? editChanges() : null;
  const changeCount = changes ? Object.keys(changes).length : 0;

  function update<K extends keyof PlanForm>(key: K, value: PlanForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function updateLimit(key: LimitKey, patch: Partial<LimitInput>) {
    setForm((f) => ({ ...f, limits: { ...f.limits, [key]: { ...f.limits[key], ...patch } } }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid || busy) return;
    if (editing && changeCount === 0) return;
    setBusy(true);
    setError(null);
    try {
      if (plan) {
        await apiFetch(`/api/admin/plans/${encodeURIComponent(plan.id)}`, { method: "PATCH", body: JSON.stringify(changes) });
        onSaved(t("planForm.saved", { name: labels.planName({ ...plan, nameMn: form.nameMn, nameEn: form.nameEn }) }));
      } else {
        await apiFetch("/api/admin/plans", {
          method: "POST",
          body: JSON.stringify({
            code: form.code,
            audience: form.audience,
            nameMn: form.nameMn.trim(),
            nameEn: form.nameEn.trim(),
            descriptionMn: textOrNull(form.descriptionMn),
            descriptionEn: textOrNull(form.descriptionEn),
            priceMonthlyMnt: form.price.trim() ? wholeNumber(form.price, MAX_PRICE) : null,
            limits: buildLimits(),
            isDefault: form.isDefault,
            isActive: form.isDefault ? true : form.isActive,
            sortOrder: wholeNumber(form.sortOrder, 10_000) ?? 0,
          }),
        });
        onSaved(t("planForm.created", { code: form.code }));
      }
      setBusy(false);
      onOpenChange(false);
    } catch (err) {
      setError(describe(err));
      setBusy(false);
    }
  }

  const audienceLabel = labels.audience(form.audience);

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit} noValidate className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="font-headline text-lg font-bold">
              {plan ? t("planForm.editTitle", { name: labels.planName(plan) }) : t("planForm.createTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {plan ? t("planForm.editDescription", { code: plan.code, audience: audienceLabel }) : t("planForm.createDescription")}
            </DialogDescription>
          </DialogHeader>

          {!plan && (
            <div className="grid gap-4">
              <TextField
                label={t("planForm.code")}
                value={form.code}
                onChange={(v) => update("code", v.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                required
                maxLength={50}
                mono
                hint={t("planForm.codeHint")}
                error={shownError("code")}
              />
              <RadioCards
                legend={t("planForm.audience")}
                value={form.audience}
                onChange={(v) => update("audience", v)}
                columns={2}
                options={[
                  { value: "INDIVIDUAL", label: labels.audience("INDIVIDUAL"), description: t("planForm.audienceIndividualHint") },
                  { value: "ORGANIZATION", label: labels.audience("ORGANIZATION"), description: t("planForm.audienceOrganizationHint") },
                ]}
              />
            </div>
          )}

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {t("planForm.sectionNames")}
            </legend>
            <TextField
              label={t("planForm.nameMn")}
              value={form.nameMn}
              onChange={(v) => update("nameMn", v)}
              required
              maxLength={100}
              error={shownError("nameMn")}
            />
            <TextField
              label={t("planForm.nameEn")}
              value={form.nameEn}
              onChange={(v) => update("nameEn", v)}
              required
              maxLength={100}
              error={shownError("nameEn")}
            />
            <TextAreaField
              label={t("planForm.descriptionMn")}
              value={form.descriptionMn}
              onChange={(v) => update("descriptionMn", v)}
              maxLength={500}
              rows={2}
            />
            <TextAreaField
              label={t("planForm.descriptionEn")}
              value={form.descriptionEn}
              onChange={(v) => update("descriptionEn", v)}
              maxLength={500}
              rows={2}
            />
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {t("planForm.sectionPrice")}
            </legend>
            <TextField
              label={t("planForm.price")}
              value={form.price}
              onChange={(v) => update("price", v)}
              inputMode="numeric"
              hint={t("planForm.priceHint")}
              error={shownError("price")}
            />
            <TextField
              label={t("planForm.sortOrder")}
              value={form.sortOrder}
              onChange={(v) => update("sortOrder", v)}
              inputMode="numeric"
              hint={t("planForm.sortOrderHint")}
              error={shownError("sortOrder")}
            />
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {t("planForm.sectionLimits", { audience: audienceLabel })}
            </legend>
            {relevantKeys.map((key) => {
              const input = form.limits[key];
              return (
                <div key={key} className="grid items-start gap-2 sm:grid-cols-[1fr_auto] sm:gap-4">
                  <TextField
                    label={t(`limits.${key}`)}
                    value={input.unlimited ? "" : input.value}
                    onChange={(v) => updateLimit(key, { value: v })}
                    inputMode="numeric"
                    disabled={input.unlimited}
                    placeholder={input.unlimited ? tk("unlimited") : undefined}
                    error={shownError(key)}
                  />
                  <CheckboxField
                    className="sm:mt-6"
                    label={tk("unlimited")}
                    checked={input.unlimited}
                    onChange={(unlimited) => updateLimit(key, { unlimited })}
                  />
                </div>
              );
            })}
            {form.audience === "ORGANIZATION" && (
              <CheckboxField
                label={t("planForm.pdfReports")}
                description={t("planForm.pdfReportsHint")}
                checked={form.pdfReports}
                onChange={(v) => update("pdfReports", v)}
              />
            )}
            <p className="text-xs text-on-surface-variant">{t("planForm.limitsHint")}</p>
          </fieldset>

          <fieldset className="grid gap-3 rounded-xl bg-surface-container-low/60 p-3 ring-1 ring-outline-variant/30">
            <legend className="sr-only">{t("planForm.sectionAvailability")}</legend>
            {plan?.isDefault ? (
              <Callout tone="info" icon="star">
                {t("planForm.isDefaultNote", { audience: audienceLabel })}
              </Callout>
            ) : (
              <CheckboxField
                label={t("planForm.makeDefault", { audience: audienceLabel })}
                description={t("planForm.makeDefaultHint")}
                checked={form.isDefault}
                onChange={(v) => update("isDefault", v)}
              />
            )}
            <SwitchField
              label={t("planForm.active")}
              description={willBeDefault ? t("planForm.activeDefaultHint") : t("planForm.activeHint")}
              checked={willBeDefault ? true : form.isActive}
              onChange={(v) => update("isActive", v)}
              disabled={willBeDefault}
            />
          </fieldset>

          {editing && (
            <p className="text-xs text-on-surface-variant" aria-live="polite">
              {changeCount ? t("planForm.changed", { count: changeCount }) : t("planForm.noChanges")}
            </p>
          )}

          <FormError message={error} />

          <DialogFooter>
            <Button type="button" variant="outline" className="h-10 px-4" disabled={busy} onClick={() => onOpenChange(false)}>
              {tk("cancel")}
            </Button>
            <Button type="submit" className="h-10 px-4 font-semibold" disabled={busy || (editing && changeCount === 0)}>
              {busy ? tk("working") : plan ? t("common.saveChanges") : t("planForm.createSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
