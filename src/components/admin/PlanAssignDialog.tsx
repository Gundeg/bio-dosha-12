"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/states";
import { StatusBadge, useApiQuery, useErrorMessage } from "@/components/kit";
import { formatMnt } from "@/lib/formatNumber";
import { FormError, RadioCards, TextAreaField, TextField } from "./fields";
import { useAdminLabels } from "./hooks";
import { dayBoundaryIso, isoToDay, type AdminPlan, type EffectivePlanInfo, type PlanAudience } from "./lib";
import { PlanLimitsSummary } from "./PlanUsage";

export interface PlanAssignment {
  planCode: string | null;
  note: string | null;
  currentPeriodEnd: string | null;
}

const DEFAULT_CHOICE = "__default__";

/**
 * Assigns a plan to an organization or a person, or removes the assignment so
 * the audience's default plan applies again. Payments are not connected yet, so
 * the note records how the plan was agreed (contract, invoice…).
 */
export function PlanAssignDialog({
  open,
  onOpenChange,
  audience,
  current,
  subjectName,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience: PlanAudience;
  current: EffectivePlanInfo;
  subjectName: string;
  onSubmit: (assignment: PlanAssignment) => Promise<void>;
}) {
  const t = useTranslations("admin");
  const tk = useTranslations("kit");
  const labels = useAdminLabels();
  const describe = useErrorMessage();
  const plans = useApiQuery<AdminPlan[]>(open ? "/api/admin/plans" : null);

  const initial = {
    choice: current.source === "subscription" ? current.code : DEFAULT_CHOICE,
    note: current.source === "subscription" ? (current.note ?? "") : "",
    periodEnd: current.source === "subscription" ? isoToDay(current.currentPeriodEnd) : "",
  };
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from the current assignment every time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(initial);
      setError(null);
    }
  }

  const options = (plans.data ?? []).filter((p) => p.audience === audience && (p.isActive || p.code === current.code));
  const defaultPlan = options.find((p) => p.isDefault);
  const isDefaultChoice = form.choice === DEFAULT_CHOICE;
  const changed =
    form.choice !== initial.choice ||
    (!isDefaultChoice && (form.note.trim() !== initial.note.trim() || form.periodEnd !== initial.periodEnd));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!changed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(
        isDefaultChoice
          ? { planCode: null, note: null, currentPeriodEnd: null }
          : {
              planCode: form.choice,
              note: form.note.trim() || null,
              currentPeriodEnd: form.periodEnd ? dayBoundaryIso(form.periodEnd, "end") : null,
            }
      );
      setBusy(false);
      onOpenChange(false);
    } catch (err) {
      setError(describe(err));
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <form onSubmit={save} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("planAssign.title", { name: subjectName })}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">{t("planAssign.description")}</DialogDescription>
          </DialogHeader>

          {plans.error && !plans.data ? (
            <FormError message={describe(plans.error)} />
          ) : !plans.data ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : (
            <RadioCards
              legend={t("planAssign.choose")}
              value={form.choice}
              onChange={(choice) => setForm((f) => ({ ...f, choice }))}
              options={[
                {
                  value: DEFAULT_CHOICE,
                  label: defaultPlan
                    ? t("planAssign.useDefaultNamed", { name: labels.planName(defaultPlan) })
                    : t("planAssign.useDefault"),
                  description: t("planAssign.useDefaultHint"),
                },
                ...options.map((p) => ({
                  value: p.code,
                  label: labels.planName(p),
                  disabled: !p.isActive,
                  aside: (
                    <span className="flex flex-wrap items-center gap-1.5">
                      {p.isDefault && <StatusBadge tone="primary">{t("plans.default")}</StatusBadge>}
                      {!p.isActive && <StatusBadge tone="neutral">{t("plans.inactive")}</StatusBadge>}
                      <span className="text-xs font-semibold tabular-nums text-on-surface">
                        {formatMnt(p.priceMonthlyMnt) ?? t("plans.freeOrAgreement")}
                      </span>
                    </span>
                  ),
                  description: <PlanLimitsSummary audience={audience} limits={p.limits} />,
                })),
              ]}
            />
          )}

          <TextAreaField
            label={t("planAssign.note")}
            value={form.note}
            onChange={(note) => setForm((f) => ({ ...f, note }))}
            maxLength={300}
            rows={2}
            disabled={isDefaultChoice}
            hint={t("planAssign.noteHint")}
          />
          <TextField
            label={t("planAssign.periodEnd")}
            type="date"
            value={form.periodEnd}
            onChange={(periodEnd) => setForm((f) => ({ ...f, periodEnd }))}
            disabled={isDefaultChoice}
            hint={t("planAssign.periodEndHint")}
          />

          <FormError message={error} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              {tk("cancel")}
            </Button>
            <Button type="submit" size="lg" disabled={!changed || busy || !plans.data}>
              {busy ? tk("working") : t("planAssign.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
