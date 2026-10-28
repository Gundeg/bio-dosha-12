"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiFetch, ApiError } from "@/lib/api";
import { EmptyState, ErrorState, PageLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Icon, type IconName } from "@/components/ui/icon";
import { IconTile, PageHeader, Section } from "@/components/kit/layout";
import { FilterTabs } from "@/components/kit/DataTable";
import { StatusBadge, type BadgeTone } from "@/components/kit/status";
import { SelectInput } from "@/components/settings/shared/Field";
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
import { WEIGHT_MAX_KG, WEIGHT_MIN_KG, fullName, isValidWeight } from "@/lib/person";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  name: string;
  lastName?: string | null;
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
  lastName: string;
  name: string;
  birthDate: string;
  sex: "MALE" | "FEMALE";
  heightCm: string;
  /** Carried to the measurement step, which needs it for the calculation. */
  weightKg: string;
  relationship: string;
}

/** What loading the profile list produced; applied to state in one place. */
type ProfilesLoad =
  | { ok: true; list: Profile[]; deepLinked?: Profile; deepLinkMissing: boolean }
  | { ok: false; error: string };

const EMPTY_PROFILE_FORM: ProfileForm = {
  lastName: "", name: "", birthDate: "", sex: "MALE", heightCm: "", weightKg: "", relationship: "self",
};

const SEASONS: { key: SeasonKey; icon: IconName }[] = [
  { key: "WINTER", icon: "season_winter" },
  { key: "SPRING", icon: "season_spring" },
  { key: "SUMMER", icon: "season_summer" },
  { key: "AUTUMN", icon: "season_autumn" },
];

// Labels: shared.relationship.<key>. "patient" is not offered here: patient
// profiles reach the calculator through a practitioner's deep link only.
const RELATIONSHIP_OPTIONS = ["self", "spouse", "child", "parent", "other"] as const;

const SEX_ICON: Record<Profile["sex"], IconName> = { MALE: "male", FEMALE: "female" };
const SEX_OPTIONS = ["MALE", "FEMALE"] as const;

/** Fill colour per constitution (Khii, Shar, Badgan), matching DOSHA_COLOR. */
const DOSHA_FILL: Record<DominantType, string> = {
  H: "bg-primary",
  S: "bg-secondary",
  B: "bg-tertiary",
};

// The status always comes from the engine; these only colour it.
const STATUS_STYLE: Record<BEDIResult["status"], { tone: BadgeTone; text: string; dot: string }> = {
  khii_excess:        { tone: "primary", text: "text-primary",     dot: "bg-primary" },
  balanced:           { tone: "success", text: "text-emerald-700", dot: "bg-emerald-600" },
  shar_badgan_excess: { tone: "warning", text: "text-secondary",   dot: "bg-secondary" },
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
  { key: "light",  fill: DOSHA_FILL.H },
  { key: "medium", fill: DOSHA_FILL.S },
  { key: "heavy",  fill: DOSHA_FILL.B },
] as const;

// ─── Shared styles ───────────────────────────────────────────────────────────

/** A selectable option tile (sex, season): 40px, hairline, tinted when selected. */
function optionTileClass(selected: boolean) {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium ring-1 ring-inset transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    selected
      ? "bg-primary/8 text-primary ring-primary/30"
      : "bg-surface-container-lowest text-on-surface ring-outline-variant hover:bg-surface-container-low"
  );
}

/** A value taken from the profile, shown where an input would be. */
const READ_ONLY_FIELD =
  "flex h-10 items-center gap-2 rounded-lg bg-surface-container-low px-3 text-sm tabular-nums text-on-surface";

const FIELD_LABEL = "mb-1.5 text-sm font-medium leading-none text-on-surface";

// ─── Guide column parts ───────────────────────────────────────────────────────

function GuideHeader({ icon, title }: { icon: IconName; title: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <IconTile name={icon} tone="primary" size="sm" />
      <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
    </div>
  );
}

