"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiFetch, ApiError } from "@/lib/api";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import DoshaRadar from "@/components/DoshaRadar";
import DoshaCard from "@/components/DoshaCard";
import RemedyPanel from "@/components/RemedyPanel";
import { calculateBEDI, calcAge, BEDIResult } from "@/lib/bediEngine";
import { getRemedies, RemedyResult } from "@/lib/remedyEngine";
import { getCurrentSeason, SeasonKey } from "@/lib/seasonFactors";
import { DoshaKey } from "@/lib/ktMapping";
import { QUESTIONNAIRE, scoreQuestionnaire, DominantType } from "@/lib/questionnaireEngine";
import { DOSHA_BG, DOSHA_COLOR } from "@/lib/doshaUi";
import { QUESTION_HELP } from "@/lib/questionHelp";
import { QuestionHelpButton } from "@/components/help/QuestionHelpDialog";
import { HelpIllustration } from "@/components/help/illustrations";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  name: string;
  sex: "MALE" | "FEMALE";
  heightCm: number;
  ktScore: number | null;
  doshaType: string | null;
  birthDate: string;
  relationship: string;
}

type Tab = "calc" | "assessment";
type AssessmentStep = "profile-select" | "info" | "questions" | "result";

interface ProfileForm {
  name: string;
  birthDate: string;
  sex: "MALE" | "FEMALE";
  heightCm: string;
  relationship: string;
}

const SEASONS: { key: SeasonKey; icon: string }[] = [
  { key: "WINTER", icon: "❄" },
  { key: "SPRING", icon: "🌸" },
  { key: "SUMMER", icon: "☀" },
  { key: "AUTUMN", icon: "🍂" },
];

// Labels: shared.relationship.<key>. "patient" is not offered here: patient
// profiles reach the calculator through a practitioner's deep link only.
const RELATIONSHIP_OPTIONS = ["self", "spouse", "child", "parent", "other"] as const;

const SEX_OPTIONS: { value: "MALE" | "FEMALE"; icon: string }[] = [
  { value: "MALE", icon: "♂" },
  { value: "FEMALE", icon: "♀" },
];

/** Same bounds as bediCreateSchema in src/lib/apiSchemas.ts */
const WEIGHT_MIN_KG = 1;
const WEIGHT_MAX_KG = 500;

const STATUS_STYLE: Record<BEDIResult["status"], { text: string; bg: string; badge: string; dot: string }> = {
  khii_excess: {
    text: "text-primary",
    bg: "bg-primary/6 border-primary/20",
    badge: "bg-primary/15 text-primary",
    dot: "bg-primary",
  },
  balanced: {
    text: "text-emerald-700",
    bg: "bg-emerald-500/6 border-emerald-500/20",
    badge: "bg-emerald-500/15 text-emerald-800",
    dot: "bg-emerald-600",
  },
  shar_badgan_excess: {
    text: "text-secondary",
    bg: "bg-secondary/6 border-secondary/20",
    badge: "bg-secondary/15 text-secondary",
    dot: "bg-secondary",
  },
};

// One entry per questionnaire category, in order. The category name is shown
// through the questionnaire namespace of the first question that has it.
const CATEGORIES = QUESTIONNAIRE
  .filter((q, i, all) => all.findIndex((o) => o.category === q.category) === i)
  .map((q) => ({ category: q.category, firstQuestionId: q.id }));

// ─── Wizard step definitions ──────────────────────────────────────────────────

// Labels: calculator.wizard.steps.<key>
const WIZARD_STEPS = ["assessment", "measurement", "result"] as const;

// Texts: calculator.guide.constitution.<key>.{title,desc}
const CONSTITUTION_CARDS = [
  { key: "light",  bg: "bg-primary/8",   text: "text-primary",   dot: "bg-primary" },
  { key: "medium", bg: "bg-secondary/8", text: "text-secondary", dot: "bg-secondary" },
  { key: "heavy",  bg: "bg-tertiary/8",  text: "text-tertiary",  dot: "bg-tertiary" },
] as const;

// ─── Inner component ─────────────────────────────────────────────────────────

