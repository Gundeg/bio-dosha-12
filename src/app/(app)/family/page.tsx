"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon, type IconName } from "@/components/ui/icon";
import { apiFetch, ApiError } from "@/lib/api";
import { ErrorState, PageLoading } from "@/components/states";
import { Callout, PageHeader } from "@/components/kit/layout";
import { StatusBadge, type BadgeTone } from "@/components/kit/status";
import { SelectInput } from "@/components/settings/shared/Field";
import { useApiQuery, useErrorMessage } from "@/components/kit/hooks";
import { DOSHA_MAP, DoshaKey } from "@/lib/ktMapping";
import { calcAge } from "@/lib/bediEngine";
import { WEIGHT_MAX_KG, WEIGHT_MIN_KG, fullName, isValidWeight } from "@/lib/person";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Profile {
  id: string;
  name: string;
  lastName: string | null;
  relationship: string;
  sex: "MALE" | "FEMALE";
  heightCm: number;
  birthDate: string;
  doshaType: string | null;
  ktScore: number | null;
  bediRecords: Array<{ deviation: number; status: string; date: string }>;
}

/** The personal plan and how much of it is used (GET /api/me). */
interface PlanUsage {
  plan: { nameMn: string; nameEn: string; limits: { maxProfiles?: number | null } };
  usage: { profiles: number };
}

/** Relationships a new member can have (labels: shared.relationship.<value>). */
const MEMBER_RELATIONSHIPS = ["spouse", "child", "parent", "other"] as const;

const EMPTY_MEMBER = {
  lastName: "", name: "", birthDate: "", sex: "MALE", heightCm: "", weightKg: "", relationship: "spouse",
};

const SEX_ICON: Record<"MALE" | "FEMALE", IconName> = { MALE: "male", FEMALE: "female" };

/** Dot colour per constitution type (Khii teal, Shar amber, Badgan slate). */
const DOSHA_DOT: Record<string, string> = {
  Khii: "bg-primary",
  Khii_Shar: "bg-primary",
  Khii_Badgan: "bg-primary",
  Shar_Khii: "bg-secondary",
  Shar: "bg-secondary",
  Tentsveertei: "bg-primary",
  Shar_Badgan: "bg-secondary",
  Badgan_Khii: "bg-tertiary",
  Badgan_Shar: "bg-tertiary",
  Badgan: "bg-tertiary",
};

/** Colours per status; the label is shared.status.<key>. */
const STATUS_DISPLAY: Record<string, { tone: BadgeTone; text: string }> = {
  balanced:           { tone: "success", text: "text-emerald-700" },
  khii_excess:        { tone: "primary", text: "text-primary"     },
  shar_badgan_excess: { tone: "warning", text: "text-secondary"   },
};

/** A selectable option tile: 40px, hairline, tinted when selected. */
function optionTileClass(selected: boolean) {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium ring-1 ring-inset transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    selected
      ? "bg-primary/8 text-primary ring-primary/30"
      : "bg-surface-container-lowest text-on-surface ring-outline-variant hover:bg-surface-container-low"
  );
}

