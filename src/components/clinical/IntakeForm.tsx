"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { APP_TIME_ZONE, formatDate } from "@/lib/formatDate";
import { useErrorMessage } from "@/components/kit/hooks";
import { calcAge } from "@/lib/bediEngine";
import {
  CONDITION_OPTIONS,
  MENTAL_STATE_OPTIONS,
  POSITION_OPTIONS,
} from "@/lib/clinicalConstants";
import { emptyPulseTable, type PulseTable as PulseTableValue } from "@/lib/apiSchemas";
import { PulseTable } from "./PulseTable";

type Season = "WINTER" | "SPRING" | "SUMMER" | "AUTUMN";
type Condition = "light" | "medium" | "severe";
type MentalState = "clear" | "notClear";
type Position = "active" | "inactive";

export interface IntakeFormProfile {
  id: string;
  name: string;
  lastName: string | null;
  birthDate: string;
  sex: "MALE" | "FEMALE";
  heightCm: number;
  registerNumber: string | null;
  phone: string | null;
  address: string | null;
  occupation: string | null;
}

export interface IntakeFormInitial {
  id?: string;
  admissionDate?: string;
  dischargeDate?: string | null;
  season?: Season;
  weightKg?: number;
  heightCm?: number;
  tongue?: string | null;
  pulseSummary?: string | null;
  pulseTable?: PulseTableValue | null;
  complaintAtArrival?: string | null;
  condition?: Condition | null;
  mentalState?: MentalState | null;
  position?: Position | null;
  zurkhai?: string | null;
  diagnosis?: string | null;
  treatmentPlan?: string | null;
  covidHistory?: string | null;
  surgeryHistory?: string | null;
  chronicDisease?: string | null;
  traumaHistory?: string | null;
  bloodPressure?: string | null;
  heartRate?: string | null;
  complaintAtDischarge?: string | null;
  recommendations?: string | null;
}

interface IntakeFormProps {
  patientId: string;
  profile: IntakeFormProfile;
  initial?: IntakeFormInitial;
  defaultWeightKg?: number | null;
  doctorName: string;
}

interface FormState {
  admissionDate: string;
  dischargeDate: string;
  season: Season;
  weightKg: string;
  heightCm: string;
  tongue: string;
  pulseSummary: string;
  pulseTable: PulseTableValue;
  complaintAtArrival: string;
  condition: Condition | "";
  mentalState: MentalState | "";
  position: Position | "";
  zurkhai: string;
  diagnosis: string;
  treatmentPlan: string;
  covidHistory: string;
  surgeryHistory: string;
  chronicDisease: string;
  traumaHistory: string;
  bloodPressure: string;
  heartRate: string;
  complaintAtDischarge: string;
  recommendations: string;
}

/**
 * Today in the clinic's calendar (Ulaanbaatar). The UTC date would still be
 * yesterday between midnight and 08:00 local time.
 */
function todayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function detectSeason(): Season {
  const m = new Date().getMonth();
  if (m <= 1 || m === 11) return "WINTER";
  if (m <= 4) return "SPRING";
  if (m <= 7) return "SUMMER";
  return "AUTUMN";
}

function clonePulseTable(value: PulseTableValue | null | undefined): PulseTableValue {
  if (!value) return JSON.parse(JSON.stringify(emptyPulseTable)) as PulseTableValue;
  return {
    dolovor: { ...emptyPulseTable.dolovor, ...value.dolovor },
    dund: { ...emptyPulseTable.dund, ...value.dund },
    yadam: { ...emptyPulseTable.yadam, ...value.yadam },
  };
}

