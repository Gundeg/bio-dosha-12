"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  H: "text-blue-500",
  S: "text-amber-500",
  B: "text-purple-500",
};

const DOSHA_BG: Record<DominantType, string> = {
  H: "bg-blue-50 border-blue-200",
  S: "bg-amber-50 border-amber-200",
  B: "bg-purple-50 border-purple-200",
};

// ─── Categories for grouping questions ───────────────────────────────────────
const CATEGORIES = [...new Set(QUESTIONNAIRE.map((q) => q.category))];

// ─── Inner component ─────────────────────────────────────────────────────────

function CalculatorInner() {
  const searchParams = useSearchParams();

  // ── Shared state ──
  const [profiles, setProfiles]           = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [activeTab, setActiveTab]         = useState<Tab>("calc");

  // ── Calculator state ──
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [weightKg, setWeightKg]           = useState("");
  const [season, setSeason]               = useState<SeasonKey>(getCurrentSeason());
  const [notes, setNotes]                 = useState("");
  const [calcResult, setCalcResult]       = useState<BEDIResult | null>(null);
  const [remedyResult, setRemedyResult]   = useState<RemedyResult | null>(null);
  const [saving, setSaving]               = useState(false);

  // ── Assessment state ──
  const [assessStep, setAssessStep]       = useState<AssessmentStep>("profile-select");
  const [assessProfileId, setAssessProfileId] = useState("__new__");
  const [profileForm, setProfileForm]     = useState<ProfileForm>({
    name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "self",
  });
  const [currentQ, setCurrentQ]           = useState(0);
  const [answers, setAnswers]             = useState<Record<number, DominantType>>({});
  const [ktResult, setKtResult]           = useState<ReturnType<typeof scoreQuestionnaire> | null>(null);
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
          // No profiles: go straight to assessment
          setActiveTab("assessment");
          setAssessStep("info");
        } else {
          const deepLink = searchParams.get("profile");
          const initial = (deepLink && withKt.find((p) => p.id === deepLink)) ?? withKt[0];
          if (initial) setSelectedProfileId(initial.id);
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

  // ── Assessment: save (create new or update existing) ──
  async function handleSaveAssessment() {
    if (!ktResult) return;
    setSavingAssessment(true);
    try {
      let savedProfile: Profile;

      if (assessProfileId === "__new__") {
        // Create new profile
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
        // Update existing profile's Kt
        const res = await fetch(`/api/profiles/${assessProfileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doshaType: ktResult.doshaKey, ktScore: ktResult.kt }),
        });
        if (!res.ok) throw new Error();
        // Refresh profiles
        const refreshed = await fetch("/api/profiles").then((r) => r.json());
        const withKt = Array.isArray(refreshed) ? refreshed.filter((p: Profile) => p.ktScore) : [];
        setProfiles(withKt);
        savedProfile = withKt.find((p: Profile) => p.id === assessProfileId) ?? withKt[0];
        toast.success("Үнэлгээ шинэчлэгдлээ!");
      }

      // Switch to calculator with the saved profile
      setSelectedProfileId(savedProfile.id);
      setCalcResult(null);
      setRemedyResult(null);
      setWeightKg("");
      setActiveTab("calc");

      // Reset assessment state
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
    if (profileId === "__new__") {
      setAssessStep("info");
    } else {
      setAssessStep("questions");
    }
  }

  function resetAssessment() {
    setAssessStep("profile-select");
    setCurrentQ(0);
    setAnswers({});
    setKtResult(null);
  }

  if (loadingProfiles) {
    return <div className="text-center py-20 text-muted-foreground">Ачааллаж байна...</div>;
  }

  const q = QUESTIONNAIRE[currentQ];
  const progress = assessStep === "questions"
    ? Math.round(((currentQ + 1) / QUESTIONNAIRE.length) * 100)
    : assessStep === "result" ? 100 : 0;

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Page header + Tab switcher ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Bio-Dosha-12</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Махбодийн үнэлгээ ба BEDI тооцоолол</p>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { id: "calc",       label: "Тооцоолол",  icon: "🎯" },
          { id: "assessment", label: "Үнэлгээ",    icon: "📋" },
        ] as { id: Tab; label: string; icon: string }[]).map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActiveTab(id);
              if (id === "assessment" && assessStep === "profile-select" && profiles.length === 0) {
                setAssessStep("info");
              }
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ТООЦООЛОЛ TAB
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "calc" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input card */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Өгөгдөл оруулах</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profiles.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Эхлэхийн тулд үнэлгээ хийх шаардлагатай.
                  </p>
                  <Button onClick={() => { setActiveTab("assessment"); setAssessStep("info"); }}>
                    Үнэлгээ хийх →
                  </Button>
                </div>
              ) : (
                <>
                  {/* Profile selector */}
                  {profiles.length > 1 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Профайл</Label>
                      <select
                        aria-label="Профайл сонгох"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedProfileId}
                        onChange={(e) => {
                          setSelectedProfileId(e.target.value);
                          setCalcResult(null);
                          setRemedyResult(null);
                        }}
                      >
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Profile summary */}
                  {selectedProfile && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{selectedProfile.name}</p>
                          <p className="text-xs text-slate-500">
                            {RELATIONSHIP_LABELS[selectedProfile.relationship] ?? selectedProfile.relationship}
                          </p>
                        </div>
                        {selectedProfile.doshaType && (
                          <Badge variant="secondary" className="text-xs">
                            {selectedProfile.doshaType.replace(/_/g, "-")}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {[
                          ["Нас", `${calcAge(selectedProfile.birthDate)} нас`],
                          ["Өндөр", `${selectedProfile.heightCm} см`],
                          ["Kt", selectedProfile.ktScore?.toFixed(2) ?? "—"],
                        ].map(([label, value]) => (
                          <div key={label} className="bg-white rounded-lg p-2 text-center border border-slate-100">
                            <p className="text-[10px] text-muted-foreground">{label}</p>
                            <p className="font-semibold text-slate-700 text-sm">{value}</p>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("assessment");
                          startAssessment(selectedProfile.id);
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 hover:underline underline-offset-2"
                      >
                        Үнэлгээ дахин хийх
                      </button>
                    </div>
                  )}

                  {/* Weight */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Одоогийн жин (кг)
                    </Label>
                    <Input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="70"
                      min="20"
                      max="300"
                      className="border-slate-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Season */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Улирал</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {SEASONS.map(({ key, icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSeason(key)}
                          className={`flex flex-col items-center gap-1 border rounded-xl p-2.5 text-xs font-semibold transition-all ${
                            season === key
                              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                              : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <span className="text-lg leading-none">{icon}</span>
                          <span>{SEASON_LABELS[key].mn}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Тэмдэглэл <span className="text-slate-300 font-normal">(заавал биш)</span>
                    </Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Нэмэлт тэмдэглэл..."
                      className="border-slate-200"
                    />
                  </div>

                  <Button
                    className="w-full h-11 font-semibold"
                    disabled={!weightKg || !selectedProfile?.ktScore}
                    onClick={handleCalculate}
                  >
                    Тооцоолох
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Result column */}
          <div className="space-y-4">
            {calcResult && selectedProfile?.doshaType ? (
              <>
                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Үр дүн</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <DoshaRadar
                      doshaKey={selectedProfile.doshaType as DoshaKey}
                      deviation={calcResult.deviation}
                      size={300}
                    />
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">BEDI индекс</p>
                        <p className="text-2xl font-bold text-slate-800">{calcResult.bedi}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Хазайлт (Δ)</p>
                        <p className={`text-2xl font-bold ${
                          calcResult.deviation < -0.3 ? "text-blue-500"
                          : calcResult.deviation > 0.3 ? "text-red-500"
                          : "text-emerald-500"
                        }`}>
                          {calcResult.deviation >= 0 ? "+" : ""}{calcResult.deviation}
                        </p>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline" onClick={handleSaveBEDI} disabled={saving}>
                      {saving ? "Хадгалж байна..." : "Үр дүн хадгалах"}
                    </Button>
                  </CardContent>
                </Card>

                {remedyResult && (
                  <RemedyPanel status={calcResult.status} remedyResult={remedyResult} />
                )}
              </>
            ) : (
              <Card className="h-64 flex items-center justify-center border-dashed border-slate-200">
                <CardContent className="text-center text-muted-foreground space-y-2">
                  <p className="text-3xl">🎯</p>
                  <p className="text-sm">Жингээ оруулаад</p>
                  <p className="font-semibold text-slate-600">"Тооцоолох" дарна уу</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ҮНЭЛГЭЭ TAB
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "assessment" && (
        <div className="max-w-2xl space-y-5">

          {/* ── Step: profile-select ── */}
          {assessStep === "profile-select" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-medium">Хэний үнэлгээ хийх вэ?</p>

              <div className="grid gap-3">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => startAssessment(p.id)}
                    className="flex items-center justify-between border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        {RELATIONSHIP_LABELS[p.relationship] ?? p.relationship}
                        {p.doshaType && ` · ${p.doshaType.replace(/_/g, "-")} · Kt ${p.ktScore?.toFixed(2)}`}
                      </p>
                    </div>
                    <span className="text-blue-500 text-sm font-medium">Дахин хийх →</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => startAssessment("__new__")}
                  className="flex items-center gap-3 border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <span className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold">+</span>
                  <div>
                    <p className="font-semibold text-slate-700">Шинэ профайл</p>
                    <p className="text-xs text-slate-400">Шинэ хүний мэдээлэл + үнэлгээ</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── Step: info (new profile only) ── */}
          {assessStep === "info" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Хувийн мэдээлэл</CardTitle>
                <CardDescription>Нэг л удаа оруулна — дараа нь автоматаар ашиглагдана</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Нэр</Label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Таны нэр"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Төрсөн огноо</Label>
                  <Input
                    type="date"
                    value={profileForm.birthDate}
                    onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Хүйс</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ value: "MALE", label: "Эрэгтэй" }, { value: "FEMALE", label: "Эмэгтэй" }].map(
                      ({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setProfileForm({ ...profileForm, sex: value as "MALE" | "FEMALE" })}
                          className={`border rounded-lg p-3 text-sm transition-colors ${
                            profileForm.sex === value
                              ? "border-blue-500 bg-blue-50 font-semibold text-blue-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {label}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Өндөр (см)</Label>
                  <Input
                    type="number"
                    value={profileForm.heightCm}
                    onChange={(e) => setProfileForm({ ...profileForm, heightCm: e.target.value })}
                    placeholder="170"
                    min="100"
                    max="250"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Хамаарал</Label>
                  <select
                    aria-label="Хамаарал сонгох"
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                    value={profileForm.relationship}
                    onChange={(e) => setProfileForm({ ...profileForm, relationship: e.target.value })}
                  >
                    {Object.entries(RELATIONSHIP_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  {profiles.length > 0 && (
                    <Button variant="outline" onClick={resetAssessment} className="flex-1">
                      ← Буцах
                    </Button>
                  )}
                  <Button
                    className="flex-1 h-11 font-semibold"
                    disabled={!profileForm.name || !profileForm.birthDate || !profileForm.heightCm}
                    onClick={() => setAssessStep("questions")}
                  >
                    Асуултуудыг эхлүүлэх →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Step: questions ── */}
          {assessStep === "questions" && (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {currentQ + 1} / {QUESTIONNAIRE.length} — {q.category}
                  </span>
                  <span className="text-slate-400">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <Card>
                <CardHeader>
                  <CardDescription className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
                    {q.category}
                  </CardDescription>
                  <CardTitle className="text-lg leading-snug mt-1">{q.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {q.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAnswer(opt.value)}
                      className={`w-full text-left border-2 rounded-xl p-4 transition-all hover:shadow-sm group ${DOSHA_BG[opt.value]} border-transparent hover:border-current`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-black ${
                          opt.value === "H" ? "border-blue-400 text-blue-600 bg-blue-100"
                          : opt.value === "S" ? "border-amber-400 text-amber-600 bg-amber-100"
                          : "border-purple-400 text-purple-600 bg-purple-100"
                        }`}>
                          {opt.value === "H" ? "Х" : opt.value === "S" ? "Ш" : "Б"}
                        </span>
                        <div>
                          <p className={`font-semibold text-sm ${DOSHA_COLOR[opt.value]}`}>{opt.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{opt.hint}</p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {currentQ > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentQ(currentQ - 1)}
                      className="mt-1"
                    >
                      ← Өмнөх асуулт
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Category mini-map */}
              <div className="flex gap-1 flex-wrap">
                {CATEGORIES.map((cat, i) => {
                  const catQuestions = QUESTIONNAIRE.filter((q) => q.category === cat);
                  const firstIdx = QUESTIONNAIRE.findIndex((q) => q.category === cat);
                  const done = catQuestions.every((q) => answers[q.id]);
                  const active = cat === q.category;
                  return (
                    <span
                      key={i}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        done ? "bg-emerald-100 text-emerald-700"
                        : active ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {cat}
                    </span>
                  );
                  void firstIdx;
                })}
              </div>
            </div>
          )}

          {/* ── Step: result ── */}
          {assessStep === "result" && ktResult && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Үнэлгээний үр дүн</CardTitle>
                  <CardDescription>
                    {assessProfileId === "__new__"
                      ? "Профайл хадгалаад тооцоолол руу шилжинэ"
                      : "Профайлын Kt шинэчлэгдэнэ"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score bars */}
                  <div className="space-y-3">
                    {[
                      { key: "H" as DominantType, label: "Хий (Салхи)", color: "bg-blue-400" },
                      { key: "S" as DominantType, label: "Шар (Гал)", color: "bg-amber-400" },
                      { key: "B" as DominantType, label: "Бадган (Газар)", color: "bg-purple-400" },
                    ].map(({ key, label, color }) => {
                      const score = ktResult.scores[key];
                      const pct = Math.round((score / QUESTIONNAIRE.length) * 100);
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className={`font-semibold ${DOSHA_COLOR[key]}`}>{label}</span>
                            <span className="font-bold">{score} оноо</span>
                          </div>
                          <Progress value={pct} className={`h-3 [&>div]:${color}`} />
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Тогтоогдсон Kt коэффициент</p>
                    <p className="text-4xl font-black text-slate-800">{ktResult.kt}</p>
                  </div>
                </CardContent>
              </Card>

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
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense>
      <CalculatorInner />
    </Suspense>
  );
}
