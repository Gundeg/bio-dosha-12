"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/states";
import { apiFetch, ApiError } from "@/lib/api";
import { DOSHA_MAP, DoshaKey } from "@/lib/ktMapping";
import { calcAge } from "@/lib/bediEngine";
import { toast } from "sonner";

interface Patient {
  id: string;
  addedAt: string;
  clinicalNotes: string | null;
  profile: {
    id: string;
    name: string;
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

export default function PatientsPage() {
  const t = useTranslations("patients");
  const ts = useTranslations("shared");
  const td = useTranslations("dosha");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "patient",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadPatients = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await apiFetch<Patient[]>("/api/patients");
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : t("loadError")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/patients", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          birthDate: form.birthDate,
          sex: form.sex,
          heightCm: parseFloat(form.heightCm),
          relationship: form.relationship,
        }),
      });
      toast.success(t("addDialog.success"));
      setShowAdd(false);
      setForm({ name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "patient" });
      await loadPatients();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("addDialog.error"));
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = patients.filter((p) =>
    p.profile.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("total", { count: patients.length })}</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <span aria-hidden="true">+</span> {t("add")}
        </Button>
      </div>

      <Input
        type="search"
        aria-label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loadError ? (
        <ErrorState message={loadError} onRetry={loadPatients} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const latest = p.profile.bediRecords?.[0];
          const doshaKey =
            p.profile.doshaType && p.profile.doshaType in DOSHA_MAP
              ? (p.profile.doshaType as DoshaKey)
              : null;
          const sc = latest ? STATUS_CONFIG[latest.status as keyof typeof STATUS_CONFIG] : null;

          return (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{p.profile.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {t("ageSex", {
                        age: calcAge(p.profile.birthDate),
                        sex: ts(`sex.${p.profile.sex}`),
                      })}
                    </p>
                  </div>
                  {sc && latest && (
                    <Badge variant={sc.variant} className="text-xs">{ts(`status.${latest.status}`)}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {doshaKey ? (
                  <div className="bg-slate-50 rounded-lg p-2 text-sm">
                    <span className="text-muted-foreground">{t("constitution")} </span>
                    <span className="font-medium">{td(`${doshaKey}.label`)}</span>
                    <span className="text-muted-foreground"> Kt={p.profile.ktScore}</span>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-2 text-sm text-yellow-800">
                    {t("notAssessed")}
                  </div>
                )}

                {latest && (
                  <div className="text-sm flex justify-between">
                    <span className="text-muted-foreground">{t("latestDelta")}</span>
                    <span className={`font-semibold ${STATUS_TEXT[latest.status] ?? ""}`}>
                      {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <ButtonLink size="sm" className="flex-1" href={`/patients/${p.id}`}>{t("openCard")}</ButtonLink>
                  <ButtonLink size="sm" variant="outline" className="flex-1" href={`/calculator?profile=${p.profile.id}`}>{t("calculate")}</ButtonLink>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {t("empty")}
          </div>
        )}
      </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("addDialog.title")}</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
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
              <span id="new-patient-sex" className="text-sm leading-none font-medium">
                {t("addDialog.sex")}
              </span>
              <div role="group" aria-labelledby="new-patient-sex" className="grid grid-cols-2 gap-2">
                {SEX_VALUES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={form.sex === value}
                    onClick={() => setForm({ ...form, sex: value })}
                    className={`border rounded-lg p-2 text-sm transition-colors ${
                      form.sex === value ? "border-primary bg-primary/5 font-semibold" : "border-gray-200"
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
                required
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                placeholder="170"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>
                {t("addDialog.cancel")}
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? t("addDialog.submitting") : t("addDialog.submit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