export function IntakeForm({
  patientId,
  profile,
  initial,
  defaultWeightKg,
  doctorName,
}: IntakeFormProps) {
  const t = useTranslations("clinical.intake");
  const ts = useTranslations("shared");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(() => ({
    admissionDate: initial?.admissionDate?.slice(0, 10) ?? todayIso(),
    dischargeDate: initial?.dischargeDate?.slice(0, 10) ?? "",
    season: initial?.season ?? detectSeason(),
    weightKg: initial?.weightKg?.toString() ?? defaultWeightKg?.toString() ?? "",
    heightCm: (initial?.heightCm ?? profile.heightCm).toString(),
    tongue: initial?.tongue ?? "",
    pulseSummary: initial?.pulseSummary ?? "",
    pulseTable: clonePulseTable(initial?.pulseTable),
    complaintAtArrival: initial?.complaintAtArrival ?? "",
    condition: initial?.condition ?? "",
    mentalState: initial?.mentalState ?? "",
    position: initial?.position ?? "",
    zurkhai: initial?.zurkhai ?? "",
    diagnosis: initial?.diagnosis ?? "",
    treatmentPlan: initial?.treatmentPlan ?? "",
    covidHistory: initial?.covidHistory ?? "",
    surgeryHistory: initial?.surgeryHistory ?? "",
    chronicDisease: initial?.chronicDisease ?? "",
    traumaHistory: initial?.traumaHistory ?? "",
    bloodPressure: initial?.bloodPressure ?? "",
    heartRate: initial?.heartRate ?? "",
    complaintAtDischarge: initial?.complaintAtDischarge ?? "",
    recommendations: initial?.recommendations ?? "",
  }));

  const age = useMemo(() => calcAge(profile.birthDate), [profile.birthDate]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildPayload(includeDischarge: boolean) {
    const weightKg = parseFloat(form.weightKg);
    const heightCm = parseFloat(form.heightCm);

    const base = {
      admissionDate: form.admissionDate,
      season: form.season,
      weightKg,
      heightCm,
      tongue: form.tongue || null,
      pulseSummary: form.pulseSummary || null,
      pulseTable: form.pulseTable,
      complaintAtArrival: form.complaintAtArrival || null,
      condition: form.condition || null,
      mentalState: form.mentalState || null,
      position: form.position || null,
      zurkhai: form.zurkhai || null,
      diagnosis: form.diagnosis || null,
      treatmentPlan: form.treatmentPlan || null,
      covidHistory: form.covidHistory || null,
      surgeryHistory: form.surgeryHistory || null,
      chronicDisease: form.chronicDisease || null,
      traumaHistory: form.traumaHistory || null,
      bloodPressure: form.bloodPressure || null,
      heartRate: form.heartRate || null,
    };

    if (!includeDischarge) return base;

    return {
      ...base,
      dischargeDate: form.dischargeDate || null,
      complaintAtDischarge: form.complaintAtDischarge || null,
      recommendations: form.recommendations || null,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.weightKg || !form.heightCm) {
      toast.error(t("weightHeightRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/patients/${patientId}/intakes/${initial!.id}`
        : `/api/patients/${patientId}/intakes`;
      const method = isEdit ? "PATCH" : "POST";
      const saved = await apiFetch<{ id?: string }>(url, {
        method,
        body: JSON.stringify(buildPayload(isEdit)),
      });
      toast.success(isEdit ? t("updated") : t("saved"));
      router.refresh();

      if (!isEdit && saved?.id) {
        router.push(`/patients/${patientId}?tab=intake&intake=${saved.id}`);
      }
    } catch (err) {
      // e.g. "the organization is suspended" or "check the values" instead of a bare failure.
      toast.error(t("saveError"), { description: errorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  const conditionOptions = CONDITION_OPTIONS.map((o) => ({
    value: o.value,
    label: t(`conditionOptions.${o.value}`),
  }));
  const mentalStateOptions = MENTAL_STATE_OPTIONS.map((o) => ({
    value: o.value,
    label: t(`mentalStateOptions.${o.value}`),
  }));
  const positionOptions = POSITION_OPTIONS.map((o) => ({
    value: o.value,
    label: t(`positionOptions.${o.value}`),
  }));
  const textareaClass =
    "w-full rounded-lg border border-input bg-surface-container-lowest px-3 py-2 text-base outline-none transition-colors focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 md:text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ReadOnlyField id={fid("lastName")} label={t("lastName")} value={profile.lastName ?? "—"} />
          <ReadOnlyField id={fid("name")} label={t("name")} value={profile.name} />
          <ReadOnlyField id={fid("age")} label={t("age")} value={t("ageValue", { age })} />
          <ReadOnlyField id={fid("sex")} label={t("sex")} value={ts(`sex.${profile.sex}`)} />
          <ReadOnlyField
            id={fid("birthDate")}
            label={t("birthDate")}
            value={formatDate(profile.birthDate, locale)}
          />
          <ReadOnlyField
            id={fid("registerNumber")}
            label={t("registerNumber")}
            value={profile.registerNumber ?? "—"}
          />
          <ReadOnlyField id={fid("phone")} label={t("phone")} value={profile.phone ?? "—"} />
          <ReadOnlyField id={fid("address")} label={t("address")} value={profile.address ?? "—"} />
          <ReadOnlyField
            id={fid("occupation")}
            label={t("occupation")}
            value={profile.occupation ?? "—"}
            className="md:col-span-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("examination")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label={t("admissionDate")} htmlFor={fid("admissionDate")}>
            <Input
              id={fid("admissionDate")}
              type="date"
              value={form.admissionDate}
              onChange={(e) => set("admissionDate", e.target.value)}
              required
            />
          </Field>
          <Field label={t("season")} htmlFor={fid("season")}>
            <select
              id={fid("season")}
              value={form.season}
              onChange={(e) => set("season", e.target.value as Season)}
              className="h-10 w-full rounded-lg border border-input bg-surface-container-lowest px-3 text-base outline-none transition-colors focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 md:text-sm"
            >
              {(["WINTER", "SPRING", "SUMMER", "AUTUMN"] as Season[]).map((s) => (
                <option key={s} value={s}>
                  {ts(`season.${s}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("weight")} htmlFor={fid("weightKg")}>
            <Input
              id={fid("weightKg")}
              type="number"
              step="0.1"
              value={form.weightKg}
              onChange={(e) => set("weightKg", e.target.value)}
              required
            />
          </Field>
          <Field label={t("height")} htmlFor={fid("heightCm")}>
            <Input
              id={fid("heightCm")}
              type="number"
              step="0.1"
              value={form.heightCm}
              onChange={(e) => set("heightCm", e.target.value)}
              required
            />
          </Field>
          <Field label={t("tongue")} htmlFor={fid("tongue")} className="md:col-span-2">
            <Input id={fid("tongue")} value={form.tongue} onChange={(e) => set("tongue", e.target.value)} />
          </Field>
          <Field label={t("pulseSummary")} htmlFor={fid("pulseSummary")} className="md:col-span-2">
            <Input
              id={fid("pulseSummary")}
              value={form.pulseSummary}
              onChange={(e) => set("pulseSummary", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("pulseExam")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PulseTable
            value={form.pulseTable}
            onChange={(next) => set("pulseTable", next)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("clinicalAssessment")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label={t("complaintAtArrival")} htmlFor={fid("complaintAtArrival")}>
            <textarea
              id={fid("complaintAtArrival")}
              rows={2}
              value={form.complaintAtArrival}
              onChange={(e) => set("complaintAtArrival", e.target.value)}
              className={textareaClass}
            />
          </Field>

          <RadioGroup
            label={t("condition")}
            name="condition"
            value={form.condition}
            options={conditionOptions}
            onChange={(v) => set("condition", v as Condition)}
          />
          <RadioGroup
            label={t("mentalState")}
            name="mentalState"
            value={form.mentalState}
            options={mentalStateOptions}
            onChange={(v) => set("mentalState", v as MentalState)}
          />
          <RadioGroup
            label={t("position")}
            name="position"
            value={form.position}
            options={positionOptions}
            onChange={(v) => set("position", v as Position)}
          />

          <Field label={t("zurkhai")} htmlFor={fid("zurkhai")}>
            <Input id={fid("zurkhai")} value={form.zurkhai} onChange={(e) => set("zurkhai", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("diagnosisPlan")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label={t("diagnosis")} htmlFor={fid("diagnosis")}>
            <Input id={fid("diagnosis")} value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} />
          </Field>
          <Field label={t("treatmentPlan")} htmlFor={fid("treatmentPlan")}>
            <textarea
              id={fid("treatmentPlan")}
              rows={3}
              value={form.treatmentPlan}
              onChange={(e) => set("treatmentPlan", e.target.value)}
              className={textareaClass}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("additionalInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label={t("covidHistory")} htmlFor={fid("covidHistory")}>
            <Input
              id={fid("covidHistory")}
              value={form.covidHistory}
              onChange={(e) => set("covidHistory", e.target.value)}
            />
          </Field>
          <Field label={t("surgeryHistory")} htmlFor={fid("surgeryHistory")}>
            <Input
              id={fid("surgeryHistory")}
              value={form.surgeryHistory}
              onChange={(e) => set("surgeryHistory", e.target.value)}
            />
          </Field>
          <Field label={t("chronicDisease")} htmlFor={fid("chronicDisease")}>
            <Input
              id={fid("chronicDisease")}
              value={form.chronicDisease}
              onChange={(e) => set("chronicDisease", e.target.value)}
            />
          </Field>
          <Field label={t("traumaHistory")} htmlFor={fid("traumaHistory")}>
            <Input
              id={fid("traumaHistory")}
              value={form.traumaHistory}
              onChange={(e) => set("traumaHistory", e.target.value)}
            />
          </Field>
          <Field label={t("bloodPressure")} htmlFor={fid("bloodPressure")}>
            <Input
              id={fid("bloodPressure")}
              value={form.bloodPressure}
              onChange={(e) => set("bloodPressure", e.target.value)}
            />
          </Field>
          <Field label={t("heartRate")} htmlFor={fid("heartRate")}>
            <Input
              id={fid("heartRate")}
              value={form.heartRate}
              onChange={(e) => set("heartRate", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      {isEdit && (
        <Card>
          <CardHeader>
            <CardTitle>{t("discharge")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label={t("dischargeDate")} htmlFor={fid("dischargeDate")}>
              <Input
                id={fid("dischargeDate")}
                type="date"
                value={form.dischargeDate}
                onChange={(e) => set("dischargeDate", e.target.value)}
              />
            </Field>
            <Field label={t("complaintAtDischarge")} htmlFor={fid("complaintAtDischarge")}>
              <textarea
                id={fid("complaintAtDischarge")}
                rows={2}
                value={form.complaintAtDischarge}
                onChange={(e) => set("complaintAtDischarge", e.target.value)}
                className={textareaClass}
              />
            </Field>
            <Field label={t("recommendations")} htmlFor={fid("recommendations")}>
              <textarea
                id={fid("recommendations")}
                rows={3}
                value={form.recommendations}
                onChange={(e) => set("recommendations", e.target.value)}
                className={textareaClass}
              />
            </Field>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("doctor")} <span className="font-medium text-foreground">{doctorName}</span></span>
        </CardContent>
      </Card>

      {/* Sticks to the bottom while the form scrolls; on phones it stays above the bottom menu. */}
      <div className="sticky bottom-24 md:bottom-4 z-30 flex items-center justify-end gap-2 rounded-xl bg-surface-container-lowest/95 px-4 py-3 shadow-ambient backdrop-blur">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? t("saving") : isEdit ? t("update") : t("saveNew")}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ReadOnlyField({
  id,
  label,
  value,
  className,
}: {
  id: string;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Input id={id} readOnly value={value} className="bg-muted/40 text-sm" />
    </div>
  );
}

function RadioGroup({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  const labelId = useId();
  return (
    <div className="space-y-2">
      <span id={labelId} className="block text-sm leading-none font-medium">{label}</span>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`min-h-9 rounded-lg border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                active
                  ? "border-primary bg-primary/8 font-medium text-primary"
                  : "border-input bg-surface-container-lowest hover:bg-surface-container-low"
              }`}
              aria-pressed={active}
              data-name={name}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