export default function FamilyPage() {
  const t = useTranslations("family");
  const tShared = useTranslations("shared");
  const tDosha = useTranslations("dosha");
  const relationshipLabel = (rel: string) =>
    tShared.has(`relationship.${rel}`) ? tShared(`relationship.${rel}`) : rel;
  const router = useRouter();
  const list = useApiQuery<Profile[]>("/api/profiles");
  const profiles = Array.isArray(list.data) ? list.data : [];
  const loading = list.loading && !list.data;
  // An empty message lets ErrorState show its translated default text
  // (network failures carry the browser's English text, so they use it too).
  const loadError = list.error ? (list.error.status === 0 ? "" : list.error.message) : null;
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_MEMBER);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  // The plan's profile limit, so people learn about it before filling in the form.
  const me = useApiQuery<PlanUsage>("/api/me");
  const [limitError, setLimitError] = useState<string | null>(null);
  const profileLimit = me.data?.plan.limits.maxProfiles ?? null;
  const planName = me.data ? (locale === "mn" ? me.data.plan.nameMn : me.data.plan.nameEn) : "";
  const atProfileLimit = profileLimit !== null && (me.data?.usage.profiles ?? 0) >= profileLimit;

  // Weight is optional here: it changes over time, so every calculation asks
  // for it. When given, the next step (assessment, then calculation) opens with it filled in.
  const weightValue = parseFloat(form.weightKg);
  const weightGiven = form.weightKg.trim() !== "";
  const weightValid = !weightGiven || isValidWeight(weightValue);

  function openAdd() {
    setLimitError(null);
    setShowAdd(true);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!weightValid) return;
    setSubmitting(true);
    setLimitError(null);
    try {
      const created = await apiFetch<{ id: string }>("/api/profiles", {
        method: "POST",
        body: JSON.stringify({
          lastName: form.lastName.trim(),
          name: form.name,
          birthDate: form.birthDate,
          sex: form.sex,
          heightCm: parseFloat(form.heightCm),
          relationship: form.relationship,
        }),
      });
      toast.success(t("toast.added"));
      setShowAdd(false);
      setForm(EMPTY_MEMBER);
      me.reload();
      if (weightGiven) {
        router.push(`/calculator?profile=${created.id}&weight=${weightValue}`);
        return;
      }
      list.reload();
    } catch (err) {
      if (err instanceof ApiError && err.code === "plan_limit") {
        // Shown in the dialog with what to do next (see below).
        setLimitError(errorMessage(err));
      } else {
        toast.error(err instanceof ApiError ? err.message : t("toast.addError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/profiles/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(t("toast.deleted"));
      setDeleteTarget(null);
      me.reload();
      list.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("toast.deleteError"));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle", { count: profiles.length })}
        actions={
          <Button onClick={openAdd}>
            <Icon name="person_add" className="size-4" />
            {t("addMember")}
          </Button>
        }
      />

      {atProfileLimit && (
        <Callout tone="info" icon="group" title={t("planLimit.reachedTitle")}>
          {t("planLimit.reachedBody", { plan: planName, limit: profileLimit })}
        </Callout>
      )}

      {/* ── Profile grid ── */}
      {loadError !== null ? (
        <ErrorState message={loadError} onRetry={list.reload} />
      ) : (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => {
          const latest = p.bediRecords?.[0];
          const dosha = p.doshaType ? DOSHA_MAP[p.doshaType as DoshaKey] : null;
          const status = latest ? STATUS_DISPLAY[latest.status] : null;
          const initial = p.name[0]?.toUpperCase() ?? "?";
          const age = calcAge(p.birthDate);
          const isSelf = p.relationship === "self";

          return (
            <div key={p.id} className="flex flex-col rounded-xl bg-surface-container-lowest shadow-ambient">

              {/* Card header */}
              <div className="flex items-start gap-3 border-b border-outline-variant px-5 py-4">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    isSelf ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant"
                  )}
                  aria-hidden="true"
                >
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-on-surface">{fullName(p)}</p>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {relationshipLabel(p.relationship)}
                    <span className="mx-1.5 text-outline-variant" aria-hidden="true">·</span>
                    {t("ageValue", { age })}
                    <span className="mx-1.5 text-outline-variant" aria-hidden="true">·</span>
                    {t(p.sex === "MALE" ? "sexShort.MALE" : "sexShort.FEMALE")} {t("heightValue", { height: p.heightCm })}
                  </p>
                  {status && latest && (
                    <StatusBadge tone={status.tone} className="mt-2">
                      {tShared(`status.${latest.status}`)}
                    </StatusBadge>
                  )}
                </div>
                {!isSelf && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="-mr-2 -mt-1 text-on-surface-variant hover:bg-red-50 hover:text-red-700"
                    aria-label={t("deleteAria", { name: fullName(p) })}
                    onClick={() => setDeleteTarget(p)}
                  >
                    <Icon name="delete" className="size-4" />
                  </Button>
                )}
              </div>

              {/* Card body */}
              <div className="flex flex-1 flex-col gap-3 px-5 py-4">

                {/* Dosha */}
                {dosha ? (
                  <div className="flex items-center gap-2.5 rounded-lg bg-surface-container-low px-3 py-2.5">
                    <span className={cn("size-2 shrink-0 rounded-full", (p.doshaType && DOSHA_DOT[p.doshaType]) || "bg-primary")} aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-sm font-medium text-on-surface">{tDosha(`${dosha.key}.label`)}</span>
                    <span className="shrink-0 text-xs tabular-nums text-on-surface-variant">
                      Kt {p.ktScore?.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-lg bg-surface-container-low px-3 py-2.5">
                    <span className="size-2 shrink-0 rounded-full bg-outline-variant" aria-hidden="true" />
                    <span className="text-sm text-on-surface-variant">{t("notAssessed")}</span>
                  </div>
                )}

                {/* Latest BEDI deviation */}
                {latest && (
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-2.5">
                    <span className="text-sm text-on-surface-variant">{t("latestDeviation")}</span>
                    <span className={cn("text-base font-semibold tabular-nums", status?.text ?? "text-on-surface")}>
                      {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Actions */}
                {/* The calculator starts this member's own assessment when they have no Kt yet. */}
                <ButtonLink variant="outline" className="mt-auto w-full" href={`/calculator?profile=${p.id}`}>
                  {p.ktScore ? t("calculate") : t("assess")}
                </ButtonLink>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* ── Add member dialog ── */}
      <Dialog
        open={showAdd}
        onOpenChange={(open) => {
          setShowAdd(open);
          if (!open) setLimitError(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addDialog.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Овог first, as Mongolian names are written; it tells apart people with the same name. */}
            <div className="space-y-1.5">
              <Label htmlFor="family-member-last-name" className="text-on-surface">{t("addDialog.lastName")}</Label>
              <Input
                id="family-member-last-name"
                required
                maxLength={100}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder={t("addDialog.lastNamePlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="family-member-name" className="text-on-surface">{t("addDialog.name")}</Label>
              <Input
                id="family-member-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("addDialog.namePlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="family-member-birth-date" className="text-on-surface">{t("addDialog.birthDate")}</Label>
              <Input
                id="family-member-birth-date"
                type="date"
                required
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label id="family-member-sex-label" className="text-on-surface">{t("addDialog.sex")}</Label>
              <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="family-member-sex-label">
                {(["MALE", "FEMALE"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={form.sex === value}
                    onClick={() => setForm({ ...form, sex: value })}
                    className={optionTileClass(form.sex === value)}
                  >
                    <Icon name={SEX_ICON[value]} className="size-4" />
                    {tShared(`sex.${value}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="family-member-height" className="text-on-surface">{t("addDialog.height")}</Label>
              <Input
                id="family-member-height"
                type="number"
                required
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                placeholder="165"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="family-member-weight" className="text-on-surface">{t("addDialog.weight")}</Label>
              <Input
                id="family-member-weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={WEIGHT_MIN_KG}
                max={WEIGHT_MAX_KG}
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                placeholder="60"
                aria-invalid={!weightValid}
                aria-describedby="family-member-weight-hint"
              />
              <p id="family-member-weight-hint" className={cn("text-xs", weightValid ? "text-on-surface-variant" : "text-red-700")}>
                {weightValid
                  ? t("addDialog.weightHint")
                  : t("addDialog.weightRange", { min: WEIGHT_MIN_KG, max: WEIGHT_MAX_KG })}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="family-member-relationship" className="text-on-surface">{t("addDialog.relationship")}</Label>
              <SelectInput
                id="family-member-relationship"
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              >
                {MEMBER_RELATIONSHIPS.map((rel) => (
                  <option key={rel} value={rel}>{tShared(`relationship.${rel}`)}</option>
                ))}
              </SelectInput>
            </div>
            {limitError && (
              <Callout tone="warning" title={t("planLimit.errorTitle")}>
                <p>{limitError}</p>
                <p className="mt-1">{t("planLimit.errorHint")}</p>
              </Callout>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                {t("addDialog.cancel")}
              </Button>
              <Button type="submit" disabled={submitting || !weightValid}>
                {submitting
                  ? t("addDialog.submitting")
                  : weightGiven ? t("addDialog.submitAndAssess") : t("addDialog.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-on-surface-variant">
            {t.rich("deleteDialog.body", {
              name: deleteTarget ? fullName(deleteTarget) : "",
              strong: (chunks) => <span className="font-semibold text-on-surface">{chunks}</span>,
            })}
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("deleteDialog.cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
