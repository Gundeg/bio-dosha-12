"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/formatDate";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, PageLoading } from "@/components/states";
import { FilterTabs } from "@/components/kit/DataTable";
import { Callout, PageHeader } from "@/components/kit/layout";
import { StatusBadge, type BadgeTone } from "@/components/kit/status";
import { useApiQuery, useErrorMessage } from "@/components/kit/hooks";
import { ClinicalAccessState, isClinicalAccessCode } from "@/components/clinical/ClinicalAccessState";
import { EmergencyNote } from "@/components/shell/EmergencyNote";
import { useShell } from "@/components/shell/ShellProvider";
import { DOSHA_MAP, DoshaKey } from "@/lib/ktMapping";
import { calcAge, BEDIStatus } from "@/lib/bediEngine";
import { getRemedies } from "@/lib/remedyEngine";
import { translateRemedy } from "@/lib/remedyTranslations";
import { Icon } from "@/components/ui/icon";

interface StoredRecommendation {
  remedies: string[];
  avoidFoods: string[];
  riskFactors: string[];
  ageNote: string | null;
  lifestyle: string[];
  validationStatus: string | null;
  validationAction: string | null;
}

interface BediRecord {
  id: string;
  date: string;
  bedi: number;
  deviation: number;
  status: string;
  weightKg: number;
  season: string;
  recommendation?: StoredRecommendation | null;
}

interface PatientProfile {
  id: string;
  name: string;
  lastName?: string | null;
  birthDate: string;
  sex: "MALE" | "FEMALE";
  heightCm: number;
  doshaType: string | null;
  ktScore: number | null;
  bediRecords: BediRecord[];
}

interface Patient {
  id: string;
  profile: PatientProfile;
}

/** Darker shades so the printed report keeps readable contrast. */
const STATUS_TEXT: Record<string, string> = {
  khii_excess: "text-primary",
  balanced: "text-emerald-700",
  shar_badgan_excess: "text-secondary",
};

const STATUS_TONE: Record<string, BadgeTone> = {
  khii_excess: "primary",
  balanced: "success",
  shar_badgan_excess: "warning",
};

function displayName(profile: Pick<PatientProfile, "name" | "lastName">): string {
  return `${profile.lastName ?? ""} ${profile.name}`.trim();
}

