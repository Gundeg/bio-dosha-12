"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, PageLoading } from "@/components/states";
import { Callout, PageHeader } from "@/components/kit/layout";
import { useApiQuery, useErrorMessage } from "@/components/kit/hooks";
import { ClinicalAccessState, isClinicalAccessCode } from "@/components/clinical/ClinicalAccessState";
import { useShell } from "@/components/shell/ShellProvider";
import { apiFetch, ApiError } from "@/lib/api";
import { DOSHA_MAP, DoshaKey } from "@/lib/ktMapping";
import { calcAge } from "@/lib/bediEngine";

/** GET /api/patients: the active organization's patients, newest first. */
interface Patient {
  id: string;
  addedAt: string;
  /** The practitioner who registered the patient (null once that account is removed). */
  practitioner: { id: string; name: string } | null;
  profile: {
    id: string;
    name: string;
    lastName: string | null;
    birthDate: string;
    sex: "MALE" | "FEMALE";
    heightCm: number;
    doshaType: string | null;
    ktScore: number | null;
    bediRecords: Array<{ deviation: number; status: string; date: string }>;
  };
}

const STATUS_CONFIG = {
  khii_excess: { variant: "secondary" as const },
  balanced: { variant: "default" as const },
  shar_badgan_excess: { variant: "destructive" as const },
};

/** Darker shades for readable contrast on white. */
const STATUS_TEXT: Record<string, string> = {
  khii_excess: "text-blue-700",
  balanced: "text-emerald-700",
  shar_badgan_excess: "text-red-700",
};

const SEX_VALUES = ["MALE", "FEMALE"] as const;

/** Optional details the API accepts; register number, phone and address are encrypted at rest. */
const OPTIONAL_FIELDS = ["registerNumber", "phone", "address", "occupation"] as const;

const EMPTY_FORM = {
  name: "",
  birthDate: "",
  sex: "MALE",
  heightCm: "",
  lastName: "",
  registerNumber: "",
  phone: "",
  address: "",
  occupation: "",
};

function fullName(p: Patient): string {
  return `${p.profile.lastName ?? ""} ${p.profile.name}`.trim();
}

export default function PatientsPage() {
  const { access } = useShell();
  // Another organization has another list: start fresh when the active one changes.
  return <PatientList key={access.org?.id ?? "none"} />;
}