function CalculatorInner() {
  const t       = useTranslations("calculator");
  const tc      = useTranslations("common");
  const tShared = useTranslations("shared");
  const tDosha  = useTranslations("dosha");
  const tQ      = useTranslations("questionnaire");
  const tHelp   = useTranslations("questionHelp");
  const searchParams = useSearchParams();
  const requestedTab  = searchParams.get("tab");
  const requestedProfile = searchParams.get("profile");
  const newParam      = searchParams.get("new");

  // Хэрэв тодорхой ?tab=calc эсвэл ?profile=X эсвэл ?new=1 байхгүй бол
  // үргэлж 1-р алхам (Махбодын үнэлгээ) -аас эхлүүлнэ
  const goDirectlyToCalc = requestedTab === "calc" || !!requestedProfile || newParam === "1";
  const initialTab: Tab = goDirectlyToCalc ? "calc" : "assessment";

  // ── Shared state ──
  // Every profile the user can open, including ones that still need an assessment.
  const [allProfiles, setAllProfiles]         = useState<Profile[]>([]);
  // Only profiles with a Kt score can be used for a BEDI calculation.
  const profiles = useMemo(() => allProfiles.filter((p) => p.ktScore), [allProfiles]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadError, setLoadError]             = useState<string | null>(null);
  const [activeTab, setActiveTab]             = useState<Tab>(initialTab);

  // ── Calculator state ──
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [weightKg, setWeightKg]   = useState("");
  const [season, setSeason]       = useState<SeasonKey>(getCurrentSeason());
  const [notes, setNotes]         = useState("");
  const [calcResult, setCalcResult]     = useState<BEDIResult | null>(null);
  const [remedyResult, setRemedyResult] = useState<RemedyResult | null>(null);
  const [saving, setSaving]       = useState(false);
  // Prevents saving the same calculation twice.
  const [saved, setSaved]         = useState(false);

  // ── Assessment state ──
  const [assessStep, setAssessStep]         = useState<AssessmentStep>("profile-select");
  const [assessProfileId, setAssessProfileId] = useState("__new__");
  const [profileForm, setProfileForm]       = useState<ProfileForm>({
    name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "self",
  });
  const [currentQ, setCurrentQ]   = useState(0);
  const [answers, setAnswers]     = useState<Record<number, DominantType>>({});
  const [ktResult, setKtResult]   = useState<ReturnType<typeof scoreQuestionnaire> | null>(null);
  const [savingAssessment, setSavingAssessment] = useState(false);
  // Ignores a second click on an answer while the next question appears.
  const answerLock = useRef(false);
  // Receives focus whenever a new question is shown, so screen readers read it.
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  // Latest translator for load(): keeping t out of its deps means a locale
  // switch (router.refresh) does not reload profiles and reset the wizard.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // ── Load profiles ──
  const load = useCallback(async () => {
    setLoadError(null);
    setLoadingProfiles(true);
    try {
      const data = await apiFetch<Profile[]>("/api/profiles");
      let list = Array.isArray(data) ? data : [];

      // A practitioner's "Тооцоолох" link points at a patient profile, which the
      // profile list leaves out. Load it directly instead of silently falling
      // back to the practitioner's own profile.
      let deepLinked: Profile | undefined;
      if (requestedProfile) {
        deepLinked = list.find((p) => p.id === requestedProfile);
        if (!deepLinked) {
          try {
            deepLinked = await apiFetch<Profile>(`/api/profiles/${requestedProfile}`);
            list = [...list, deepLinked];
          } catch {
            toast.error(tRef.current("toast.profileNotFound"));
          }
        }
      }

      setAllProfiles(list);
      const withKt = list.filter((p) => p.ktScore);

      if (deepLinked && !deepLinked.ktScore) {
        // The linked person has no assessment yet → start it for them.
        setSelectedProfileId(deepLinked.id);
        setAssessProfileId(deepLinked.id);
        setCurrentQ(0);
        setAnswers({});
        setKtResult(null);
        setActiveTab("assessment");
        setAssessStep("questions");
      } else if (withKt.length === 0) {
        setActiveTab("assessment");
        setAssessStep(list.length > 0 ? "profile-select" : "info");
      } else {
        // With a deep link, select only that profile; never substitute another one.
        const initial = requestedProfile ? deepLinked : withKt[0];
        setSelectedProfileId(initial?.id ?? "");

        if (goDirectlyToCalc) {
          setActiveTab("calc");
        } else {
          setActiveTab("assessment");
          setAssessStep("profile-select");
        }
      }
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : tRef.current("loadError"));
    } finally {
      setLoadingProfiles(false);
    }
  }, [requestedProfile, goDirectlyToCalc]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (assessStep === "questions") questionHeadingRef.current?.focus();
  }, [assessStep, currentQ]);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const weightValue = parseFloat(weightKg);
  const weightValid =
    Number.isFinite(weightValue) && weightValue >= WEIGHT_MIN_KG && weightValue <= WEIGHT_MAX_KG;

  // ── BEDI calculate ──
  function handleCalculate() {
    if (!selectedProfile || !weightValid || !selectedProfile.ktScore) return;
    const age = calcAge(selectedProfile.birthDate);
    setSaved(false);
    const res = calculateBEDI({
      weightKg: weightValue,
      heightCm: selectedProfile.heightCm,
      age,
      sex: selectedProfile.sex,
      season,
      kt: selectedProfile.ktScore,
    });
    setCalcResult(res);
    setRemedyResult(
      getRemedies(res.status, age, (selectedProfile.doshaType as DoshaKey) ?? undefined, res.deviation)
    );
  }

  async function handleSaveBEDI() {
    if (!calcResult || !selectedProfile || saved) return;
    setSaving(true);
    try {
      await apiFetch("/api/bedi", {
        method: "POST",
        body: JSON.stringify({
          profileId: selectedProfile.id,
          weightKg: weightValue,
          season,
          notes,
        }),
      });
      toast.success(t("toast.bediSaved"));
      setSaved(true);
      setNotes("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("toast.saveError"));
    } finally {
      setSaving(false);
    }
  }

  // ── Assessment: answer a question ──
  function handleAnswer(value: DominantType) {
    if (answerLock.current) return;
    answerLock.current = true;
    window.setTimeout(() => {
      answerLock.current = false;
    }, 300);
    const updated = { ...answers, [QUESTIONNAIRE[currentQ].id]: value };
    setAnswers(updated);
    if (currentQ < QUESTIONNAIRE.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setKtResult(scoreQuestionnaire(updated));
      setAssessStep("result");
    }
  }

  // ── Assessment: save ──
  async function handleSaveAssessment() {
    if (!ktResult) return;
    setSavingAssessment(true);
    try {
      let savedProfile: Profile;

      if (assessProfileId === "__new__") {
        savedProfile = await apiFetch<Profile>("/api/profiles", {
          method: "POST",
          body: JSON.stringify({
            name: profileForm.name,
            birthDate: profileForm.birthDate,
            sex: profileForm.sex,
            heightCm: parseFloat(profileForm.heightCm),
            doshaType: ktResult.doshaKey,
            ktScore: ktResult.kt,
            relationship: profileForm.relationship,
          }),
        });
        setAllProfiles((prev) => [...prev, savedProfile]);
        toast.success(t("toast.profileCreated", { name: savedProfile.name }));
      } else {
        const updated = await apiFetch<Profile>(`/api/profiles/${assessProfileId}`, {
          method: "PATCH",
          body: JSON.stringify({ doshaType: ktResult.doshaKey, ktScore: ktResult.kt }),
        });
        savedProfile = updated;
        setAllProfiles((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        toast.success(t("toast.assessmentUpdated"));
      }

      setSelectedProfileId(savedProfile.id);
      setCalcResult(null);
      setRemedyResult(null);
      setWeightKg("");
      setActiveTab("calc");
      setAssessStep("profile-select");
      setCurrentQ(0);
      setAnswers({});
      setKtResult(null);
      setProfileForm({ name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "self" });
      setAssessProfileId("__new__");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("toast.saveError"));
    } finally {
      setSavingAssessment(false);
    }
  }

  function startAssessment(profileId: string) {
    setAssessProfileId(profileId);
    setCurrentQ(0);
    setAnswers({});
    setKtResult(null);
    setAssessStep(profileId === "__new__" ? "info" : "questions");
  }

  function resetAssessment() {
    setAssessStep("profile-select");
    setCurrentQ(0);
    setAnswers({});
    setKtResult(null);
  }

  if (loadingProfiles) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3" role="status">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent motion-safe:animate-spin" aria-hidden="true" />
          <p className="text-sm text-on-surface-variant">{tc("loading")}</p>
        </div>
      </div>
    );
  }

  const relationshipLabel = (relationship: string) =>
    tShared.has(`relationship.${relationship}`) ? tShared(`relationship.${relationship}`) : relationship;
  const doshaLabel = (doshaKey: string) =>
    tDosha.has(`${doshaKey}.label`) ? tDosha(`${doshaKey}.label`) : doshaKey.replace(/_/g, "-");

  // ── Derived values ──
  const q = QUESTIONNAIRE[currentQ];
  const progress = assessStep === "questions"
    ? Math.round(((currentQ + 1) / QUESTIONNAIRE.length) * 100)
    : assessStep === "result" ? 100 : 0;

  // Шидтэн алхамын индекс: 0=үнэлгээ, 1=хэмжилт оруулах, 2=үр дүн
  const activeWizardStep = activeTab === "assessment" ? 0 : calcResult ? 2 : 1;

  // Хуудасны гарчиг
  const stepMetaKey =
    activeTab === "calc" && calcResult ? "bediResult"
    : activeTab === "calc" ? "measurement"
    : assessStep === "questions" ? "questions"
    : assessStep === "result" ? "assessmentResult"
    : "profile";
  const stepMeta = {
    title: t(`header.${stepMetaKey}.title`),
    subtitle: t(`header.${stepMetaKey}.subtitle`),
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex gap-6">

      {/* ── MAIN: Content area ────────────────────────────────────────── */}
      <main className="flex-1 min-w-0">

        {/* ── Горизонтал шидтэн алхамууд ── */}
        <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-0.5">
          {WIZARD_STEPS.map((step, i) => {
            const isActive = activeWizardStep === i;
            const isDone = activeWizardStep > i;
            const isClickable = i === 0 || (i === 1 && profiles.length > 0);
            const stepLabel = t(`wizard.steps.${step}`);
            return (
              <div key={step} className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!isClickable}
                  aria-label={t("wizard.stepAria", { number: i + 1, name: stepLabel })}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => {
                    if (i === 0) {
                      setCalcResult(null); setRemedyResult(null);
                      setActiveTab("assessment");
                      setAssessStep(allProfiles.length > 0 ? "profile-select" : "info");
                    } else if (i === 1 && profiles.length > 0) {
                      setActiveTab("calc"); setCalcResult(null); setRemedyResult(null);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary text-on-primary shadow-sm"
                      : isDone
                      ? "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                      : isClickable
                      ? "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                      : "bg-surface-container text-on-surface-variant/25 cursor-default"
                  }`}
                >
                  <span aria-hidden="true" className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                    isActive ? "bg-on-primary/20 text-on-primary"
                    : isDone ? "bg-primary/15 text-primary"
                    : "border border-current/30"
                  }`}>
                    {isDone ? "✓" : i + 1}
                  </span>
                  <span className="hidden sm:inline">{stepLabel}</span>
                </button>
                {i < WIZARD_STEPS.length - 1 && (
                  <div className={`h-px w-5 shrink-0 ${isDone ? "bg-primary/30" : "bg-outline-variant/20"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-headline text-3xl font-black text-on-surface tracking-tight">
            {stepMeta.title}
          </h1>
          <p className="text-on-surface-variant text-sm mt-2 max-w-lg leading-relaxed">
            {stepMeta.subtitle}
          </p>

          {activeTab === "assessment" && assessStep === "questions" && (
            <>
              <div className="flex items-center justify-between mt-4 mb-2">
                <span className="text-xs font-semibold text-on-surface-variant">
                  {t("quiz.counter", { current: currentQ + 1, total: QUESTIONNAIRE.length })}
                </span>
                <span className="text-xs font-semibold text-primary">{progress}%</span>
              </div>
              <p className="sr-only" aria-live="polite">
                {t("quiz.questionOf", { current: currentQ + 1, total: QUESTIONNAIRE.length })}
              </p>
              <div
                className="flex gap-1"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label={t("quiz.progressLabel")}
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
                      i < Math.round(progress / 10)
                        ? "bg-primary"
                        : "bg-surface-container-high"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            LOAD ERROR — алдаа хэзээ ч "хоосон" мэт харагдах ёсгүй
        ══════════════════════════════════════════════════════════════ */}
        {loadError && (
          <div className="max-w-xl">
            <ErrorState message={loadError} onRetry={load} />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ASSESSMENT CONTENT
        ══════════════════════════════════════════════════════════════ */}
        {!loadError && activeTab === "assessment" && (
          <div className="max-w-xl space-y-5">

            {/* Profile select */}
            {assessStep === "profile-select" && (
              <div className="space-y-3">
                <p className="text-sm text-on-surface-variant font-medium">{t("profileSelect.prompt")}</p>
                <div className="grid gap-3">
                  {allProfiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => startAssessment(p.id)}
                      className="flex items-center justify-between bg-surface-container-low rounded-2xl p-4 hover:bg-surface-container transition-colors text-left"
                    >
                      <div>
                        <p className="font-semibold text-on-surface">{p.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {relationshipLabel(p.relationship)}
                          {p.doshaType && ` · ${doshaLabel(p.doshaType)} · Kt ${p.ktScore?.toFixed(2)}`}
                        </p>
                      </div>
                      <span className="text-primary text-sm font-medium">
                        {p.ktScore ? t("profileSelect.retake") : t("profileSelect.start")}
                        <span aria-hidden="true"> →</span>
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => startAssessment("__new__")}
                    className="flex items-center gap-3 bg-surface-container-low rounded-2xl p-4 hover:bg-surface-container transition-colors border-2 border-dashed border-outline-variant"
                  >
                    <span aria-hidden="true" className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">+</span>
                    <div>
                      <p className="font-semibold text-on-surface">{t("profileSelect.newProfile")}</p>
                      <p className="text-xs text-on-surface-variant">{t("profileSelect.newProfileDesc")}</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Profile info form */}
            {assessStep === "info" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="assess-name" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("form.name")}</Label>
                    <Input
                      id="assess-name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder={t("form.namePlaceholder")}
                      className="bg-surface-container-low border-none h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="assess-birth-date" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("form.birthDate")}</Label>
                    <Input
                      id="assess-birth-date"
                      type="date"
                      value={profileForm.birthDate}
                      onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                      className="bg-surface-container-low border-none h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="assess-height" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("form.height")}</Label>
                    <Input
                      id="assess-height"
                      type="number"
                      value={profileForm.heightCm}
                      onChange={(e) => setProfileForm({ ...profileForm, heightCm: e.target.value })}
                      placeholder="170"
                      min="100" max="250"
                      className="bg-surface-container-low border-none h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label id="assess-sex-label" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("form.sex")}</Label>
                  <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="assess-sex-label">
                    {SEX_OPTIONS.map(({ value, icon }) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={profileForm.sex === value}
                        onClick={() => setProfileForm({ ...profileForm, sex: value })}
                        className={`rounded-full py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all motion-safe:active:scale-95 ${
                          profileForm.sex === value
                            ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                            : "bg-surface-container-high text-on-surface"
                        }`}
                      >
                        <span aria-hidden="true">{icon}</span>{tShared(`sex.${value}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assess-relationship" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("form.relationship")}</Label>
                  <select
                    id="assess-relationship"
                    className="w-full bg-surface-container-low border-none h-12 rounded-xl px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={profileForm.relationship}
                    onChange={(e) => setProfileForm({ ...profileForm, relationship: e.target.value })}
                  >
                    {RELATIONSHIP_OPTIONS.map((value) => (
                      <option key={value} value={value}>{tShared(`relationship.${value}`)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-1">
                  {allProfiles.length > 0 && (
                    <Button variant="outline" onClick={resetAssessment} className="flex-1 h-12">
                      <span aria-hidden="true">← </span>{t("actions.back")}
                    </Button>
                  )}
                  <Button
                    className="flex-1 h-12 font-bold"
                    disabled={!profileForm.name || !profileForm.birthDate || !profileForm.heightCm}
                    onClick={() => setAssessStep("questions")}
                  >
                    {t("form.startQuestions")}<span aria-hidden="true"> →</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Questions */}
            {assessStep === "questions" && (
              <div className="space-y-4">
                <div className="bg-surface-container-lowest rounded-3xl shadow-ambient overflow-hidden">
                  <div className="bg-surface-container-low px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                          {tQ(`q${q.id}.category`)}
                        </span>
                        <h2
                          ref={questionHeadingRef}
                          tabIndex={-1}
                          className="font-headline text-xl font-bold text-on-surface leading-snug mt-3 focus:outline-none"
                        >
                          {tQ(`q${q.id}.question`)}
                        </h2>
                        <QuestionHelpButton question={q} />
                      </div>
                      {currentQ > 0 && (
                        <button
                          type="button"
                          onClick={() => setCurrentQ(currentQ - 1)}
                          className="shrink-0 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <span aria-hidden="true">← </span>{t("actions.back")}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="px-6 py-5 space-y-3">
                    {q.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={answers[q.id] === opt.value}
                        onClick={() => handleAnswer(opt.value)}
                        className={`w-full text-left rounded-2xl p-4 transition-all motion-safe:hover:-translate-y-0.5 hover:shadow-ambient group ${DOSHA_BG[opt.value]} ${
                          answers[q.id] === opt.value ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div aria-hidden="true" className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm bg-surface-container-lowest ${DOSHA_COLOR[opt.value]}`}>
                            {t(`doshaLetter.${opt.value}`)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm ${DOSHA_COLOR[opt.value]}`}>{tQ(`q${q.id}.options.${opt.value}.label`)}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{tQ(`q${q.id}.options.${opt.value}.hint`)}</p>
                          </div>
                          <span aria-hidden="true" className={`shrink-0 text-base opacity-0 group-hover:opacity-100 transition-opacity ${DOSHA_COLOR[opt.value]}`}>→</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category mini-map */}
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORIES.map(({ category, firstQuestionId }) => {
                    const catQuestions = QUESTIONNAIRE.filter((cq) => cq.category === category);
                    const done = catQuestions.every((cq) => answers[cq.id]);
                    const active = category === q.category;
                    return (
                      <span
                        key={category}
                        className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-medium ${
                          done ? "bg-primary/10 text-primary"
                          : active ? "bg-surface-container-high text-on-surface font-bold"
                          : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {done && <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />}
                        {active && !done && <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" aria-hidden="true" />}
                        {tQ(`q${firstQuestionId}.category`)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assessment result */}
            {assessStep === "result" && ktResult && (
              <div className="space-y-4">
                <div className="bg-surface-container-lowest rounded-3xl shadow-ambient overflow-hidden">
                  <div className="bg-surface-container-low px-6 py-5">
                    <h2 className="font-headline font-bold text-on-surface">{t("assessmentResult.title")}</h2>
                    <p className="text-on-surface-variant text-sm mt-0.5">
                      {assessProfileId === "__new__"
                        ? t("assessmentResult.newProfileNote")
                        : t("assessmentResult.updateNote")}
                    </p>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="space-y-3">
                      {[
                        { key: "H" as DominantType, color: "bg-primary" },
                        { key: "S" as DominantType, color: "bg-secondary-container" },
                        { key: "B" as DominantType, color: "bg-tertiary-container" },
                      ].map(({ key, color }) => {
                        const score = ktResult.scores[key];
                        const pct = Math.round((score / QUESTIONNAIRE.length) * 100);
                        const label = t(`assessmentResult.elements.${key}`);
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className={`font-semibold ${DOSHA_COLOR[key]}`}>{label}</span>
                              <span className="font-bold text-on-surface">{t("assessmentResult.points", { score })}</span>
                            </div>
                            <Progress value={pct} aria-label={label} trackClassName="h-3" indicatorClassName={color} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-surface-container-low rounded-2xl p-4 text-center">
                      <p className="text-xs text-on-surface-variant mb-1">{t("assessmentResult.ktLabel")}</p>
                      <p className="font-headline text-4xl font-black text-on-surface">{ktResult.kt}</p>
                    </div>
                  </div>
                </div>

                <DoshaCard doshaKey={ktResult.doshaKey} kt={ktResult.kt} />

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => { setCurrentQ(0); setAnswers({}); setAssessStep("questions"); }}
                    className="flex-1"
                  >
                    {t("assessmentResult.retake")}
                  </Button>
                  <Button
                    onClick={handleSaveAssessment}
                    disabled={savingAssessment}
                    className="flex-1 h-11 font-semibold"
                  >
                    {savingAssessment ? (
                      t("actions.saving")
                    ) : (
                      <>
                        {t("assessmentResult.saveAndCalculate")}
                        <span aria-hidden="true"> →</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PHYSICAL METRICS INPUT
        ══════════════════════════════════════════════════════════════ */}
        {!loadError && activeTab === "calc" && !calcResult && (
          <div className="max-w-xl space-y-6">

            {profiles.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-3xl p-10 text-center shadow-ambient">
                <p className="text-4xl mb-4" aria-hidden="true">🌀</p>
                <p className="text-on-surface-variant mb-5 text-sm">{t("calc.noProfiles")}</p>
                <Button onClick={() => { setActiveTab("assessment"); setAssessStep("info"); }}>
                  {t("calc.startAssessment")}<span aria-hidden="true"> →</span>
                </Button>
              </div>
            ) : (
              <>
                {/* Profile selector pills — always shown so it is clear whose data is saved */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    {t("calc.whose")}
                  </p>
                  <div className="flex gap-2 flex-wrap" role="group" aria-label={t("calc.profileGroup")}>
                    {profiles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={selectedProfileId === p.id}
                        onClick={() => { setSelectedProfileId(p.id); setCalcResult(null); setRemedyResult(null); setSaved(false); }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedProfileId === p.id
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                        }`}
                      >
                        {p.name}
                        {p.relationship === "patient" && (
                          <span className="ml-1.5 text-[10px] font-bold opacity-80">· {tShared("relationship.patient")}</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {!selectedProfile && (
                    <p className="text-xs text-secondary" role="status">
                      {t("calc.selectProfile")}
                    </p>
                  )}
                </div>

                {/* 3-column metrics row */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Өндөр — профайлаас */}
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                      {t("calc.height")}
                    </p>
                    <div className="h-14 bg-surface-container rounded-xl flex items-center justify-center font-headline text-xl font-bold text-on-surface-variant/70">
                      {selectedProfile?.heightCm ?? "—"}
                    </div>
                  </div>

                  {/* Жин — оруулах */}
                  <div>
                    <Label
                      htmlFor="calc-weight"
                      className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2"
                    >
                      {t("calc.weight")}
                    </Label>
                    <Input
                      id="calc-weight"
                      type="number"
                      inputMode="decimal"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="70"
                      min={WEIGHT_MIN_KG}
                      max={WEIGHT_MAX_KG}
                      step="0.1"
                      aria-invalid={weightKg !== "" && !weightValid}
                      aria-describedby={weightKg !== "" && !weightValid ? "calc-weight-error" : undefined}
                      className="h-14 rounded-xl text-center font-headline text-xl font-bold bg-surface-container-low border-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                  </div>

                  {/* Нас — профайлаас */}
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                      {t("calc.age")}
                    </p>
                    <div className="h-14 bg-surface-container rounded-xl flex items-center justify-center font-headline text-xl font-bold text-on-surface-variant/70">
                      {selectedProfile ? calcAge(selectedProfile.birthDate) : "—"}
                    </div>
                  </div>
                </div>

                {/* Хүйс */}
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                    {t("calc.sex")}
                  </p>
                  {/* Read-only (comes from the profile): screen readers get the value as text. */}
                  {selectedProfile && (
                    <p className="sr-only">{tShared(`sex.${selectedProfile.sex}`)}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3" aria-hidden="true">
                    {SEX_OPTIONS.map(({ value, icon }) => (
                      <div
                        key={value}
                        className={`flex items-center justify-center gap-2 h-12 rounded-full font-semibold text-sm transition-all ${
                          selectedProfile?.sex === value
                            ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                            : "bg-surface-container-low text-on-surface-variant"
                        }`}
                      >
                        <span className="text-base">{icon}</span>
                        {tShared(`sex.${value}`)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Улирал */}
                <div>
                  <p id="calc-season-label" className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                    {t("calc.season")}
                  </p>
                  <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="calc-season-label">
                    {SEASONS.map(({ key, icon }) => (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={season === key}
                        onClick={() => setSeason(key)}
                        className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-all group ${
                          season === key
                            ? "bg-surface-container-lowest ring-2 ring-primary shadow-ambient text-primary"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-primary"
                        }`}
                      >
                        <span aria-hidden="true" className={`text-2xl leading-none transition-transform duration-200 ${season !== key ? "motion-safe:group-hover:scale-110" : ""}`}>
                          {icon}
                        </span>
                        <span className="text-xs font-bold">{tShared(`season.${key}`)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Тэмдэглэл */}
                <div>
                  <Label htmlFor="calc-notes" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("calc.notes")} <span className="normal-case font-normal text-on-surface-variant">{t("calc.optional")}</span>
                  </Label>
                  <Input
                    id="calc-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("calc.notesPlaceholder")}
                    className="mt-2 bg-surface-container-low border-none h-11 rounded-xl"
                  />
                </div>

                {weightKg !== "" && !weightValid && (
                  <p id="calc-weight-error" className="text-xs text-secondary" role="alert">
                    {t("calc.weightRange", { min: WEIGHT_MIN_KG, max: WEIGHT_MAX_KG })}
                  </p>
                )}

                {/* Calculate button */}
                <Button
                  className="w-full h-14 font-extrabold text-base shadow-2xl shadow-primary/30 motion-safe:hover:scale-[1.01] motion-safe:active:scale-95 transition-all gap-2"
                  disabled={!weightValid || !selectedProfile?.ktScore}
                  onClick={handleCalculate}
                >
                  <span className="material-symbols-outlined text-[20px] icon-filled" aria-hidden="true">analytics</span>
                  {t("calc.calculate")}
                </Button>

                {/* Assessment re-do link */}
                {selectedProfile && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab("assessment"); startAssessment(selectedProfile.id); }}
                    className="w-full text-xs text-primary hover:underline underline-offset-2 text-center"
                  >
                    {t("calc.retakeAssessment")}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ҮР ДҮН
        ══════════════════════════════════════════════════════════════ */}
        {!loadError && activeTab === "calc" && calcResult && selectedProfile && (() => {
          // Status always comes from the engine; the UI never re-derives it from numbers.
          const statusLabel = tShared(`status.${calcResult.status}`);
          const style       = STATUS_STYLE[calcResult.status];
          const statusColor = style.text;
          const statusBg    = style.bg;
          const statusBadge = style.badge;
          const statusDot   = style.dot;
          const deviationExplanation = t(`bediResult.explanation.${calcResult.status}`);

          return (
            <div className="max-w-xl space-y-4">

              {/* ── Хиро статус карт ── */}
              <div className={`relative overflow-hidden rounded-3xl px-7 py-6 border ${statusBg}`}>
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-[0.04] bg-current pointer-events-none" aria-hidden="true" />

                {/* Статус ба BEDI индекс */}
                <div className="flex items-start justify-between gap-5 flex-wrap mb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      {t("bediResult.heading")}
                    </p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-4 ${statusBadge}`}>
                      <span className={`w-2 h-2 rounded-full motion-safe:animate-pulse ${statusDot}`} aria-hidden="true" />
                      {statusLabel}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`font-headline text-5xl font-black ${statusColor}`}>{calcResult.bedi}</span>
                      <span className="text-sm text-on-surface-variant font-medium">{t("bediResult.index")}</span>
                    </div>
                  </div>

                  {/* Хазайлт (Δ) */}
                  <div className="bg-surface-container-lowest/80 rounded-2xl px-5 py-4 text-center shrink-0">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold mb-1">
                      {t("bediResult.deviation")}
                    </p>
                    <p className={`font-headline text-3xl font-black ${statusColor}`}>
                      {calcResult.deviation >= 0 ? "+" : ""}{calcResult.deviation}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1">{statusLabel}</p>
                  </div>
                </div>

                {/* Тайлбар */}
                <div className="pt-4 border-t border-current/10">
                  <p className="text-sm text-on-surface leading-relaxed">{deviationExplanation}</p>
                </div>
              </div>

              {/* ── Радар график ── */}
              {selectedProfile.doshaType && (
                <div className="bg-surface-container-lowest rounded-3xl shadow-ambient overflow-hidden">
                  <div className="bg-surface-container-low px-6 py-4 border-b border-surface-container-high flex items-center justify-between">
                    <div>
                      <h2 className="font-headline font-bold text-on-surface text-sm">{t("bediResult.chartTitle")}</h2>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        {t("bediResult.chartLegend")}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${statusBadge}`}>
                      {doshaLabel(selectedProfile.doshaType)}
                    </div>
                  </div>
                  <div className="px-6 py-5 flex justify-center">
                    <DoshaRadar
                      doshaKey={selectedProfile.doshaType as DoshaKey}
                      deviation={calcResult.deviation}
                      status={calcResult.status}
                      size={280}
                    />
                  </div>
                </div>
              )}

              {/* ── Хэмжилтийн дэлгэрэнгүй ── */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "age", value: `${calcAge(selectedProfile.birthDate)}` },
                  { key: "weight", value: weightKg },
                  { key: "height", value: `${selectedProfile.heightCm}` },
                ].map(({ key, value }) => (
                  <div key={key} className="bg-surface-container-lowest rounded-2xl shadow-ambient p-3 text-center">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold mb-1">{t(`bediResult.metrics.${key}.label`)}</p>
                    <p className="font-headline text-xl font-bold text-on-surface">{value}</p>
                    <p className="text-[10px] text-on-surface-variant">{t(`bediResult.metrics.${key}.unit`)}</p>
                  </div>
                ))}
              </div>

              {/* ── Товчнууд ── */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setCalcResult(null); setRemedyResult(null); }}
                >
                  <span className="material-symbols-outlined text-[16px] mr-1.5" aria-hidden="true">arrow_back</span>
                  {t("bediResult.recalculate")}
                </Button>
                <Button className="flex-1" onClick={handleSaveBEDI} disabled={saving || saved}>
                  <span className="material-symbols-outlined text-[16px] mr-1.5" aria-hidden="true">
                    {saved ? "check" : "save"}
                  </span>
                  {saving ? t("actions.saving") : saved ? t("bediResult.saved") : t("bediResult.save")}
                </Button>
              </div>

              {remedyResult && (
                <RemedyPanel status={calcResult.status} remedyResult={remedyResult} />
              )}
            </div>
          );
        })()}
      </main>

      {/* ── RIGHT: Dynamic helper panel ─────────────────────────────── */}
      <aside className="hidden xl:block w-64 shrink-0">
        <div className="sticky top-28">
          <div className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">

            {/* Constitution helper — calc input */}
            {activeTab === "calc" && !calcResult && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-primary" aria-hidden="true">psychology</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface text-sm">{t("guide.constitution.title")}</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                  {t("guide.constitution.intro")}
                </p>
                <div className="space-y-2.5">
                  {CONSTITUTION_CARDS.map(({ key, bg, text, dot }) => (
                    <div key={key} className={`rounded-xl p-3 ${bg}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${dot}`} />
                        <p className={`font-bold text-xs ${text}`}>{t(`guide.constitution.${key}.title`)}</p>
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">{t(`guide.constitution.${key}.desc`)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BEDI result guide */}
            {activeTab === "calc" && calcResult && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-primary" aria-hidden="true">monitoring</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface text-sm">{t("guide.bedi.title")}</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                  {t("guide.bedi.intro")}
                </p>
                <div className="space-y-2.5">
                  {([
                    { status: "khii_excess", dot: "bg-primary" },
                    { status: "balanced", dot: "bg-surface-container-high" },
                    { status: "shar_badgan_excess", dot: "bg-secondary-container" },
                  ] as { status: BEDIResult["status"]; dot: string }[]).map(({ status, dot }) => {
                    const active = calcResult.status === status;
                    return (
                      <div key={status} className={`rounded-xl p-3 transition-all ${active ? "bg-primary/8 ring-1 ring-primary/20" : "bg-surface-container-low"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${dot}`} />
                          <p className={`font-bold text-xs ${active ? "text-primary" : "text-on-surface"}`}>{tShared(`status.${status}`)}</p>
                          {active && <span className="ml-auto text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{t("guide.bedi.current")}</span>}
                        </div>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">{t(`guide.bedi.body.${status}`)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assessment: dosha intro */}
            {activeTab === "assessment" && assessStep === "profile-select" && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-tertiary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-tertiary" aria-hidden="true">auto_awesome</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface text-sm">{t("guide.intro.title")}</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                  {t("guide.intro.text")}
                </p>
                <div className="space-y-2.5">
                  {([
                    { key: "H", dot: "bg-primary", text: "text-primary" },
                    { key: "S", dot: "bg-secondary-container", text: "text-secondary" },
                    { key: "B", dot: "bg-tertiary-container", text: "text-tertiary" },
                  ] as const).map(({ key, dot, text }) => (
                    <div key={key} className="rounded-xl p-3 bg-surface-container-low">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${dot}`} />
                        <p className={`font-bold text-xs ${text}`}>{t(`guide.intro.${key}.label`)}</p>
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">{t(`guide.intro.${key}.body`)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment: info form guide */}
            {activeTab === "assessment" && assessStep === "info" && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-secondary" aria-hidden="true">info</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface text-sm">{t("guide.info.title")}</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                  {t("guide.info.intro")}
                </p>
                <div className="space-y-2.5">
                  {([
                    { key: "heightWeight", dot: "bg-primary", text: "text-primary" },
                    { key: "age", dot: "bg-secondary-container", text: "text-secondary" },
                    { key: "sex", dot: "bg-tertiary-container", text: "text-tertiary" },
                  ] as const).map(({ key, dot, text }) => (
                    <div key={key} className="rounded-xl p-3 bg-surface-container-low">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${dot}`} />
                        <p className={`font-bold text-xs ${text}`}>{t(`guide.info.${key}.label`)}</p>
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">{t(`guide.info.${key}.body`)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment: questions guide */}
            {activeTab === "assessment" && assessStep === "questions" && q && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-primary" aria-hidden="true">help</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface text-sm">{tQ(`q${q.id}.category`)}</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mb-3">
                  {t("guide.questions.hint")}
                </p>
                {QUESTION_HELP[q.id] && (
                  <div className="mb-3">
                    <div className="rounded-xl bg-surface-container-low p-1.5">
                      <HelpIllustration
                        questionId={q.id}
                        className="w-full h-auto text-on-surface"
                      />
                    </div>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed mt-1.5 px-0.5">
                      {tHelp(`q${q.id}.instruction`)}
                    </p>
                  </div>
                )}
                <div className="space-y-2.5">
                  {([
                    { dot: "bg-primary", text: "text-primary", value: "H" as DominantType },
                    { dot: "bg-secondary-container", text: "text-secondary", value: "S" as DominantType },
                    { dot: "bg-tertiary-container", text: "text-tertiary", value: "B" as DominantType },
                  ]).map(({ dot, text, value }) => {
                    // Question-specific outcomes when a help test exists, otherwise the generic text.
                    const hasHelp = Boolean(QUESTION_HELP[q.id]);
                    const label = hasHelp
                      ? tHelp(`q${q.id}.outcomes.${value}.label`)
                      : t(`guide.questions.${value}.label`);
                    const body = hasHelp
                      ? tHelp(`q${q.id}.outcomes.${value}.description`)
                      : t(`guide.questions.${value}.body`);
                    return (
                      <div key={value} className="rounded-xl p-3 bg-surface-container-low">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${dot}`} />
                          <p className={`font-bold text-xs ${text}`}>{label}</p>
                        </div>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">{body}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-outline-variant/15">
                  <p className="text-[10px] text-on-surface-variant">
                    {t("quiz.questionOf", { current: currentQ + 1, total: QUESTIONNAIRE.length })}
                  </p>
                </div>
              </div>
            )}

            {/* Assessment: result / Kt guide */}
            {activeTab === "assessment" && assessStep === "result" && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-tertiary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-tertiary" aria-hidden="true">biotech</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface text-sm">{t("guide.kt.title")}</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                  {t("guide.kt.intro")}
                </p>
                <div className="space-y-2.5">
                  {([
                    { key: "low", dot: "bg-primary", text: "text-primary" },
                    { key: "balanced", dot: "bg-surface-container-high", text: "text-on-surface" },
                    { key: "high", dot: "bg-secondary-container", text: "text-secondary" },
                  ] as const).map(({ key, dot, text }) => (
                    <div key={key} className="rounded-xl p-3 bg-surface-container-low">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${dot}`} />
                        <p className={`font-bold text-xs ${text}`}>{t(`guide.kt.${key}.label`)}</p>
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">{t(`guide.kt.${key}.body`)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decorative footer — always visible */}
            <div className="h-20 bg-linear-to-br from-primary/15 via-tertiary/10 to-secondary/10 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-end justify-center pb-2">
                <span className="text-5xl opacity-50" aria-hidden="true">🌿</span>
              </div>
              <p className="relative text-[10px] font-bold text-primary uppercase tracking-widest">
                {tc("appName")}
              </p>
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function CalculatorPage() {
  const tc = useTranslations("common");
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64" role="status">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent motion-safe:animate-spin" aria-hidden="true" />
        <span className="sr-only">{tc("loading")}</span>
      </div>
    }>
      <CalculatorInner />
    </Suspense>
  );
}
