"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { calcAge } from "@/lib/bediEngine";
import {
  CONDITION_OPTIONS,
  MENTAL_STATE_OPTIONS,
  POSITION_OPTIONS,
  SEASON_LABELS,
  SEX_LABELS,
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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
      toast.error("Биеийн жин болон өндөр шаардлагатай.");
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/patients/${patientId}/intakes/${initial!.id}`
        : `/api/patients/${patientId}/intakes`;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(isEdit)),
      });
      if (!res.ok) throw new Error(await res.text());

      const saved = await res.json();
      toast.success(isEdit ? "Шинэчлэгдлээ" : "Шинэ үзлэг хадгалагдлаа");
      router.refresh();

      if (!isEdit && saved?.id) {
        router.push(`/patients/${patientId}?tab=intake&intake=${saved.id}`);
      }
    } catch {
      toast.error("Хадгалах явцад алдаа гарлаа.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Үндсэн мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ReadOnlyField label="Овог" value={profile.lastName ?? "—"} />
          <ReadOnlyField label="Нэр" value={profile.name} />
          <ReadOnlyField label="Нас" value={`${age} нас`} />
          <ReadOnlyField label="Хүйс" value={SEX_LABELS[profile.sex]} />
          <ReadOnlyField
            label="Төрсөн жил"
            value={profile.birthDate.slice(0, 10)}
          />
          <ReadOnlyField
            label="Регистрийн дугаар"
            value={profile.registerNumber ?? "—"}
          />
          <ReadOnlyField label="Утас" value={profile.phone ?? "—"} />
          <ReadOnlyField label="Хаяг" value={profile.address ?? "—"} />
          <ReadOnlyField
            label="Мэргэжил, ажлын нөхцөл"
            value={profile.occupation ?? "—"}
            className="md:col-span-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Үзлэг ба хэмжилт</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Үзлэгт ирсэн өдөр">
            <Input
              type="date"
              value={form.admissionDate}
              onChange={(e) => set("admissionDate", e.target.value)}
              required
            />
          </Field>
          <Field label="Улирал">
            <select
              value={form.season}
              onChange={(e) => set("season", e.target.value as Season)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              {(["WINTER", "SPRING", "SUMMER", "AUTUMN"] as Season[]).map((s) => (
                <option key={s} value={s}>
                  {SEASON_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Биеийн жин (кг)">
            <Input
              type="number"
              step="0.1"
              value={form.weightKg}
              onChange={(e) => set("weightKg", e.target.value)}
              required
            />
          </Field>
          <Field label="Өндөр (см)">
            <Input
              type="number"
              step="0.1"
              value={form.heightCm}
              onChange={(e) => set("heightCm", e.target.value)}
              required
            />
          </Field>
          <Field label="Хэл" className="md:col-span-2">
            <Input value={form.tongue} onChange={(e) => set("tongue", e.target.value)} />
          </Field>
          <Field label="Судал (тайлбар)" className="md:col-span-2">
            <Input
              value={form.pulseSummary}
              onChange={(e) => set("pulseSummary", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Судасны үзлэг</CardTitle>
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
          <CardTitle>Эмнэл зүйн үнэлгээ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Ирэх үеийн зовиур">
            <textarea
              rows={2}
              value={form.complaintAtArrival}
              onChange={(e) => set("complaintAtArrival", e.target.value)}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
            />
          </Field>

          <RadioGroup
            label="Эмчлүүлэгчийн биеийн байдал"
            name="condition"
            value={form.condition}
            options={CONDITION_OPTIONS}
            onChange={(v) => set("condition", v as Condition)}
          />
          <RadioGroup
            label="Ухаан санаа"
            name="mentalState"
            value={form.mentalState}
            options={MENTAL_STATE_OPTIONS}
            onChange={(v) => set("mentalState", v as MentalState)}
          />
          <RadioGroup
            label="Байрлал"
            name="position"
            value={form.position}
            options={POSITION_OPTIONS}
            onChange={(v) => set("position", v as Position)}
          />

          <Field label="Зурхай">
            <Input value={form.zurkhai} onChange={(e) => set("zurkhai", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Онош ба эмчилгээний төлөвлөгөө</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Онош">
            <Input value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} />
          </Field>
          <Field label="Эмчилгээ">
            <textarea
              rows={3}
              value={form.treatmentPlan}
              onChange={(e) => set("treatmentPlan", e.target.value)}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Нэмэлт мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="1. Ковид туссан эсэх">
            <Input
              value={form.covidHistory}
              onChange={(e) => set("covidHistory", e.target.value)}
            />
          </Field>
          <Field label="2. Мэс засал хийлгэсэн эсэх">
            <Input
              value={form.surgeryHistory}
              onChange={(e) => set("surgeryHistory", e.target.value)}
            />
          </Field>
          <Field label="3. Архаг өвчин">
            <Input
              value={form.chronicDisease}
              onChange={(e) => set("chronicDisease", e.target.value)}
            />
          </Field>
          <Field label="4. Гэмтэл бэртэл">
            <Input
              value={form.traumaHistory}
              onChange={(e) => set("traumaHistory", e.target.value)}
            />
          </Field>
          <Field label="5. Даралт">
            <Input
              value={form.bloodPressure}
              onChange={(e) => set("bloodPressure", e.target.value)}
            />
          </Field>
          <Field label="Судасны цохилтын тоо">
            <Input
              value={form.heartRate}
              onChange={(e) => set("heartRate", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      {isEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Эмчилгээний төгсгөл</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Эмчилгээ дууссан өдөр">
              <Input
                type="date"
                value={form.dischargeDate}
                onChange={(e) => set("dischargeDate", e.target.value)}
              />
            </Field>
            <Field label="Гарах үеийн зовиур">
              <textarea
                rows={2}
                value={form.complaintAtDischarge}
                onChange={(e) => set("complaintAtDischarge", e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
              />
            </Field>
            <Field label="Зөвлөмж">
              <textarea
                rows={3}
                value={form.recommendations}
                onChange={(e) => set("recommendations", e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
              />
            </Field>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>Эмчлэгч эмч: <span className="font-medium text-foreground">{doctorName}</span></span>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-30 bg-surface-container-low border-t border-outline-variant/20 px-6 py-3 flex items-center justify-end gap-2 backdrop-blur">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Хадгалж байна..." : isEdit ? "Шинэчлэх" : "Шинэ үзлэг хадгалах"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="h-8 rounded-lg border border-input bg-muted/40 px-2.5 py-1 text-sm flex items-center">
        {value}
      </div>
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
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                active
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-input hover:bg-muted"
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
