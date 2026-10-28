"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, PageLoading } from "@/components/states";
import { Callout, PageHeader } from "@/components/kit/layout";
import { FilterTabs, SearchInput } from "@/components/kit/DataTable";
import { StatusBadge, type BadgeTone } from "@/components/kit/status";
import { useApiQuery, useErrorMessage } from "@/components/kit/hooks";
import { ClinicalAccessState, isClinicalAccessCode } from "@/components/clinical/ClinicalAccessState";
import { useShell } from "@/components/shell/ShellProvider";
import { apiFetch, ApiError } from "@/lib/api";
import { DOSHA_MAP, DoshaKey } from "@/lib/ktMapping";
import { calcAge } from "@/lib/bediEngine";
import { Icon } from "@/components/ui/icon";

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

const STATUS_TONE: Record<string, BadgeTone> = {
  khii_excess: "primary",
  balanced: "success",
  shar_badgan_excess: "warning",
};

/** Darker shades for readable contrast on white. */
const STATUS_TEXT: Record<string, string> = {
  khii_excess: "text-primary",
  balanced: "text-emerald-700",
  shar_badgan_excess: "text-secondary",
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
              <Icon name="person_add" className="size-4" />
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
          icon="stethoscope"
          title={t("emptyTitle")}
          body={t("emptyBody")}
          action={
            <Button variant="outline" size="lg" onClick={openAdd}>
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

          <SearchInput
            label={t("searchLabel")}
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={setSearch}
            className="sm:max-w-sm"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const latest = p.profile.bediRecords?.[0];
              const doshaKey =
                p.profile.doshaType && p.profile.doshaType in DOSHA_MAP ? (p.profile.doshaType as DoshaKey) : null;
              const tone = latest ? STATUS_TONE[latest.status] : undefined;

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
                      {tone && latest && (
                        <StatusBadge tone={tone}>{ts(`status.${latest.status}`)}</StatusBadge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {doshaKey ? (
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-2.5 text-sm">
                        <span>
                          <span className="text-on-surface-variant">{t("constitution")} </span>
                          <span className="font-medium text-on-surface">{td(`${doshaKey}.label`)}</span>
                        </span>
                        {p.profile.ktScore != null && (
                          <span className="shrink-0 text-xs tabular-nums text-on-surface-variant">
                            Kt {p.profile.ktScore.toFixed(2)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg bg-surface-container-low px-3 py-2.5 text-sm text-on-surface-variant">
                        {t("notAssessed")}
                      </div>
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
                        <Icon name="badge" className="size-3.5" />
                        {t("registeredBy", { name: p.practitioner.name })}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <ButtonLink variant="outline" className="flex-1" href={`/patients/${p.id}`}>
                        {t("openCard")}
                      </ButtonLink>
                      <ButtonLink variant="ghost" className="flex-1" href={`/calculator?profile=${p.profile.id}`}>
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
              <span className="block text-sm font-medium leading-none" aria-hidden="true">
                {t("addDialog.sex")}
              </span>
              <div>
                <FilterTabs
                  label={t("addDialog.sex")}
                  value={form.sex}
                  onChange={(sex) => setForm({ ...form, sex })}
                  options={SEX_VALUES.map((value) => ({ value, label: ts(`sex.${value}`) }))}
                />
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
            <details className="group rounded-lg border border-outline-variant p-3">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">
                {t("addDialog.moreDetails")}
                <Icon name="expand_more" className="size-5 transition-transform group-open:rotate-180" />
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
