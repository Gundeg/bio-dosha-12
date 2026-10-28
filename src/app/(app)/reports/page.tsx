"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/formatDate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch, ApiError } from "@/lib/api";
import { ErrorState } from "@/components/states";
import { DOSHA_MAP, DoshaKey } from "@/lib/ktMapping";
import { calcAge, BEDIStatus } from "@/lib/bediEngine";
import { getRemedies } from "@/lib/remedyEngine";
import { translateRemedy } from "@/lib/remedyTranslations";

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
  khii_excess: "text-blue-700",
  balanced: "text-emerald-700",
  shar_badgan_excess: "text-red-700",
};

function ReportContent() {
  const t = useTranslations("reports");
  const ts = useTranslations("shared");
  const td = useTranslations("dosha");
  const locale = useLocale();
  const tr = (text: string) => translateRemedy(text, locale);
  const searchParams = useSearchParams();
  const patientProfileId = searchParams.get("patient");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState(patientProfileId ?? "");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetch<Patient[]>("/api/patients");
      const list = Array.isArray(data) ? data : [];
      setPatients(list);
      if (!patientProfileId && list.length > 0) setSelectedId(list[0].profile.id);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : t("loadError")
      );
    } finally {
      setLoading(false);
    }
  }, [patientProfileId, t]);

  useEffect(() => {
    load();
  }, [load]);

  // The patient list carries only the latest record, so load the full history
  // (with each record's stored recommendation) for the selected patient.
  const [detail, setDetail] = useState<PatientProfile | null>(null);
  // Bumped by "retry" so a failed history load is fetched again, not silently skipped.
  const [detailKey, setDetailKey] = useState(0);
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    apiFetch<PatientProfile>(`/api/profiles/${selectedId}`)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : t("detailLoadError"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, detailKey, t]);

  const retry = useCallback(() => {
    load();
    setDetailKey((k) => k + 1);
  }, [load]);

  const patient = patients.find((p) => p.profile.id === selectedId);
  const profile = detail?.id === selectedId ? detail : patient?.profile;
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

  if (loading) return <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        <Button onClick={handlePrint} disabled={!profile}>{t("print")}</Button>
      </div>

      {loadError ? (
        <ErrorState message={loadError} onRetry={retry} />
      ) : (
        <>
      {patients.length > 0 && (
        <div role="group" aria-label={t("patientPicker")} className="flex gap-2 flex-wrap print:hidden">
          {patients.map((p) => (
            <button
              key={p.profile.id}
              type="button"
              aria-pressed={selectedId === p.profile.id}
              onClick={() => setSelectedId(p.profile.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedId === p.profile.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {p.profile.name}
            </button>
          ))}
        </div>
      )}

      {!profile ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("selectPatient")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 max-w-3xl mx-auto print:max-w-none">
          {/* Report header */}
          <div className="border-b-2 border-slate-800 pb-4 text-center">
            <h2 className="text-2xl font-bold">{t("reportTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("reportSubtitle")}</p>
            <p className="text-sm mt-1">{reportDate}</p>
          </div>

          {/* Patient info */}
          <Card>
            <CardHeader><CardTitle>{t("patientInfo")}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">{t("name")} </span><span className="font-semibold">{profile.name}</span></div>
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
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">{t("bediIndex")}</p>
                    <p className="text-3xl font-bold">{latest.bedi.toFixed(2)}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">{t("deviation")}</p>
                    <p className={`text-3xl font-bold ${STATUS_TEXT[latest.status] ?? ""}`}>
                      {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">{t("status")}</p>
                    <Badge variant={latest.status === "balanced" ? "default" : "destructive"} className="mt-2">
                      {ts(`status.${latest.status}`)}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 text-sm text-muted-foreground flex gap-4">
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
                  <div
                    role="alert"
                    className={`rounded-lg border p-3 text-sm ${
                      remedies.validationStatus === "CONTRAINDICATED"
                        ? "border-red-300 bg-red-50 text-red-900"
                        : "border-amber-300 bg-amber-50 text-amber-900"
                    }`}
                  >
                    <p className="font-semibold">
                      <span aria-hidden="true">{remedies.validationStatus === "CONTRAINDICATED" ? "⛔" : "⚠️"}</span>{" "}
                      {remedies.validationStatus === "CONTRAINDICATED" ? t("contraindicated") : t("caution")}
                    </p>
                    {remedies.validationAction && <p>{tr(remedies.validationAction)}</p>}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-green-700 mb-1">{t("remedies")}</p>
                  <ul className="text-sm space-y-1">
                    {remedies.remedies.map((r, i) => <li key={i}><span aria-hidden="true">• </span>{tr(r)}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-1">{t("avoidFoods")}</p>
                  <ul className="text-sm space-y-1">
                    {remedies.avoidFoods.map((f, i) => <li key={i}><span aria-hidden="true">• </span>{tr(f)}</li>)}
                  </ul>
                </div>
                {remedies.lifestyle.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">{t("lifestyle")}</p>
                    <ul className="text-sm space-y-1">
                      {remedies.lifestyle.map((l, i) => <li key={i}><span aria-hidden="true">• </span>{tr(l)}</li>)}
                    </ul>
                  </div>
                )}
                {remedies.riskFactors.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">{t("riskFactors")}</p>
                    <p className="text-sm">{remedies.riskFactors.map(tr).join(", ")}</p>
                  </div>
                )}
                {remedies.ageNote && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground italic">{tr(remedies.ageNote)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* BEDI history table */}
          {profile.bediRecords.length > 1 && (
            <Card>
              <CardHeader><CardTitle>{t("trend")}</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th scope="col" className="text-left py-2">{t("table.date")}</th>
                      <th scope="col" className="text-right py-2">{t("table.bedi")}</th>
                      <th scope="col" className="text-right py-2">{t("table.delta")}</th>
                      <th scope="col" className="text-right py-2">{t("table.status")}</th>
                      <th scope="col" className="text-right py-2">{t("table.weight")}</th>
                      <th scope="col" className="text-right py-2">{t("table.season")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.bediRecords.slice(0, 10).map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
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

          {/* Signature */}
          <div className="border-t pt-6 mt-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-muted-foreground">{t("signature")}</p>
                <div className="border-b border-slate-400 mt-8 mb-1" />
                <p className="text-xs text-muted-foreground">{t("nameStamp")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("signatureDate")}</p>
                <div className="border-b border-slate-400 mt-8 mb-1" />
                <p className="text-xs text-muted-foreground">{reportDate}</p>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-6">
              {t("footer")}
            </p>
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
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted-foreground">{t("loading")}</div>}>
      <ReportContent />
    </Suspense>
  );
}
