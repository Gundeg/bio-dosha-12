"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api";
import { ErrorState, PageLoading } from "@/components/states";
import { Callout } from "@/components/kit/layout";
import { useApiQuery, useErrorMessage } from "@/components/kit/hooks";
import { DOSHA_MAP, DoshaKey } from "@/lib/ktMapping";
import { calcAge } from "@/lib/bediEngine";
import { toast } from "sonner";

interface Profile {
  id: string;
  name: string;
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

const DOSHA_DOT: Record<string, string> = {
  Khii: "bg-primary",
  Khii_Shar: "bg-primary",
  Khii_Badgan: "bg-primary",
  Shar_Khii: "bg-secondary-container",
  Shar: "bg-secondary-container",
  Tentsveertei: "bg-primary",
  Shar_Badgan: "bg-secondary-container",
  Badgan_Khii: "bg-tertiary-container",
  Badgan_Shar: "bg-tertiary-container",
  Badgan: "bg-tertiary-container",
};

// Avatar colour (and a readable initial colour) based on relationship
const AVATAR_GRADIENT: Record<string, string> = {
  self:   "from-primary to-primary-container text-on-primary",
  spouse: "from-secondary to-secondary-container text-on-primary",
  child:  "from-tertiary to-tertiary-container text-on-primary",
  parent: "from-primary-container to-tertiary text-on-primary",
  other:  "from-surface-container-high to-surface-container-highest text-on-surface",
};

/** Colours per status; the label is shared.status.<key>. */
const STATUS_DISPLAY: Record<string, { bg: string; text: string }> = {
  balanced:           { bg: "bg-emerald-500/10", text: "text-emerald-800" },
  khii_excess:        { bg: "bg-primary/10",     text: "text-primary"     },
  shar_badgan_excess: { bg: "bg-secondary/10",   text: "text-secondary"   },
};

export default function FamilyPage() {
  const t = useTranslations("family");
  const tShared = useTranslations("shared");
  const tDosha = useTranslations("dosha");
  const relationshipLabel = (rel: string) =>
    tShared.has(`relationship.${rel}`) ? tShared(`relationship.${rel}`) : rel;
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "spouse",
  });
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

  const loadProfiles = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await apiFetch<Profile[]>("/api/profiles");
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      // An empty message lets ErrorState show its translated default text.
      setLoadError(err instanceof ApiError ? err.message : "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  function openAdd() {
    setLimitError(null);
    setShowAdd(true);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setLimitError(null);
    try {
      await apiFetch("/api/profiles", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          birthDate: form.birthDate,
          sex: form.sex,
          heightCm: parseFloat(form.heightCm),
          relationship: form.relationship,
        }),
      });
      toast.success(t("toast.added"));
      setShowAdd(false);
      setForm({ name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "spouse" });
      me.reload();
      await loadProfiles();
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
      await loadProfiles();
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

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            {t("eyebrow")}
          </p>
          <h1 className="font-headline text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            {t("title")}
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            {t("subtitle", { count: profiles.length })}
          </p>
        </div>
        <Button onClick={openAdd} className="shrink-0">
          <span className="material-symbols-outlined text-[18px] mr-1.5" aria-hidden="true">person_add</span>
          {t("addMember")}
        </Button>
      </div>

      {atProfileLimit && (
        <Callout tone="info" icon="group" title={t("planLimit.reachedTitle")}>
          {t("planLimit.reachedBody", { plan: planName, limit: profileLimit })}
        </Callout>
      )}

      {/* ── Profile grid ── */}
      {loadError !== null ? (
        <ErrorState message={loadError} onRetry={loadProfiles} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const latest = p.bediRecords?.[0];
          const dosha = p.doshaType ? DOSHA_MAP[p.doshaType as DoshaKey] : null;
          const status = latest ? STATUS_DISPLAY[latest.status] : null;
          const avatarGrad = AVATAR_GRADIENT[p.relationship] ?? AVATAR_GRADIENT.other;
          const initial = p.name[0]?.toUpperCase() ?? "?";
          const age = calcAge(p.birthDate);

          return (
            <div key={p.id} className="bg-surface-container-lowest rounded-3xl shadow-ambient overflow-hidden group hover:shadow-xl transition-shadow duration-200">

              {/* Card header */}
              <div className="bg-surface-container-low px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl bg-linear-to-br ${avatarGrad} flex items-center justify-center text-base font-bold shrink-0`} aria-hidden="true">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-headline font-bold text-on-surface text-base truncate">{p.name}</p>
                      {p.relationship === "self" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded-full shrink-0">{t("selfBadge")}</span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {relationshipLabel(p.relationship)}
                      <span className="mx-1.5 text-outline-variant" aria-hidden="true">·</span>
                      {t("ageValue", { age })}
                      <span className="mx-1.5 text-outline-variant" aria-hidden="true">·</span>
                      {t(p.sex === "MALE" ? "sexShort.MALE" : "sexShort.FEMALE")} {t("heightValue", { height: p.heightCm })}
                    </p>
                  </div>
                  {status && latest && (
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
                      {tShared(`status.${latest.status}`)}
                    </span>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="px-5 py-4 space-y-3">

                {/* Dosha */}
                {dosha ? (
                  <div className="flex items-center gap-2.5 bg-surface-container-low rounded-xl px-3 py-2.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${p.doshaType ? (DOSHA_DOT[p.doshaType] ?? "bg-primary") : "bg-primary"}`} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-on-surface">{tDosha(`${dosha.key}.label`)}</span>
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                      Kt {p.ktScore?.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 bg-surface-container-high rounded-xl px-3 py-2.5">
                    <span className="w-2 h-2 rounded-full bg-outline-variant shrink-0" aria-hidden="true" />
                    <span className="text-xs text-on-surface-variant">{t("notAssessed")}</span>
                  </div>
                )}

                {/* Latest BEDI deviation */}
                {latest && (
                  <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 py-2.5">
                    <span className="text-xs text-on-surface-variant">{t("latestDeviation")}</span>
                    <span className={`font-headline text-base font-bold ${status?.text ?? "text-on-surface"}`}>
                      {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {/* The calculator starts this member's own assessment when they have no Kt yet. */}
                  <ButtonLink size="sm" variant="outline" className="flex-1" href={`/calculator?profile=${p.id}`}>
                    {p.ktScore ? t("calculate") : t("assess")}
                  </ButtonLink>
                  {p.relationship !== "self" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-error hover:text-error hover:bg-error/5"
                      aria-label={t("deleteAria", { name: p.name })}
                      onClick={() => setDeleteTarget(p)}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add card shortcut */}
        <button
          type="button"
          onClick={openAdd}
          className="border-2 border-dashed border-outline-variant/40 rounded-3xl flex flex-col items-center justify-center py-14 gap-3 text-on-surface-variant hover:border-primary/40 hover:text-primary hover:bg-primary/3 transition-all duration-200 group"
        >
          <span className="material-symbols-outlined text-[32px] transition-transform motion-safe:group-hover:scale-110" aria-hidden="true">add_circle</span>
          <p className="text-sm font-semibold">{t("addMember")}</p>
        </button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">{t("addDialog.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="family-member-name" className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{t("addDialog.name")}</Label>
              <Input
                id="family-member-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("addDialog.namePlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="family-member-birth-date" className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{t("addDialog.birthDate")}</Label>
              <Input
                id="family-member-birth-date"
                type="date"
                required
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label id="family-member-sex-label" className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{t("addDialog.sex")}</Label>
              <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="family-member-sex-label">
                {(["MALE", "FEMALE"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={form.sex === value}
                    onClick={() => setForm({ ...form, sex: value })}
                    className={`rounded-xl p-2.5 text-sm font-medium transition-all ${
                      form.sex === value
                        ? "bg-primary/10 text-primary border-2 border-primary/20"
                        : "bg-surface-container-high text-on-surface-variant border-2 border-transparent"
                    }`}
                  >
                    {tShared(`sex.${value}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="family-member-height" className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{t("addDialog.height")}</Label>
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
              <Label htmlFor="family-member-relationship" className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{t("addDialog.relationship")}</Label>
              <select
                id="family-member-relationship"
                className="w-full bg-surface-container-low rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none border border-outline-variant/20"
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              >
                {MEMBER_RELATIONSHIPS.map((rel) => (
                  <option key={rel} value={rel}>{tShared(`relationship.${rel}`)}</option>
                ))}
              </select>
            </div>
            {limitError && (
              <Callout tone="warning" title={t("planLimit.errorTitle")}>
                <p>{limitError}</p>
                <p className="mt-1">{t("planLimit.errorHint")}</p>
              </Callout>
            )}
            <div className="flex gap-2 pt-2">
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

      {/* ── Delete confirm dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">{t("deleteDialog.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-on-surface-variant pt-2">
            {t.rich("deleteDialog.body", {
              name: deleteTarget?.name ?? "",
              strong: (chunks) => <span className="font-semibold text-on-surface">{chunks}</span>,
            })}
          </p>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
              {t("deleteDialog.cancel")}
            </Button>
            <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