function GuideIntro({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-sm leading-relaxed text-on-surface-variant">{children}</p>;
}

function Dot({ fill }: { fill: string }) {
  return <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", fill)} />;
}

function GuideItem({
  marker,
  title,
  body,
  active,
  badge,
}: {
  marker: React.ReactNode;
  title: React.ReactNode;
  body: React.ReactNode;
  active?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <li className={cn("rounded-lg p-3", active ? "bg-primary/8 ring-1 ring-inset ring-primary/30" : "bg-surface-container-low")}>
      <div className="flex items-center gap-2">
        {marker}
        <p className="min-w-0 flex-1 text-sm font-medium text-on-surface">{title}</p>
        {badge}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{body}</p>
    </li>
  );
}

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
  // A weight entered when the person was added (family page) fills the measurement step.
  const requestedWeight = searchParams.get("weight");
  const initialWeight =
    requestedWeight && isValidWeight(parseFloat(requestedWeight)) ? requestedWeight : "";

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
  const [weightKg, setWeightKg]   = useState(initialWeight);
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
  const [profileForm, setProfileForm]       = useState<ProfileForm>(EMPTY_PROFILE_FORM);
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
  // Fetching sets no state, so the mount effect can apply the result in a
  // callback and ignore it once the deep link changes (see the effect below).
  const fetchProfiles = useCallback(async (): Promise<ProfilesLoad> => {
    try {
      const data = await apiFetch<Profile[]>("/api/profiles");
      let list = Array.isArray(data) ? data : [];

      // A practitioner's "Тооцоолох" link points at a patient profile, which the
      // profile list leaves out. Load it directly instead of silently falling
      // back to the practitioner's own profile.
      let deepLinked: Profile | undefined;
      let deepLinkMissing = false;
      if (requestedProfile) {
        deepLinked = list.find((p) => p.id === requestedProfile);
        if (!deepLinked) {
          try {
            deepLinked = await apiFetch<Profile>(`/api/profiles/${requestedProfile}`);
            list = [...list, deepLinked];
          } catch {
            deepLinkMissing = true;
          }
        }
      }
      return { ok: true, list, deepLinked, deepLinkMissing };
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : tRef.current("loadError") };
    }
  }, [requestedProfile]);

  const applyProfiles = useCallback((result: ProfilesLoad) => {
    setLoadingProfiles(false);
    if (!result.ok) {
      setLoadError(result.error);
      return;
    }
    setLoadError(null);
    const { list, deepLinked } = result;
    if (result.deepLinkMissing) toast.error(tRef.current("toast.profileNotFound"));

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
  }, [requestedProfile, goDirectlyToCalc]);

  useEffect(() => {
    let cancelled = false;
    fetchProfiles().then((result) => {
      if (!cancelled) applyProfiles(result);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchProfiles, applyProfiles]);

  function retryLoad() {
    setLoadError(null);
    setLoadingProfiles(true);
    void fetchProfiles().then(applyProfiles);
  }

  useEffect(() => {
    if (assessStep === "questions") questionHeadingRef.current?.focus();
  }, [assessStep, currentQ]);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const weightValue = parseFloat(weightKg);
  const weightValid = isValidWeight(weightValue);
  // The new-person form asks for the weight too, so the measurement step opens with it.
  const infoWeightValid = isValidWeight(parseFloat(profileForm.weightKg));

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
            lastName: profileForm.lastName.trim(),
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
        toast.success(t("toast.profileCreated", { name: fullName(savedProfile) }));
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
      // Keep a weight entered with the new person (or carried in from the family page).
      setWeightKg((current) => profileForm.weightKg || current);
      setActiveTab("calc");
      setAssessStep("profile-select");
      setCurrentQ(0);
      setAnswers({});
      setKtResult(null);
      setProfileForm(EMPTY_PROFILE_FORM);
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
    return <PageLoading label={tc("loading")} />;
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
  const showQuizProgress = activeTab === "assessment" && assessStep === "questions";

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
    <div className="flex gap-8">

      {/* ── MAIN: Content area ────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">

        {/* ── Wizard steps ── */}
        <ol className="mb-5 flex items-center gap-1 overflow-x-auto pb-0.5">
          {WIZARD_STEPS.map((step, i) => {
            const isActive = activeWizardStep === i;
            const isDone = activeWizardStep > i;
            const isClickable = i === 0 || (i === 1 && profiles.length > 0);
            const stepLabel = t(`wizard.steps.${step}`);
            return (
              <li key={step} className="flex shrink-0 items-center gap-1">
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
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-lg px-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-default",
                    isActive
                      ? "text-on-surface"
                      : isClickable
                      ? "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                      : "text-on-surface-variant/60"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      isActive
                        ? "bg-primary text-on-primary"
                        : isDone
                        ? "bg-primary/10 text-primary"
                        : "ring-1 ring-inset ring-outline-variant"
                    )}
                  >
                    {isDone ? <Icon name="check" className="size-3.5" /> : i + 1}
                  </span>
                  <span className={isActive ? undefined : "hidden sm:inline"}>{stepLabel}</span>
                </button>
                {i < WIZARD_STEPS.length - 1 && (
                  <span aria-hidden="true" className={cn("h-px w-4 shrink-0 sm:w-8", isDone ? "bg-primary/40" : "bg-outline-variant")} />
                )}
              </li>
            );
          })}
        </ol>

        <PageHeader
          title={stepMeta.title}
          description={stepMeta.subtitle}
          className={showQuizProgress ? "mb-4" : undefined}
        />

        {showQuizProgress && (
          <div className="mb-6 max-w-xl">
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span className="text-on-surface-variant">
                {t("quiz.counter", { current: currentQ + 1, total: QUESTIONNAIRE.length })}
              </span>
              <span className="tabular-nums text-primary">{progress}%</span>
            </div>
            <p className="sr-only" aria-live="polite">
              {t("quiz.questionOf", { current: currentQ + 1, total: QUESTIONNAIRE.length })}
            </p>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-surface-container-high"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label={t("quiz.progressLabel")}
            >
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            LOAD ERROR — алдаа хэзээ ч "хоосон" мэт харагдах ёсгүй
        ══════════════════════════════════════════════════════════════ */}
        {loadError && (
          <div className="max-w-xl">
            <ErrorState message={loadError} onRetry={retryLoad} />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ASSESSMENT CONTENT
        ══════════════════════════════════════════════════════════════ */}
        {!loadError && activeTab === "assessment" && (
          <div className="max-w-xl space-y-4">

            {/* Profile select */}
            {assessStep === "profile-select" && (
              <Section title={t("profileSelect.prompt")} className="overflow-hidden" bodyClassName="p-0">
                <ul className="divide-y divide-outline-variant">
                  {allProfiles.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => startAssessment(p.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                      >
                        <IconTile name="person" size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-on-surface">{fullName(p)}</span>
                          <span className="block text-xs text-on-surface-variant">
                            {relationshipLabel(p.relationship)}
                            {p.doshaType && ` · ${doshaLabel(p.doshaType)} · Kt ${p.ktScore?.toFixed(2)}`}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
                          {p.ktScore ? t("profileSelect.retake") : t("profileSelect.start")}
                          <Icon name="chevron_right" className="size-4" />
                        </span>
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={() => startAssessment("__new__")}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                    >
                      <IconTile name="person_add" tone="primary" size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-on-surface">{t("profileSelect.newProfile")}</span>
                        <span className="block text-xs text-on-surface-variant">{t("profileSelect.newProfileDesc")}</span>
                      </span>
                      <Icon name="chevron_right" className="size-4 text-on-surface-variant" />
                    </button>
                  </li>
                </ul>
              </Section>
            )}

            {/* Profile info form */}
            {assessStep === "info" && (
              <Section bodyClassName="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Овог first, as Mongolian names are written; it tells apart people with the same name. */}
                  <div className="space-y-1.5">
                    <Label htmlFor="assess-last-name" className="text-on-surface">{t("form.lastName")}</Label>
                    <Input
                      id="assess-last-name"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      placeholder={t("form.lastNamePlaceholder")}
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="assess-name" className="text-on-surface">{t("form.name")}</Label>
                    <Input
                      id="assess-name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder={t("form.namePlaceholder")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="assess-birth-date" className="text-on-surface">{t("form.birthDate")}</Label>
                    <Input
                      id="assess-birth-date"
                      type="date"
                      value={profileForm.birthDate}
                      onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="assess-height" className="text-on-surface">{t("form.height")}</Label>
                    <Input
                      id="assess-height"
                      type="number"
                      value={profileForm.heightCm}
                      onChange={(e) => setProfileForm({ ...profileForm, heightCm: e.target.value })}
                      placeholder="170"
                      min="100" max="250"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="assess-weight" className="text-on-surface">{t("form.weight")}</Label>
                    <Input
                      id="assess-weight"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min={WEIGHT_MIN_KG}
                      max={WEIGHT_MAX_KG}
                      value={profileForm.weightKg}
                      onChange={(e) => setProfileForm({ ...profileForm, weightKg: e.target.value })}
                      placeholder="60"
                      aria-invalid={profileForm.weightKg !== "" && !infoWeightValid}
                      aria-describedby="assess-weight-hint"
                    />
                    <p
                      id="assess-weight-hint"
                      className={cn("text-xs", profileForm.weightKg !== "" && !infoWeightValid ? "text-red-700" : "text-on-surface-variant")}
                    >
                      {profileForm.weightKg !== "" && !infoWeightValid
                        ? t("calc.weightRange", { min: WEIGHT_MIN_KG, max: WEIGHT_MAX_KG })
                        : t("form.weightHint")}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label id="assess-sex-label" className="text-on-surface">{t("form.sex")}</Label>
                  <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="assess-sex-label">
                    {SEX_OPTIONS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={profileForm.sex === value}
                        onClick={() => setProfileForm({ ...profileForm, sex: value })}
                        className={optionTileClass(profileForm.sex === value)}
                      >
                        <Icon name={SEX_ICON[value]} className="size-4" />
                        {tShared(`sex.${value}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assess-relationship" className="text-on-surface">{t("form.relationship")}</Label>
                  <SelectInput
                    id="assess-relationship"
                    value={profileForm.relationship}
                    onChange={(e) => setProfileForm({ ...profileForm, relationship: e.target.value })}
                  >
                    {RELATIONSHIP_OPTIONS.map((value) => (
                      <option key={value} value={value}>{tShared(`relationship.${value}`)}</option>
                    ))}
                  </SelectInput>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
                  {allProfiles.length > 0 && (
                    <Button variant="outline" size="lg" onClick={resetAssessment} className="sm:flex-1">
                      <Icon name="arrow_back" className="size-4" />
                      {t("actions.back")}
                    </Button>
                  )}
                  <Button
                    size="lg"
                    className="sm:flex-1"
                    disabled={
                      !profileForm.lastName.trim() || !profileForm.name.trim() || !profileForm.birthDate ||
                      !profileForm.heightCm || !infoWeightValid
                    }
                    onClick={() => setAssessStep("questions")}
                  >
                    {t("form.startQuestions")}
                  </Button>
                </div>
              </Section>
            )}

            {/* Questions */}
            {assessStep === "questions" && (
              <div className="space-y-4">
                <section className="rounded-xl bg-surface-container-lowest shadow-ambient">
                  <div className="flex items-start justify-between gap-3 border-b border-outline-variant px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-primary">{tQ(`q${q.id}.category`)}</p>
                      <h2
                        ref={questionHeadingRef}
                        tabIndex={-1}
                        className="mt-1 text-lg font-semibold leading-snug text-on-surface focus:outline-none"
                      >
                        {tQ(`q${q.id}.question`)}
                      </h2>
                      <QuestionHelpButton question={q} />
                    </div>
                    {currentQ > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentQ(currentQ - 1)}
                        className="-mr-2 shrink-0"
                      >
                        <Icon name="arrow_back" className="size-4" />
                        {t("actions.back")}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 p-5">
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => handleAnswer(opt.value)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg p-3 text-left ring-1 ring-inset transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                            selected
                              ? "bg-primary/8 ring-primary/30"
                              : "bg-surface-container-lowest ring-outline-variant hover:bg-surface-container-low"
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-inset ring-current/20",
                              DOSHA_BG[opt.value],
                              DOSHA_COLOR[opt.value]
                            )}
                          >
                            {t(`doshaLetter.${opt.value}`)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-on-surface">{tQ(`q${q.id}.options.${opt.value}.label`)}</span>
                            <span className="mt-0.5 block text-sm leading-relaxed text-on-surface-variant">{tQ(`q${q.id}.options.${opt.value}.hint`)}</span>
                          </span>
                          {selected && <Icon name="check" className="size-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Category mini-map */}
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(({ category, firstQuestionId }) => {
                    const catQuestions = QUESTIONNAIRE.filter((cq) => cq.category === category);
                    const done = catQuestions.every((cq) => answers[cq.id]);
                    const active = category === q.category;
                    return (
                      <span
                        key={category}
                        className={cn(
                          "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium",
                          done
                            ? "bg-primary/8 text-primary"
                            : active
                            ? "bg-surface-container-lowest text-on-surface ring-1 ring-inset ring-outline-variant"
                            : "bg-surface-container-low text-on-surface-variant"
                        )}
                      >
                        {done && <Icon name="check" className="size-3.5" />}
                        {active && !done && <span className="size-1.5 rounded-full bg-on-surface-variant" aria-hidden="true" />}
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
                <Section
                  title={t("assessmentResult.title")}
                  description={
                    assessProfileId === "__new__"
                      ? t("assessmentResult.newProfileNote")
                      : t("assessmentResult.updateNote")
                  }
                  bodyClassName="space-y-5"
                >
                  <div className="space-y-4">
                    {(["H", "S", "B"] as DominantType[]).map((key) => {
                      const score = ktResult.scores[key];
                      const pct = Math.round((score / QUESTIONNAIRE.length) * 100);
                      const label = t(`assessmentResult.elements.${key}`);
                      return (
                        <div key={key} className="space-y-1.5">
                          <div className="flex justify-between gap-3 text-sm">
                            <span className={cn("font-medium", DOSHA_COLOR[key])}>{label}</span>
                            <span className="font-semibold tabular-nums text-on-surface">{t("assessmentResult.points", { score })}</span>
                          </div>
                          <Progress value={pct} aria-label={label} trackClassName="h-2" indicatorClassName={DOSHA_FILL[key]} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-4 text-center">
                    <p className="text-sm text-on-surface-variant">{t("assessmentResult.ktLabel")}</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-on-surface">{ktResult.kt}</p>
                  </div>
                </Section>

                <DoshaCard doshaKey={ktResult.doshaKey} kt={ktResult.kt} />

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => { setCurrentQ(0); setAnswers({}); setAssessStep("questions"); }}
                    className="sm:flex-1"
                  >
                    {t("assessmentResult.retake")}
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleSaveAssessment}
                    disabled={savingAssessment}
                    className="sm:flex-1"
                  >
                    {savingAssessment ? t("actions.saving") : t("assessmentResult.saveAndCalculate")}
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
          <div className="max-w-xl space-y-3">

            {profiles.length === 0 ? (
              <EmptyState
                icon="orbit"
                title={t("calc.noProfiles")}
                action={
                  <Button onClick={() => { setActiveTab("assessment"); setAssessStep("info"); }}>
                    {t("calc.startAssessment")}
                  </Button>
                }
              />
            ) : (
              <>
                <Section bodyClassName="space-y-6">
                  {/* Profile selector — always shown so it is clear whose data is saved */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-on-surface">{t("calc.whose")}</p>
                    <FilterTabs
                      label={t("calc.profileGroup")}
                      value={selectedProfileId}
                      onChange={(id) => { setSelectedProfileId(id); setCalcResult(null); setRemedyResult(null); setSaved(false); }}
                      options={profiles.map((p) => ({
                        value: p.id,
                        label: (
                          <>
                            {fullName(p)}
                            {p.relationship === "patient" && (
                              <span className="text-xs font-normal opacity-70">· {tShared("relationship.patient")}</span>
                            )}
                          </>
                        ),
                      }))}
                    />
                    {!selectedProfile && (
                      <p className="text-sm text-amber-700" role="status">
                        {t("calc.selectProfile")}
                      </p>
                    )}
                  </div>

                  {/* Measurements: height, age and sex come from the profile; weight is entered. */}
                  <div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className={FIELD_LABEL}>{t("calc.height")}</p>
                        <div className={READ_ONLY_FIELD}>{selectedProfile?.heightCm ?? "—"}</div>
                      </div>

                      <div>
                        <Label htmlFor="calc-weight" className={FIELD_LABEL}>
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
                          className="tabular-nums"
                        />
                      </div>

                      <div>
                        <p className={FIELD_LABEL}>{t("calc.age")}</p>
                        <div className={READ_ONLY_FIELD}>{selectedProfile ? calcAge(selectedProfile.birthDate) : "—"}</div>
                      </div>

                      <div>
                        <p className={FIELD_LABEL}>{t("calc.sex")}</p>
                        <div className={READ_ONLY_FIELD}>
                          {selectedProfile ? (
                            <>
                              <Icon name={SEX_ICON[selectedProfile.sex]} className="size-4 text-on-surface-variant" />
                              {tShared(`sex.${selectedProfile.sex}`)}
                            </>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>
                    </div>

                    {weightKg !== "" && !weightValid && (
                      <p id="calc-weight-error" className="mt-2 text-xs text-red-700" role="alert">
                        {t("calc.weightRange", { min: WEIGHT_MIN_KG, max: WEIGHT_MAX_KG })}
                      </p>
                    )}
                  </div>

                  {/* Улирал */}
                  <div>
                    <p id="calc-season-label" className={FIELD_LABEL}>
                      {t("calc.season")}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-labelledby="calc-season-label">
                      {SEASONS.map(({ key, icon }) => (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={season === key}
                          onClick={() => setSeason(key)}
                          className={optionTileClass(season === key)}
                        >
                          <Icon name={icon} className="size-4" />
                          {tShared(`season.${key}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Тэмдэглэл */}
                  <div className="space-y-1.5">
                    <Label htmlFor="calc-notes" className="text-on-surface">
                      {t("calc.notes")} <span className="font-normal text-on-surface-variant">{t("calc.optional")}</span>
                    </Label>
                    <Input
                      id="calc-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t("calc.notesPlaceholder")}
                    />
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    disabled={!weightValid || !selectedProfile?.ktScore}
                    onClick={handleCalculate}
                  >
                    <Icon name="analytics" className="size-4" />
                    {t("calc.calculate")}
                  </Button>
                </Section>

                {/* Assessment re-do link */}
                {selectedProfile && (
                  <Button
                    variant="link"
                    size="sm"
                    className="w-full"
                    onClick={() => { setActiveTab("assessment"); startAssessment(selectedProfile.id); }}
                  >
                    {t("calc.retakeAssessment")}
                  </Button>
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
          const deviationExplanation = t(`bediResult.explanation.${calcResult.status}`);

          return (
            <div className="max-w-xl space-y-4">

              {/* ── Status, index and deviation ── */}
              <section className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient">
                <p className="text-sm font-medium text-on-surface-variant">{t("bediResult.heading")}</p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <StatusBadge tone={style.tone}>{statusLabel}</StatusBadge>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className={cn("text-4xl font-semibold tabular-nums tracking-tight", style.text)}>{calcResult.bedi}</span>
                      <span className="text-sm text-on-surface-variant">{t("bediResult.index")}</span>
                    </div>
                  </div>

                  {/* Хазайлт (Δ) */}
                  <div className="shrink-0 rounded-lg bg-surface-container-low px-4 py-3 text-center">
                    <p className="text-xs font-medium text-on-surface-variant">{t("bediResult.deviation")}</p>
                    <p className={cn("mt-1 text-2xl font-semibold tabular-nums", style.text)}>
                      {calcResult.deviation >= 0 ? "+" : ""}{calcResult.deviation}
                    </p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{statusLabel}</p>
                  </div>
                </div>

                {/* Тайлбар */}
                <p className="mt-5 border-t border-outline-variant pt-4 text-sm leading-relaxed text-on-surface">
                  {deviationExplanation}
                </p>
              </section>

              {/* ── Радар график ── */}
              {selectedProfile.doshaType && (
                <Section
                  title={t("bediResult.chartTitle")}
                  description={t("bediResult.chartLegend")}
                  actions={<StatusBadge tone="neutral" dot={false}>{doshaLabel(selectedProfile.doshaType)}</StatusBadge>}
                  bodyClassName="flex justify-center"
                >
                  <DoshaRadar
                    doshaKey={selectedProfile.doshaType as DoshaKey}
                    deviation={calcResult.deviation}
                    status={calcResult.status}
                    size={280}
                  />
                </Section>
              )}

              {/* ── Хэмжилтийн дэлгэрэнгүй ── */}
              <dl className="grid grid-cols-3 divide-x divide-outline-variant rounded-xl bg-surface-container-lowest shadow-ambient">
                {[
                  { key: "age", value: `${calcAge(selectedProfile.birthDate)}` },
                  { key: "weight", value: weightKg },
                  { key: "height", value: `${selectedProfile.heightCm}` },
                ].map(({ key, value }) => (
                  <div key={key} className="px-3 py-4 text-center">
                    <dt className="text-xs font-medium text-on-surface-variant">{t(`bediResult.metrics.${key}.label`)}</dt>
                    <dd className="mt-1">
                      <span className="text-xl font-semibold tabular-nums text-on-surface">{value}</span>
                      <span className="ml-1 text-xs text-on-surface-variant">{t(`bediResult.metrics.${key}.unit`)}</span>
                    </dd>
                  </div>
                ))}
              </dl>

              {/* ── Товчнууд ── */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  size="lg"
                  className="sm:flex-1"
                  onClick={() => { setCalcResult(null); setRemedyResult(null); }}
                >
                  <Icon name="arrow_back" className="size-4" />
                  {t("bediResult.recalculate")}
                </Button>
                <Button size="lg" className="sm:flex-1" onClick={handleSaveBEDI} disabled={saving || saved}>
                  <Icon name={saved ? "check" : "save"} className="size-4" />
                  {saving ? t("actions.saving") : saved ? t("bediResult.saved") : t("bediResult.save")}
                </Button>
              </div>

              {remedyResult && (
                <RemedyPanel status={calcResult.status} remedyResult={remedyResult} />
              )}
            </div>
          );
        })()}
      </div>

      {/* ── RIGHT: Dynamic helper panel ─────────────────────────────── */}
      <aside className="hidden w-64 shrink-0 xl:block">
        <div className="sticky top-10 rounded-xl bg-surface-container-lowest p-5 shadow-ambient">

          {/* Constitution helper — calc input */}
          {activeTab === "calc" && !calcResult && (
            <>
              <GuideHeader icon="psychology" title={t("guide.constitution.title")} />
              <GuideIntro>{t("guide.constitution.intro")}</GuideIntro>
              <ul className="space-y-2">
                {CONSTITUTION_CARDS.map(({ key, fill }) => (
                  <GuideItem
                    key={key}
                    marker={<Dot fill={fill} />}
                    title={t(`guide.constitution.${key}.title`)}
                    body={t(`guide.constitution.${key}.desc`)}
                  />
                ))}
              </ul>
            </>
          )}

          {/* BEDI result guide */}
          {activeTab === "calc" && calcResult && (
            <>
              <GuideHeader icon="monitoring" title={t("guide.bedi.title")} />
              <GuideIntro>{t("guide.bedi.intro")}</GuideIntro>
              <ul className="space-y-2">
                {(["khii_excess", "balanced", "shar_badgan_excess"] as BEDIResult["status"][]).map((status) => {
                  const active = calcResult.status === status;
                  return (
                    <GuideItem
                      key={status}
                      active={active}
                      marker={<Dot fill={STATUS_STYLE[status].dot} />}
                      title={tShared(`status.${status}`)}
                      body={t(`guide.bedi.body.${status}`)}
                      badge={active ? <StatusBadge tone="primary" dot={false} className="h-5 px-2">{t("guide.bedi.current")}</StatusBadge> : undefined}
                    />
                  );
                })}
              </ul>
            </>
          )}

          {/* Assessment: dosha intro */}
          {activeTab === "assessment" && assessStep === "profile-select" && (
            <>
              <GuideHeader icon="auto_awesome" title={t("guide.intro.title")} />
              <GuideIntro>{t("guide.intro.text")}</GuideIntro>
              <ul className="space-y-2">
                {(["H", "S", "B"] as const).map((key) => (
                  <GuideItem
                    key={key}
                    marker={<Dot fill={DOSHA_FILL[key]} />}
                    title={t(`guide.intro.${key}.label`)}
                    body={t(`guide.intro.${key}.body`)}
                  />
                ))}
              </ul>
            </>
          )}

          {/* Assessment: info form guide */}
          {activeTab === "assessment" && assessStep === "info" && (
            <>
              <GuideHeader icon="info" title={t("guide.info.title")} />
              <GuideIntro>{t("guide.info.intro")}</GuideIntro>
              <ul className="space-y-2">
                {([
                  { key: "heightWeight", icon: "height" },
                  { key: "age", icon: "cake" },
                  { key: "sex", icon: "wc" },
                ] as const).map(({ key, icon }) => (
                  <GuideItem
                    key={key}
                    marker={<Icon name={icon} className="size-4 text-on-surface-variant" />}
                    title={t(`guide.info.${key}.label`)}
                    body={t(`guide.info.${key}.body`)}
                  />
                ))}
              </ul>
            </>
          )}

          {/* Assessment: questions guide */}
          {activeTab === "assessment" && assessStep === "questions" && q && (
            <>
              <GuideHeader icon="help" title={tQ(`q${q.id}.category`)} />
              <GuideIntro>{t("guide.questions.hint")}</GuideIntro>
              {QUESTION_HELP[q.id] && (
                <div className="mb-4">
                  <div className="rounded-lg bg-surface-container-low p-1.5">
                    <HelpIllustration
                      questionId={q.id}
                      className="h-auto w-full text-on-surface"
                    />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                    {tHelp(`q${q.id}.instruction`)}
                  </p>
                </div>
              )}
              <ul className="space-y-2">
                {(["H", "S", "B"] as DominantType[]).map((value) => {
                  // Question-specific outcomes when a help test exists, otherwise the generic text.
                  const hasHelp = Boolean(QUESTION_HELP[q.id]);
                  const label = hasHelp
                    ? tHelp(`q${q.id}.outcomes.${value}.label`)
                    : t(`guide.questions.${value}.label`);
                  const body = hasHelp
                    ? tHelp(`q${q.id}.outcomes.${value}.description`)
                    : t(`guide.questions.${value}.body`);
                  return <GuideItem key={value} marker={<Dot fill={DOSHA_FILL[value]} />} title={label} body={body} />;
                })}
              </ul>
              <p className="mt-4 border-t border-outline-variant pt-3 text-xs text-on-surface-variant">
                {t("quiz.questionOf", { current: currentQ + 1, total: QUESTIONNAIRE.length })}
              </p>
            </>
          )}

          {/* Assessment: result / Kt guide */}
          {activeTab === "assessment" && assessStep === "result" && (
            <>
              <GuideHeader icon="biotech" title={t("guide.kt.title")} />
              <GuideIntro>{t("guide.kt.intro")}</GuideIntro>
              <ul className="space-y-2">
                {([
                  { key: "low", fill: DOSHA_FILL.H },
                  { key: "balanced", fill: STATUS_STYLE.balanced.dot },
                  { key: "high", fill: DOSHA_FILL.S },
                ] as const).map(({ key, fill }) => (
                  <GuideItem
                    key={key}
                    marker={<Dot fill={fill} />}
                    title={t(`guide.kt.${key}.label`)}
                    body={t(`guide.kt.${key}.body`)}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      </aside>

    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function CalculatorPage() {
  const tc = useTranslations("common");
  return (
    <Suspense fallback={<PageLoading label={tc("loading")} />}>
      <CalculatorInner />
    </Suspense>
  );
}