function ReportContent() {
  const t = useTranslations("reports");
  const ts = useTranslations("shared");
  const td = useTranslations("dosha");
  const tLegal = useTranslations("legal");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const tr = (text: string) => translateRemedy(text, locale);
  const searchParams = useSearchParams();
  const { activeMembership } = useShell();
  const orgName = activeMembership?.organizationName;

  const list = useApiQuery<Patient[]>("/api/patients");
  const patients = Array.isArray(list.data) ? list.data : null;
  // ?patient=<profile id> preselects a patient; otherwise the newest one.
  const [picked, setPicked] = useState<string | null>(() => searchParams.get("patient"));
  const selectedId = picked ?? patients?.[0]?.profile.id ?? null;

  // The patient list carries only the latest record, so load the full history
  // (with each record's stored recommendation) for the selected patient.
  const detail = useApiQuery<PatientProfile>(selectedId ? `/api/profiles/${selectedId}` : null);

  const accessCode = list.error?.code ?? detail.error?.code;
  if (isClinicalAccessCode(accessCode)) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={orgName} title={t("title")} />
        <ClinicalAccessState code={accessCode} organizationName={orgName} />
      </div>
    );
  }

  const patient = patients?.find((p) => p.profile.id === selectedId);
  // Until the full history arrives, the list entry (latest record only) fills the screen.
  const fullyLoaded = !!selectedId && detail.data?.id === selectedId;
  const profile = fullyLoaded ? detail.data : patient?.profile;
  const age = profile ? calcAge(profile.birthDate) : 0;
  const latest = profile?.bediRecords?.[0];
  const doshaKey =
    profile?.doshaType && profile.doshaType in DOSHA_MAP ? (profile.doshaType as DoshaKey) : null;
  // Print exactly what was recommended and checked when the record was saved.
  // Older records without a stored recommendation are recomputed with the
  // full context so the safety check still runs.
  const remedies: StoredRecommendation | null = latest
    ? latest.recommendation ?? (() => {
        const r = getRemedies(
          latest.status as BEDIStatus,
          age,
          (profile?.doshaType as DoshaKey | null) ?? undefined,
          latest.deviation
        );
        return {
          remedies: r.remedies,
          avoidFoods: r.avoidFoods,
          riskFactors: r.riskFactors,
          ageNote: r.ageNote,
          lifestyle: r.lifestyle,
          validationStatus: r.validation?.status ?? null,
          validationAction: r.validation?.action ?? null,
        };
      })()
    : null;
  const reportDate = formatDate(new Date(), locale, "long");

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        className="print:hidden"
        eyebrow={orgName}
        title={t("title")}
        description={t("subtitle")}
        actions={
          // Print only the complete report (history and stored recommendation included).
          <Button size="lg" className="px-3" onClick={handlePrint} disabled={!fullyLoaded}>
            <Icon name="print" className="size-4" />
            {t("print")}
          </Button>
        }
      />

      {!patients ? (
        list.error ? (
          <ErrorState message={errorMessage(list.error)} onRetry={list.reload} />
        ) : (
          <PageLoading label={t("loading")} />
        )
      ) : patients.length === 0 ? (
        <EmptyState
          icon="summarize"
          title={t("emptyTitle")}
          body={t("emptyBody")}
          action={
            <ButtonLink href="/patients" variant="outline" size="lg">
              {t("toPatients")}
            </ButtonLink>
          }
        />
      ) : (
        <>
          <div className="print:hidden">
            <FilterTabs
              label={t("patientPicker")}
              value={selectedId ?? ""}
              onChange={setPicked}
              options={patients.map((p) => ({ value: p.profile.id, label: displayName(p.profile) }))}
            />
          </div>

          {detail.error ? (
            <ErrorState message={errorMessage(detail.error)} onRetry={detail.reload} />
          ) : !profile ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">{t("selectPatient")}</CardContent>
            </Card>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4 print:max-w-none">
              {/* Report header */}
              <div className="border-b-2 border-on-surface pb-4 text-center">
                {orgName && <p className="text-sm font-semibold text-on-surface">{orgName}</p>}
                <h2 className="text-xl font-semibold text-on-surface">{t("reportTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("reportSubtitle")}</p>
                <p className="mt-1 text-sm">{reportDate}</p>
              </div>

              {/* Patient info */}
              <Card>
                <CardHeader><CardTitle>{t("patientInfo")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 text-sm min-[400px]:grid-cols-2">
                    <div><span className="text-muted-foreground">{t("name")} </span><span className="font-semibold">{displayName(profile)}</span></div>
                    <div><span className="text-muted-foreground">{t("age")} </span><span>{age}</span></div>
                    <div><span className="text-muted-foreground">{t("sex")} </span><span>{ts(`sex.${profile.sex}`)}</span></div>
                    <div><span className="text-muted-foreground">{t("height")} </span><span>{t("heightValue", { value: profile.heightCm })}</span></div>
                    <div><span className="text-muted-foreground">{t("constitution")} </span><span className="font-semibold">{doshaKey ? td(`${doshaKey}.label`) : "—"}</span></div>
                    <div><span className="text-muted-foreground">{t("ktCoefficient")} </span><span>{profile.ktScore ?? "—"}</span></div>
                  </div>
                </CardContent>
              </Card>

              {/* Latest BEDI */}
              {latest && (
                <Card>
                  <CardHeader><CardTitle>{t("latestBedi")}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
                      <div className="rounded-lg border border-outline-variant p-4">
                        <p className="text-xs font-medium text-muted-foreground">{t("bediIndex")}</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">{latest.bedi.toFixed(2)}</p>
                      </div>
                      <div className="rounded-lg border border-outline-variant p-4">
                        <p className="text-xs font-medium text-muted-foreground">{t("deviation")}</p>
                        <p className={`mt-1 text-2xl font-semibold tabular-nums ${STATUS_TEXT[latest.status] ?? ""}`}>
                          {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-outline-variant p-4">
                        <p className="text-xs font-medium text-muted-foreground">{t("status")}</p>
                        <StatusBadge tone={STATUS_TONE[latest.status] ?? "neutral"} className="mt-2">
                          {ts(`status.${latest.status}`)}
                        </StatusBadge>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{t("date", { date: formatDate(latest.date, locale) })}</span>
                      <span>{t("weight", { value: latest.weightKg })}</span>
                      <span>{t("season", { season: ts(`season.${latest.season}`) })}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dosha details */}
              {doshaKey && (
                <Card>
                  <CardHeader><CardTitle>{t("constitutionTraits")}</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">{td(`${doshaKey}.description`)}</p>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{t("qualities")}</p>
                      <p className="text-sm">{(td.raw(`${doshaKey}.qualities`) as string[]).join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{t("riskFactors")}</p>
                      <p className="text-sm">{(td.raw(`${doshaKey}.risks`) as string[]).join(", ")}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Remedies */}
              {remedies && (
                <Card>
                  <CardHeader><CardTitle>{t("recommendations")}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {remedies.validationStatus && remedies.validationStatus !== "OK" && (
                      remedies.validationStatus === "CONTRAINDICATED" ? (
                        <Callout tone="danger" icon="block" title={t("contraindicated")}>
                          {remedies.validationAction && tr(remedies.validationAction)}
                        </Callout>
                      ) : (
                        <Callout tone="warning" title={t("caution")}>
                          {remedies.validationAction && tr(remedies.validationAction)}
                        </Callout>
                      )
                    )}
                    <div>
                      <p className="mb-1 text-sm font-semibold text-emerald-700">{t("remedies")}</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {remedies.remedies.map((r, i) => <li key={i}>{tr(r)}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-red-700">{t("avoidFoods")}</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {remedies.avoidFoods.map((f, i) => <li key={i}>{tr(f)}</li>)}
                      </ul>
                    </div>
                    {remedies.lifestyle.length > 0 && (
                      <div>
                        <p className="mb-1 text-sm font-semibold text-on-surface">{t("lifestyle")}</p>
                        <ul className="list-disc space-y-1 pl-5 text-sm">
                          {remedies.lifestyle.map((l, i) => <li key={i}>{tr(l)}</li>)}
                        </ul>
                      </div>
                    )}
                    {remedies.riskFactors.length > 0 && (
                      <div>
                        <p className="mb-1 text-sm font-semibold text-on-surface">{t("riskFactors")}</p>
                        <p className="text-sm">{remedies.riskFactors.map(tr).join(", ")}</p>
                      </div>
                    )}
                    {remedies.ageNote && (
                      <div className="border-t border-outline-variant pt-3">
                        <p className="text-xs italic text-muted-foreground">{tr(remedies.ageNote)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* BEDI history table */}
              {profile.bediRecords.length > 1 && (
                <Card>
                  <CardHeader><CardTitle>{t("trend")}</CardTitle></CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-outline-variant text-xs font-medium text-muted-foreground">
                          <th scope="col" className="py-2 text-left">{t("table.date")}</th>
                          <th scope="col" className="py-2 text-right">{t("table.bedi")}</th>
                          <th scope="col" className="py-2 text-right">{t("table.delta")}</th>
                          <th scope="col" className="py-2 text-right">{t("table.status")}</th>
                          <th scope="col" className="py-2 text-right">{t("table.weight")}</th>
                          <th scope="col" className="py-2 text-right">{t("table.season")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.bediRecords.slice(0, 10).map((r) => (
                          <tr key={r.id} className="border-b border-outline-variant/30 last:border-0">
                            <td className="py-2">{formatDate(r.date, locale)}</td>
                            <td className="text-right">{r.bedi.toFixed(2)}</td>
                            <td className={`text-right font-medium ${STATUS_TEXT[r.status] ?? ""}`}>
                              {r.deviation >= 0 ? "+" : ""}{r.deviation.toFixed(2)}
                            </td>
                            <td className={`text-right text-xs ${STATUS_TEXT[r.status] ?? ""}`}>{ts(`status.${r.status}`)}</td>
                            <td className="text-right">{t("weightValue", { value: r.weightKg })}</td>
                            <td className="text-right">{ts(`season.${r.season}`)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}

              {/* Signature, disclaimer and emergency note (printed with the report) */}
              <div className="mt-8 border-t border-outline-variant/60 pt-6">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("signature")}</p>
                    <div className="mb-1 mt-8 border-b border-on-surface-variant" />
                    <p className="text-xs text-muted-foreground">{t("nameStamp")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("signatureDate")}</p>
                    <div className="mb-1 mt-8 border-b border-on-surface-variant" />
                    <p className="text-xs text-muted-foreground">{reportDate}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-2 rounded-lg border border-amber-600/25 bg-amber-50 p-3 text-amber-950 print:bg-transparent">
                  <p className="text-xs leading-relaxed">{tLegal("disclaimer")}</p>
                  <EmergencyNote />
                </div>
                <p className="mt-4 text-center text-xs text-muted-foreground">{t("footer")}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const t = useTranslations("reports");
  const { access } = useShell();
  return (
    <Suspense fallback={<PageLoading label={t("loading")} />}>
      {/* Another organization has other patients: start fresh when the active one changes. */}
      <ReportContent key={access.org?.id ?? "none"} />
    </Suspense>
  );
}