function PatientList() {
  const t = useTranslations("patients");
  const ts = useTranslations("shared");
  const td = useTranslations("dosha");
  const errorMessage = useErrorMessage();
  const { activeMembership } = useShell();
  const orgName = activeMembership?.organizationName;

  const { data, error, reload } = useApiQuery<Patient[]>("/api/patients");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<{ code?: string; message: string } | null>(null);

  const accessCode = error?.code;
  if (isClinicalAccessCode(accessCode)) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={orgName} title={t("title")} />
        <ClinicalAccessState code={accessCode} organizationName={orgName} />
      </div>
    );
  }

  const patients = Array.isArray(data) ? data : null;

  function openAdd() {
    setAddError(null);
    setShowAdd(true);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setAddError(null);
    try {
      await apiFetch("/api/patients", {
        method: "POST",
        body: JSON.stringify({
          lastName: form.lastName.trim(),
          name: form.name,
          birthDate: form.birthDate,
          sex: form.sex,
          heightCm: parseFloat(form.heightCm),
          ...Object.fromEntries(OPTIONAL_FIELDS.map((field) => [field, form[field].trim() || null])),
        }),
      });
      toast.success(t("addDialog.success"));
      setShowAdd(false);
      setForm(EMPTY_FORM);
      reload();
    } catch (err) {
      setAddError({ code: err instanceof ApiError ? err.code : undefined, message: errorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  const query = search.trim().toLowerCase();
  const filtered = (patients ?? []).filter((p) => fullName(p).toLowerCase().includes(query));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={orgName}
        title={t("title")}
        description={patients ? t("total", { count: patients.length }) : undefined}
        actions={
          patients ? (
            <Button size="lg" className="px-3" onClick={openAdd}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_add</span>
              {t("add")}
            </Button>
          ) : undefined
        }
      />

      {!patients ? (
        error ? (
          <ErrorState message={errorMessage(error)} onRetry={reload} />
        ) : (
          <PageLoading label={t("loading")} />
        )
      ) : patients.length === 0 ? (
        <EmptyState
          icon={<span className="material-symbols-outlined text-[40px] text-primary">stethoscope</span>}
          title={t("emptyTitle")}
          body={t("emptyBody")}
          action={
            <Button size="lg" className="px-3" onClick={openAdd}>
              {t("add")}
            </Button>
          }
        />
      ) : (
        <>
          {error && (
            <Callout
              tone="danger"
              action={
                <Button variant="outline" size="lg" className="px-3" onClick={reload}>
                  {t("retry")}
                </Button>
              }
            >
              {errorMessage(error)}
            </Callout>
          )}

          <Input
            type="search"
            aria-label={t("searchLabel")}
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 max-w-sm"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const latest = p.profile.bediRecords?.[0];
              const doshaKey =
                p.profile.doshaType && p.profile.doshaType in DOSHA_MAP ? (p.profile.doshaType as DoshaKey) : null;
              const sc = latest ? STATUS_CONFIG[latest.status as keyof typeof STATUS_CONFIG] : null;

              return (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          <Link
                            href={`/patients/${p.id}`}
                            className="rounded-sm hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                          >
                            {fullName(p)}
                          </Link>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {t("ageSex", { age: calcAge(p.profile.birthDate), sex: ts(`sex.${p.profile.sex}`) })}
                        </p>
                      </div>
                      {sc && latest && (
                        <Badge variant={sc.variant} className="shrink-0 text-xs">
                          {ts(`status.${latest.status}`)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {doshaKey ? (
                      <div className="rounded-lg bg-surface-container-low p-2 text-sm">
                        <span className="text-muted-foreground">{t("constitution")} </span>
                        <span className="font-medium">{td(`${doshaKey}.label`)}</span>
                        <span className="text-muted-foreground"> Kt={p.profile.ktScore}</span>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-amber-50 p-2 text-sm text-amber-900">{t("notAssessed")}</div>
                    )}

                    {latest && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("latestDelta")}</span>
                        <span className={`font-semibold ${STATUS_TEXT[latest.status] ?? ""}`}>
                          {latest.deviation >= 0 ? "+" : ""}
                          {latest.deviation.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {p.practitioner?.name && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">badge</span>
                        {t("registeredBy", { name: p.practitioner.name })}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <ButtonLink size="lg" className="flex-1" href={`/patients/${p.id}`}>
                        {t("openCard")}
                      </ButtonLink>
                      <ButtonLink size="lg" variant="outline" className="flex-1" href={`/calculator?profile=${p.profile.id}`}>
                        {t("calculate")}
                      </ButtonLink>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <p className="col-span-full py-12 text-center text-sm text-muted-foreground" role="status">
                {t("noMatch")}
              </p>
            )}
          </div>
        </>
      )}

      <Dialog
        open={showAdd}
        onOpenChange={(open) => {
          setShowAdd(open);
          if (!open) setAddError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addDialog.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Овог first, as Mongolian names are written; it tells apart patients with the same name. */}
            <div className="space-y-1">
              <Label htmlFor="new-patient-lastName">{t("addDialog.lastName")}</Label>
              <Input
                id="new-patient-lastName"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder={t("addDialog.lastNamePlaceholder")}
                autoComplete="off"
                maxLength={100}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-patient-name">{t("addDialog.name")}</Label>
              <Input
                id="new-patient-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("addDialog.namePlaceholder")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-patient-birth-date">{t("addDialog.birthDate")}</Label>
              <Input
                id="new-patient-birth-date"
                type="date"
                required
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <span id="new-patient-sex" className="text-sm font-medium leading-none">
                {t("addDialog.sex")}
              </span>
              <div role="group" aria-labelledby="new-patient-sex" className="grid grid-cols-2 gap-2">
                {SEX_VALUES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={form.sex === value}
                    onClick={() => setForm({ ...form, sex: value })}
                    className={`min-h-10 rounded-lg border p-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                      form.sex === value ? "border-primary bg-primary/5 font-semibold" : "border-outline-variant/50"
                    }`}
                  >
                    {ts(`sex.${value}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-patient-height">{t("addDialog.height")}</Label>
              <Input
                id="new-patient-height"
                type="number"
                inputMode="decimal"
                required
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                placeholder="170"
              />
            </div>

            {/* Optional identity and contact details (stored encrypted). */}
            <details className="group rounded-lg border border-outline-variant/40 p-3">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">
                {t("addDialog.moreDetails")}
                <span className="material-symbols-outlined text-[20px] transition-transform group-open:rotate-180" aria-hidden="true">
                  expand_more
                </span>
              </summary>
              <div className="mt-3 space-y-3">
                <p className="text-xs text-on-surface-variant">{t("addDialog.moreDetailsHint")}</p>
                {OPTIONAL_FIELDS.map((field) => (
                  <div key={field} className="space-y-1">
                    <Label htmlFor={`new-patient-${field}`}>{t(`addDialog.${field}`)}</Label>
                    <Input
                      id={`new-patient-${field}`}
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      autoComplete="off"
                      inputMode={field === "phone" ? "tel" : undefined}
                      maxLength={field === "address" ? 500 : field === "occupation" ? 200 : 50}
                    />
                  </div>
                ))}
              </div>
            </details>

            {/* Callout announces itself (role="alert"). */}
            <div>
              {addError &&
                (addError.code === "plan_limit" ? (
                  <Callout tone="warning" title={t("planLimit.title")}>
                    <p>{addError.message}</p>
                    <p className="mt-1">
                      {t.rich("planLimit.hint", {
                        link: (chunks) => (
                          <Link href="/org" className="font-semibold underline underline-offset-2">
                            {chunks}
                          </Link>
                        ),
                      })}
                    </p>
                  </Callout>
                ) : (
                  <Callout tone="danger">{addError.message}</Callout>
                ))}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setShowAdd(false)}>
                {t("addDialog.cancel")}
              </Button>
              <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
                {submitting ? t("addDialog.submitting") : t("addDialog.submit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
