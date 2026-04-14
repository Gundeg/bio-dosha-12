"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import DoshaRadar from "@/components/DoshaRadar";
import DoshaCard from "@/components/DoshaCard";
import RemedyPanel from "@/components/RemedyPanel";
import { calculateBEDI, calcAge, BEDIResult } from "@/lib/bediEngine";
import { getRemedies, RemedyResult } from "@/lib/remedyEngine";
import { getCurrentSeason, SEASON_LABELS, SeasonKey } from "@/lib/seasonFactors";
import { DoshaKey } from "@/lib/ktMapping";
import { QUESTIONNAIRE, scoreQuestionnaire, DominantType } from "@/lib/questionnaireEngine";
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

const RELATIONSHIP_LABELS: Record<string, string> = {
  self: "Өөрийнхөө",
  spouse: "Эхнэр/Нөхөр",
  child: "Хүүхэд",
  parent: "Эцэг эх",
  other: "Бусад",
};

const DOSHA_COLOR: Record<DominantType, string> = {
  H: "text-primary",
  S: "text-secondary",
  B: "text-tertiary",
};

const DOSHA_BG: Record<DominantType, string> = {
  H: "bg-primary/5",
  S: "bg-secondary/5",
  B: "bg-tertiary/5",
};

const CATEGORIES = [...new Set(QUESTIONNAIRE.map((q) => q.category))];

// ─── Wizard step definitions ──────────────────────────────────────────────────

const WIZARD_STEPS = [
  { label: "Доша Үнэлгээ",  desc: "Kt коэффициент" },
  { label: "Хэмжилт",       desc: "Биометр + улирал" },
  { label: "Үр дүн",        desc: "BEDI индекс" },
];

const CONSTITUTION_CARDS = [
  {
    title: "Хөнгөн биетэй",
    desc: "Туранхай, нарийн ястай. Хурдан бодисын солилцоо. Жин нэмэхэд хэцүү.",
    bg: "bg-primary/8",
    text: "text-primary",
    dot: "bg-primary",
  },
  {
    title: "Дунд биетэй",
    desc: "Спортлог, бат бөх биетэй. Булчин тодорхой. Жин хялбар зохицдог.",
    bg: "bg-secondary/8",
    text: "text-secondary",
    dot: "bg-secondary",
  },
  {
    title: "Хүнд биетэй",
    desc: "Бат бөх, хүнд биетэй. Удаан бодисын солилцоо. Жин хуримтлагдах хандлагатай.",
    bg: "bg-tertiary/8",
    text: "text-tertiary",
    dot: "bg-tertiary",
  },
];

// ─── Inner component ─────────────────────────────────────────────────────────

function CalculatorInner() {
  const searchParams = useSearchParams();
  const requestedTab  = searchParams.get("tab");
  const requestedProfile = searchParams.get("profile");
  const newParam      = searchParams.get("new");

  // Хэрэв тодорхой ?tab=calc эсвэл ?profile=X эсвэл ?new=1 байхгүй бол
  // үргэлж 1-р алхам (Доша Үнэлгээ) -аас эхлүүлнэ
  const goDirectlyToCalc = requestedTab === "calc" || !!requestedProfile || newParam === "1";
  const initialTab: Tab = goDirectlyToCalc ? "calc" : "assessment";

  // ── Shared state ──
  const [profiles, setProfiles]               = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [activeTab, setActiveTab]             = useState<Tab>(initialTab);

  // ── Calculator state ──
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [weightKg, setWeightKg]   = useState("");
  const [season, setSeason]       = useState<SeasonKey>(getCurrentSeason());
  const [notes, setNotes]         = useState("");
  const [calcResult, setCalcResult]     = useState<BEDIResult | null>(null);
  const [remedyResult, setRemedyResult] = useState<RemedyResult | null>(null);
  const [saving, setSaving]       = useState(false);

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

  // ── Load profiles ──
  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((data: Profile[]) => {
        if (!Array.isArray(data)) return;
        const withKt = data.filter((p) => p.ktScore);
        setProfiles(withKt);
        if (withKt.length === 0) {
          // Профайл байхгүй → шинэ профайл үүсгэх хэлбэр рүү
          setActiveTab("assessment");
          setAssessStep("info");
        } else {
          // Профайл байна — selectedProfileId тохируулна
          const deepLink = requestedProfile;
          const initial = (deepLink && withKt.find((p) => p.id === deepLink)) ?? withKt[0];
          if (initial) setSelectedProfileId(initial.id);

          // ?new=1 эсвэл ?tab=calc эсвэл ?profile=X → шууд 2-р алхам (Хэмжилт) руу
          if (goDirectlyToCalc) {
            setActiveTab("calc");
          } else {
            // Ердийн навигаци → 1-р алхам (профайл сонгох) -оос эхлэ
            setActiveTab("assessment");
            setAssessStep("profile-select");
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfiles(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  // ── BEDI calculate ──
  function handleCalculate() {
    if (!selectedProfile || !weightKg || !selectedProfile.ktScore) return;
    const age = calcAge(selectedProfile.birthDate);
    const res = calculateBEDI({
      weightKg: parseFloat(weightKg),
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
    if (!calcResult || !selectedProfile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/bedi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          weightKg: parseFloat(weightKg),
          season,
          notes,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Тооцоолол амжилттай хадгалагдлаа!");
      setNotes("");
    } catch {
      toast.error("Хадгалах явцад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  }

  // ── Assessment: answer a question ──
  function handleAnswer(value: DominantType) {
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
        const res = await fetch("/api/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        if (!res.ok) throw new Error();
        savedProfile = await res.json();
        setProfiles((prev) => [...prev, savedProfile]);
        toast.success(`${savedProfile.name}-ийн профайл үүслээ!`);
      } else {
        const res = await fetch(`/api/profiles/${assessProfileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doshaType: ktResult.doshaKey, ktScore: ktResult.kt }),
        });
        if (!res.ok) throw new Error();
        const refreshed = await fetch("/api/profiles").then((r) => r.json());
        const withKt = Array.isArray(refreshed) ? refreshed.filter((p: Profile) => p.ktScore) : [];
        setProfiles(withKt);
        savedProfile = withKt.find((p: Profile) => p.id === assessProfileId) ?? withKt[0];
        toast.success("Үнэлгээ шинэчлэгдлээ!");
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
    } catch {
      toast.error("Хадгалах явцад алдаа гарлаа.");
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-on-surface-variant">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  // ── Derived values ──
  const q = QUESTIONNAIRE[currentQ];
  const progress = assessStep === "questions"
    ? Math.round(((currentQ + 1) / QUESTIONNAIRE.length) * 100)
    : assessStep === "result" ? 100 : 0;

  // Шидтэн алхамын индекс: 0=үнэлгээ, 1=хэмжилт оруулах, 2=үр дүн
  const activeWizardStep = activeTab === "assessment" ? 0 : calcResult ? 2 : 1;

  // Хуудасны гарчиг
  const stepMeta = (() => {
    if (activeTab === "calc" && calcResult) {
      return { title: "BEDI Индексийн Тооцоолол", subtitle: "Таны шинжилгээ гүйцэтгэгдлээ. Үр дүнг шалгаад хадгалаарай." };
    }
    if (activeTab === "calc") {
      return { title: "Хэмжилт Оруулах", subtitle: "Биометрийн мэдээлэл болон одоогийн улирлын нөхцөлийг оруулна уу." };
    }
    if (assessStep === "questions") {
      return { title: "Доша Асуулт", subtitle: "Өнөөгийн биш — байгалийн мөн чанартаа тулгуурлан хариулаарай." };
    }
    if (assessStep === "result") {
      return { title: "Үнэлгээний Үр Дүн", subtitle: "Таны Kt коэффициент тодорхойлогдлоо. Хадгалаад BEDI тооцоолол руу орно уу." };
    }
    return { title: "Доша Профайл", subtitle: "Доша асуулгыг бөглөж Kt коэффициентийг тодорхойлно уу." };
  })();

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
            return (
              <div key={i} className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => {
                    if (i === 0) {
                      setCalcResult(null); setRemedyResult(null);
                      setActiveTab("assessment");
                      setAssessStep(profiles.length > 0 ? "profile-select" : "info");
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
                      ? "bg-surface-container text-on-surface-variant/60 hover:bg-surface-container-high"
                      : "bg-surface-container text-on-surface-variant/25 cursor-default"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                    isActive ? "bg-on-primary/20 text-on-primary"
                    : isDone ? "bg-primary/15 text-primary"
                    : "border border-current/30"
                  }`}>
                    {isDone ? "✓" : i + 1}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
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
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/8 px-2.5 py-1 rounded-full uppercase tracking-wider mb-3">
            <span>⚕</span>
            <span>BEDI Protocol v2.4</span>
          </div>
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
                  {currentQ + 1} / {QUESTIONNAIRE.length} асуулт
                </span>
                <span className="text-xs font-semibold text-primary">{progress}%</span>
              </div>
              <div className="flex gap-1">
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
            ASSESSMENT CONTENT
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "assessment" && (
          <div className="max-w-xl space-y-5">

            {/* Profile select */}
            {assessStep === "profile-select" && (
              <div className="space-y-3">
                <p className="text-sm text-on-surface-variant font-medium">Хэний үнэлгээ хийх вэ?</p>
                <div className="grid gap-3">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => startAssessment(p.id)}
                      className="flex items-center justify-between bg-surface-container-low rounded-2xl p-4 hover:bg-surface-container transition-colors text-left"
                    >
                      <div>
                        <p className="font-semibold text-on-surface">{p.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {RELATIONSHIP_LABELS[p.relationship] ?? p.relationship}
                          {p.doshaType && ` · ${p.doshaType.replace(/_/g, "-")} · Kt ${p.ktScore?.toFixed(2)}`}
                        </p>
                      </div>
                      <span className="text-primary text-sm font-medium">Дахин хийх →</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => startAssessment("__new__")}
                    className="flex items-center gap-3 bg-surface-container-low rounded-2xl p-4 hover:bg-surface-container transition-colors border-2 border-dashed border-outline-variant"
                  >
                    <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">+</span>
                    <div>
                      <p className="font-semibold text-on-surface">Шинэ профайл</p>
                      <p className="text-xs text-on-surface-variant">Шинэ хүний мэдээлэл + үнэлгээ</p>
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
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Нэр</Label>
                    <Input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Таны нэр"
                      className="bg-surface-container-low border-none h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Төрсөн огноо</Label>
                    <Input
                      type="date"
                      value={profileForm.birthDate}
                      onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                      className="bg-surface-container-low border-none h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Өндөр (см)</Label>
                    <Input
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
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Хүйс</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "MALE", label: "Эрэгтэй", icon: "♂" },
                      { value: "FEMALE", label: "Эмэгтэй", icon: "♀" },
                    ].map(({ value, label, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, sex: value as "MALE" | "FEMALE" })}
                        className={`rounded-full py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                          profileForm.sex === value
                            ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                            : "bg-surface-container-high text-on-surface"
                        }`}
                      >
                        <span>{icon}</span>{label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Хамаарал</Label>
                  <select
                    aria-label="Хамаарал сонгох"
                    className="w-full bg-surface-container-low border-none h-12 rounded-xl px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={profileForm.relationship}
                    onChange={(e) => setProfileForm({ ...profileForm, relationship: e.target.value })}
                  >
                    {Object.entries(RELATIONSHIP_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-1">
                  {profiles.length > 0 && (
                    <Button variant="outline" onClick={resetAssessment} className="flex-1 h-12">← Буцах</Button>
                  )}
                  <Button
                    className="flex-1 h-12 font-bold"
                    disabled={!profileForm.name || !profileForm.birthDate || !profileForm.heightCm}
                    onClick={() => setAssessStep("questions")}
                  >
                    Асуулт эхлүүлэх →
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
                          {q.category}
                        </span>
                        <h2 className="font-headline text-xl font-bold text-on-surface leading-snug mt-3">
                          {q.question}
                        </h2>
                      </div>
                      {currentQ > 0 && (
                        <button
                          type="button"
                          onClick={() => setCurrentQ(currentQ - 1)}
                          className="shrink-0 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors"
                        >
                          ← Буцах
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="px-6 py-5 space-y-3">
                    {q.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleAnswer(opt.value)}
                        className={`w-full text-left rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-ambient group ${DOSHA_BG[opt.value]}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm bg-surface-container-lowest ${DOSHA_COLOR[opt.value]}`}>
                            {opt.value === "H" ? "Х" : opt.value === "S" ? "Ш" : "Б"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm ${DOSHA_COLOR[opt.value]}`}>{opt.label}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{opt.hint}</p>
                          </div>
                          <span className={`shrink-0 text-base opacity-0 group-hover:opacity-100 transition-opacity ${DOSHA_COLOR[opt.value]}`}>→</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category mini-map */}
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORIES.map((cat, i) => {
                    const catQuestions = QUESTIONNAIRE.filter((cq) => cq.category === cat);
                    const done = catQuestions.every((cq) => answers[cq.id]);
                    const active = cat === q.category;
                    return (
                      <span
                        key={i}
                        className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-medium ${
                          done ? "bg-primary/10 text-primary"
                          : active ? "bg-surface-container-high text-on-surface font-bold"
                          : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {done && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        {active && !done && <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" />}
                        {cat}
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
                    <h2 className="font-headline font-bold text-on-surface">Үнэлгээний үр дүн</h2>
                    <p className="text-on-surface-variant text-sm mt-0.5">
                      {assessProfileId === "__new__"
                        ? "Профайл хадгалаад тооцоолол руу шилжинэ"
                        : "Профайлын Kt шинэчлэгдэнэ"}
                    </p>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="space-y-3">
                      {[
                        { key: "H" as DominantType, label: "Хий (Салхи)", color: "bg-primary" },
                        { key: "S" as DominantType, label: "Шар (Гал)", color: "bg-secondary-container" },
                        { key: "B" as DominantType, label: "Бадган (Газар)", color: "bg-tertiary-container" },
                      ].map(({ key, label, color }) => {
                        const score = ktResult.scores[key];
                        const pct = Math.round((score / QUESTIONNAIRE.length) * 100);
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className={`font-semibold ${DOSHA_COLOR[key]}`}>{label}</span>
                              <span className="font-bold text-on-surface">{score} оноо</span>
                            </div>
                            <Progress value={pct} className={`h-3 [&>div]:${color}`} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-surface-container-low rounded-2xl p-4 text-center">
                      <p className="text-xs text-on-surface-variant mb-1">Тогтоогдсон Kt коэффициент</p>
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
                    Дахин хийх
                  </Button>
                  <Button
                    onClick={handleSaveAssessment}
                    disabled={savingAssessment}
                    className="flex-1 h-11 font-semibold"
                  >
                    {savingAssessment ? "Хадгалж байна..." : "Хадгалаад тооцоолол хийх →"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PHYSICAL METRICS INPUT
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "calc" && !calcResult && (
          <div className="max-w-xl space-y-6">

            {profiles.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-3xl p-10 text-center shadow-ambient">
                <p className="text-4xl mb-4">🌀</p>
                <p className="text-on-surface-variant mb-5 text-sm">Эхлэхийн тулд доша үнэлгээ хийх шаардлагатай.</p>
                <Button onClick={() => { setActiveTab("assessment"); setAssessStep("info"); }}>
                  Үнэлгээ хийх →
                </Button>
              </div>
            ) : (
              <>
                {/* Profile selector pills */}
                {profiles.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {profiles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedProfileId(p.id); setCalcResult(null); setRemedyResult(null); }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedProfileId === p.id
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* 3-column metrics row */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Өндөр — профайлаас */}
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                      Өндөр (СМ)
                    </p>
                    <div className="h-14 bg-surface-container rounded-xl flex items-center justify-center font-headline text-xl font-bold text-on-surface-variant/70">
                      {selectedProfile?.heightCm ?? "—"}
                    </div>
                  </div>

                  {/* Жин — оруулах */}
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                      Жин (КГ)
                    </p>
                    <Input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="70"
                      min="20"
                      max="300"
                      className="h-14 rounded-xl text-center font-headline text-xl font-bold bg-surface-container-low border-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                  </div>

                  {/* Нас — профайлаас */}
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                      Нас
                    </p>
                    <div className="h-14 bg-surface-container rounded-xl flex items-center justify-center font-headline text-xl font-bold text-on-surface-variant/70">
                      {selectedProfile ? calcAge(selectedProfile.birthDate) : "—"}
                    </div>
                  </div>
                </div>

                {/* Хүйс */}
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                    Хүйс
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "MALE",   label: "Эрэгтэй", icon: "♂" },
                      { value: "FEMALE", label: "Эмэгтэй", icon: "♀" },
                    ].map(({ value, label, icon }) => (
                      <div
                        key={value}
                        className={`flex items-center justify-center gap-2 h-12 rounded-full font-semibold text-sm transition-all ${
                          selectedProfile?.sex === value
                            ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                            : "bg-surface-container-low text-on-surface-variant"
                        }`}
                      >
                        <span className="text-base">{icon}</span>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Улирал */}
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                    Одоогийн Улирал
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {SEASONS.map(({ key, icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSeason(key)}
                        className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-all group ${
                          season === key
                            ? "bg-surface-container-lowest ring-2 ring-primary shadow-ambient text-primary"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-primary"
                        }`}
                      >
                        <span className={`text-2xl leading-none transition-transform duration-200 ${season !== key ? "group-hover:scale-110" : ""}`}>
                          {icon}
                        </span>
                        <span className="text-xs font-bold">{SEASON_LABELS[key].mn}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Тэмдэглэл */}
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Тэмдэглэл <span className="normal-case font-normal text-on-surface-variant/50">(заавал биш)</span>
                  </Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Нэмэлт тэмдэглэл..."
                    className="mt-2 bg-surface-container-low border-none h-11 rounded-xl"
                  />
                </div>

                {/* Calculate button */}
                <Button
                  className="w-full h-14 font-extrabold text-base shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-95 transition-all gap-2"
                  disabled={!weightKg || !selectedProfile?.ktScore}
                  onClick={handleCalculate}
                >
                  <span className="material-symbols-outlined text-[20px] icon-filled">analytics</span>
                  BEDI Тооцоолох
                </Button>

                {/* Assessment re-do link */}
                {selectedProfile && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab("assessment"); startAssessment(selectedProfile.id); }}
                    className="w-full text-xs text-primary hover:underline underline-offset-2 text-center"
                  >
                    Үнэлгээ дахин хийх
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ҮР ДҮН
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "calc" && calcResult && selectedProfile && (() => {
          const isExcess = calcResult.status === "shar_badgan_excess";
          const isBalanced = calcResult.status === "balanced";
          const statusLabel = isBalanced ? "Тэнцвэртэй"
            : calcResult.status === "khii_excess" ? "Хий арвидсан"
            : "Шар/Бадган арвидсан";
          const statusColor = isExcess ? "text-secondary" : "text-primary";
          const statusBg    = isExcess ? "bg-secondary/6 border-secondary/20" : "bg-primary/6 border-primary/20";
          const statusBadge = isExcess ? "bg-secondary/15 text-secondary" : "bg-primary/15 text-primary";
          const statusDot   = isExcess ? "bg-secondary" : "bg-primary";
          const deviationExplanation = isBalanced
            ? "Таны гурван доша тэнцвэртэй байна. Одоогийн амьдралын хэв маягаа хадгалаарай."
            : calcResult.status === "khii_excess"
            ? "Хий (Вата) доша арвидсан байна. Дулаан хоол, амрах горим болон дулааны дасгалуудыг нэмнэ үү."
            : "Шар (Питта) эсвэл Бадган (Капха) давамгайлж байна. Хөнгөн хоол, хүйтэн биш дасгал хэрэгтэй.";

          return (
            <div className="max-w-xl space-y-4">

              {/* ── Хиро статус карт ── */}
              <div className={`relative overflow-hidden rounded-3xl px-7 py-6 border ${statusBg}`}>
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-[0.04] bg-current pointer-events-none" />

                {/* Статус ба BEDI индекс */}
                <div className="flex items-start justify-between gap-5 flex-wrap mb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">
                      BEDI тооцооллын үр дүн
                    </p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-4 ${statusBadge}`}>
                      <span className={`w-2 h-2 rounded-full animate-pulse ${statusDot}`} />
                      {statusLabel}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`font-headline text-5xl font-black ${statusColor}`}>{calcResult.bedi}</span>
                      <span className="text-sm text-on-surface-variant font-medium">BEDI индекс</span>
                    </div>
                  </div>

                  {/* Доша зөрүү */}
                  <div className="bg-surface-container-lowest/80 rounded-2xl px-5 py-4 text-center shrink-0">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold mb-1">
                      Доша зөрүү
                    </p>
                    <p className={`font-headline text-3xl font-black ${
                      calcResult.deviation > 0.3 ? "text-secondary"
                      : calcResult.deviation < -0.3 ? "text-primary"
                      : "text-on-surface"
                    }`}>
                      {calcResult.deviation >= 0 ? "+" : ""}{calcResult.deviation}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      {calcResult.deviation < -0.3 ? "Хий давамгай"
                       : calcResult.deviation > 0.3 ? "Шар/Бадган давамгай"
                       : "Тэнцвэртэй"}
                    </p>
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
                      <h2 className="font-headline font-bold text-on-surface text-sm">Доша Харьцааны График</h2>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Цагаан — үндсэн доша &nbsp;·&nbsp; Улаан — өнөөгийн байдал
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${statusBadge}`}>
                      {selectedProfile.doshaType.replace(/_/g, " · ")}
                    </div>
                  </div>
                  <div className="px-6 py-5 flex justify-center">
                    <DoshaRadar
                      doshaKey={selectedProfile.doshaType as DoshaKey}
                      deviation={calcResult.deviation}
                      size={280}
                    />
                  </div>
                </div>
              )}

              {/* ── Хэмжилтийн дэлгэрэнгүй ── */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Нас", value: `${calcAge(selectedProfile.birthDate)}`, sub: "жил" },
                  { label: "Жин", value: weightKg, sub: "кг" },
                  { label: "Өндөр", value: `${selectedProfile.heightCm}`, sub: "см" },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="bg-surface-container-lowest rounded-2xl shadow-ambient p-3 text-center">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold mb-1">{label}</p>
                    <p className="font-headline text-xl font-bold text-on-surface">{value}</p>
                    <p className="text-[10px] text-on-surface-variant">{sub}</p>
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
                  <span className="material-symbols-outlined text-[16px] mr-1.5">arrow_back</span>
                  Дахин тооцоолох
                </Button>
                <Button className="flex-1" onClick={handleSaveBEDI} disabled={saving}>
                  <span className="material-symbols-outlined text-[16px] mr-1.5">save</span>
                  {saving ? "Хадгалж байна..." : "Хадгалах"}
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
                    <span className="material-symbols-outlined text-[14px] text-primary">psychology</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface text-sm">Биеийн Бүтцийн Лавлах</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                  Үндсэн биеийн бүтцийг тодорхойлоход туслах лавлагаа.
                </p>
                <div className="space-y-2.5">
                  {CONSTITUTION_CARDS.map(({ title, desc, bg, text, dot }) => (
                    <div key={title} className={`rounded-xl p-3 ${bg}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${dot}`} />
                        <p className={`font-bold text-xs ${text}`}>{title}</p>
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">{desc}</p>
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
                    <span className="material-symbols-outlined text-[14px] text-primary">monitoring</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface text-sm">BEDI Утгыг Ойлгох</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                  Доша зөрүү нь таны тэнцвэрийн өнөөгийн байдлыг харуулна.
                </p>
                <div className="space-y-2.5">
                  {[
                    { dot: "bg-primary", label: "Хий арвидсан", body: "Хий (Вата) давамгайлж байна. Дулаан хоол, амрах горим шаардлагатай.", active: calcResult.deviation < -0.3 },
                    { dot: "bg-surface-container-high", label: "Тэнцвэртэй", body: "Гурван доша тэнцвэртэй. Одоогийн хэв маягаа хадгалаарай.", active: calcResult.deviation >= -0.3 && calcResult.deviation <= 0.3 },
                    { dot: "bg-secondary-container", label: "Шар/Бадган арвидсан", body: "Шар/Бадган давамгайлж байна. Хөнгөн хоол, хөргөх дасгал.", active: calcResult.deviation > 0.3 },
                  ].map(({ dot, label, body, active }) => (
                    <div key={label} className={`rounded-xl p-3 transition-all ${active ? "bg-primary/8 ring-1 ring-primary/20" : "bg-surface-container-low"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${dot}`} />
                        <p className={`font-bold text-xs ${active ? "text-primary" : "text-on-surface"}`}>{label}</p>
                        {active && <span className="ml-auto text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Одоо</span>}
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment: dosha intro */}
            {activeTab === "assessment" && assessStep === "profile-select" && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-tertiary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-tertiary">auto_awesome</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface text-sm">Гурван Доша</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                  Таны бие гурван доша-ийн хослолоос бүрдэнэ. Үнэлгээ тус тусын харьцааг тогтооно.
                </p>
                <div className="space-y-2.5">
                  {[
                    { dot: "bg-primary", text: "text-primary", label: "Хий (Vata)", body: "Салхи + эфир. Уян хатан, хурдан, бодол сэтгэлгээт." },
                    { dot: "bg-secondary-container", text: "text-secondary", label: "Шар (Pitta)", body: "Гал + ус. Хурц оюун, лидер, шийдэмгий." },
                    { dot: "bg-tertiary-container", text: "text-tertiary", label: "Бадган (Kapha)", body: "Газар + ус. Тэвчээртэй, бат бөх, хайрлах зан." },
                  ].map(({ dot, text, label, body }) => (
                    <div key={label} className="rounded-xl p-3 bg-surface-container-low">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${dot}`} />
                        <p className={`font-bold text-xs ${text}`}>{label}</p>
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">{body}</p>
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
                    <span className="material-symbols-outlined text-[14px] text-secondary">info</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface text-sm">Яагаад Шаардлагатай?</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                  Эдгээр мэдээлэл BEDI индексийг нарийвчлан тооцоолоход ашиглагдана.
                </p>
                <div className="space-y-2.5">
                  {[
                    { dot: "bg-primary", text: "text-primary", label: "Өндөр & жин", body: "BMI-тэй холбоотой BEDI хувиргалтыг тохируулна." },
                    { dot: "bg-secondary-container", text: "text-secondary", label: "Нас", body: "Насны коэффициент биологийн базелайнд нөлөөлнө." },
                    { dot: "bg-tertiary-container", text: "text-tertiary", label: "Хүйс", body: "Биологийн хүйс физиологийн суурь утгыг тодорхойлно." },
                  ].map(({ dot, text, label, body }) => (
                    <div key={label} className="rounded-xl p-3 bg-surface-container-low">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${dot}`} />
                        <p className={`font-bold text-xs ${text}`}>{label}</p>
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">{body}</p>
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
                    <span className="material-symbols-outlined text-[14px] text-primary">help</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface text-sm">{q.category}</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                  Байгалийн мөн чанартаа тулгуурлан хариулаарай — өнөөгийн биш, угийн байдлаараа.
                </p>
                <div className="space-y-2.5">
                  {[
                    { dot: "bg-primary", text: "text-primary", label: "Хий (H) хариулт", body: "Хөнгөн, уян, хувьсамтгай шинжийг илэрхийлнэ." },
                    { dot: "bg-secondary-container", text: "text-secondary", label: "Шар (S) хариулт", body: "Хурц, дулаан, шийдэмгий шинжийг илэрхийлнэ." },
                    { dot: "bg-tertiary-container", text: "text-tertiary", label: "Бадган (B) хариулт", body: "Тогтвортой, хүнд, тайван шинжийг илэрхийлнэ." },
                  ].map(({ dot, text, label, body }) => (
                    <div key={label} className="rounded-xl p-3 bg-surface-container-low">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${dot}`} />
                        <p className={`font-bold text-xs ${text}`}>{label}</p>
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-outline-variant/15">
                  <p className="text-[10px] text-on-surface-variant/60">
                    Асуулт {currentQ + 1} / {QUESTIONNAIRE.length}
                  </p>
                </div>
              </div>
            )}

            {/* Assessment: result / Kt guide */}
            {activeTab === "assessment" && assessStep === "result" && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-tertiary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-tertiary">biotech</span>
                  </div>
                  <h3 className="font-headline font-bold text-on-surface text-sm">Kt Коэффициент</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                  Kt нь таны доша тэнцвэрийн суурь утга бөгөөд BEDI тооцоолоход хэрэглэгдэнэ.
                </p>
                <div className="space-y-2.5">
                  {[
                    { dot: "bg-primary", text: "text-primary", label: "Kt < 1.0 · Хий давамгай", body: "Вата доша илүү. Хөнгөн, уян биетэй хүмүүс." },
                    { dot: "bg-surface-container-high", text: "text-on-surface", label: "Kt ≈ 1.0 · Тэнцвэртэй", body: "Гурван доша тэнцвэртэй. Хавар, намрын улиралтай ойр." },
                    { dot: "bg-secondary-container", text: "text-secondary", label: "Kt > 1.0 · Шар/Бадган", body: "Питта/Капха доша илүү. Хүнд, тогтвортой биетэй." },
                  ].map(({ dot, text, label, body }) => (
                    <div key={label} className="rounded-xl p-3 bg-surface-container-low">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${dot}`} />
                        <p className={`font-bold text-xs ${text}`}>{label}</p>
                      </div>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decorative footer — always visible */}
            <div className="h-20 bg-linear-to-br from-primary/15 via-tertiary/10 to-secondary/10 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-end justify-center pb-2">
                <span className="text-5xl opacity-50">🌿</span>
              </div>
              <p className="relative text-[10px] font-bold text-primary/70 uppercase tracking-widest">
                Bio-Dosha-12
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
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <CalculatorInner />
    </Suspense>
  );
}
