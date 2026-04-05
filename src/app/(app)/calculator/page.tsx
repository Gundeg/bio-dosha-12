"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import DoshaRadar from "@/components/DoshaRadar";
import DoshaCard from "@/components/DoshaCard";
import RemedyPanel from "@/components/RemedyPanel";
import { calculateBEDI, calcAge, BEDIResult } from "@/lib/bediEngine";
import { getRemedies, RemedyResult } from "@/lib/remedyEngine";
import { getCurrentSeason, SEASON_LABELS, SeasonKey } from "@/lib/seasonFactors";
import { DoshaKey } from "@/lib/ktMapping";
import { QUESTIONNAIRE, scoreQuestionnaire, DominantType } from "@/lib/questionnaireEngine";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

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

type PageMode = "calc" | "new-profile";
type NewStep  = "info" | "questions" | "kt-result";

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

// ─── Main inner component (needs useSearchParams) ─────────────────────────────

function CalculatorInner() {
  const searchParams = useSearchParams();

  // ── Profiles / mode ──
  const [profiles, setProfiles]         = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [mode, setMode]                 = useState<PageMode>("calc");

  // ── BEDI calc ──
  const [weightKg, setWeightKg]         = useState("");
  const [season, setSeason]             = useState<SeasonKey>(getCurrentSeason());
  const [notes, setNotes]               = useState("");
  const [result, setResult]             = useState<BEDIResult | null>(null);
  const [remedyResult, setRemedyResult] = useState<RemedyResult | null>(null);
  const [saving, setSaving]             = useState(false);

  // ── New profile wizard ──
  const [newStep, setNewStep]           = useState<NewStep>("info");
  const [profileForm, setProfileForm]   = useState<ProfileForm>({
    name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "self",
  });
  const [currentQ, setCurrentQ]         = useState(0);
  const [answers, setAnswers]           = useState<Record<number, DominantType>>({});
  const [ktResult, setKtResult]         = useState<ReturnType<typeof scoreQuestionnaire> | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Load profiles ──
  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((data: Profile[]) => {
        if (!Array.isArray(data)) return;
        const withKt = data.filter((p) => p.ktScore);
        setProfiles(withKt);
        if (withKt.length === 0) {
          setMode("new-profile");
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
    setResult(res);
    setRemedyResult(
      getRemedies(res.status, age, selectedProfile.doshaType as DoshaKey ?? undefined, res.deviation)
    );
  }

  async function handleSaveBEDI() {
    if (!result || !selectedProfile) return;
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

  // ── Questionnaire ──
  function handleAnswer(value: DominantType) {
    const updated = { ...answers, [QUESTIONNAIRE[currentQ].id]: value };
    setAnswers(updated);
    if (currentQ < QUESTIONNAIRE.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setKtResult(scoreQuestionnaire(updated));
      setNewStep("kt-result");
    }
  }

  async function handleSaveProfile() {
    if (!ktResult) return;
    setSavingProfile(true);
    try {
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
      const newProfile: Profile = await res.json();

      // Профайл хадгалаад шууд тооцооллын горимд шилжинэ
      setProfiles((prev) => [...prev, newProfile]);
      setSelectedProfileId(newProfile.id);
      setMode("calc");
      setResult(null);
      setRemedyResult(null);
      setWeightKg("");
      // wizard reset
      setNewStep("info");
      setCurrentQ(0);
      setAnswers({});
      setKtResult(null);
      setProfileForm({ name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "self" });

      toast.success(`${newProfile.name}-ийн профайл үүслээ! Жинтэйгээ BEDI тооцоолно уу.`);
    } catch {
      toast.error("Хадгалах явцад алдаа гарлаа.");
    } finally {
      setSavingProfile(false);
    }
  }

  function startNewProfile() {
    setMode("new-profile");
    setNewStep("info");
    setCurrentQ(0);
    setAnswers({});
    setKtResult(null);
    setProfileForm({ name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "self" });
  }

  // ── Loading ──
  if (loadingProfiles) {
    return <div className="text-center py-20 text-muted-foreground">Ачааллаж байна...</div>;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NEW PROFILE WIZARD
  // ══════════════════════════════════════════════════════════════════════════
  if (mode === "new-profile") {
    const progress =
      newStep === "info"      ? 0 :
      newStep === "questions"  ? Math.round((currentQ / QUESTIONNAIRE.length) * 80) :
      100;

    const q = QUESTIONNAIRE[currentQ];

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {newStep === "info"      ? "Хувийн мэдээлэл" :
               newStep === "questions" ? "Махбодийн үнэлгээ" :
               "Үнэлгээний үр дүн"}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {newStep === "info"      ? "Нэг л удаа оруулна — дараа нь автоматаар ашиглагдана" :
               newStep === "questions" ? `${currentQ + 1} / ${QUESTIONNAIRE.length} — Kt коэффициент тогтоох` :
               "Профайл хадгалаад BEDI тооцоолол руу шилжинэ"}
            </p>
          </div>
          {profiles.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setMode("calc")}>
              ← Буцах
            </Button>
          )}
        </div>

        <Progress value={progress} className="h-2" />

        {/* Step: info */}
        {newStep === "info" && (
          <Card>
            <CardContent className="pt-6 space-y-4">
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
              <Button
                className="w-full h-11 font-semibold"
                disabled={!profileForm.name || !profileForm.birthDate || !profileForm.heightCm}
                onClick={() => setNewStep("questions")}
              >
                Асуултуудыг эхлүүлэх →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: questions */}
        {newStep === "questions" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-muted-foreground">
                {currentQ + 1} / {QUESTIONNAIRE.length}
              </CardTitle>
              <CardDescription className="text-lg text-foreground font-medium mt-1">
                {q.question}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {q.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleAnswer(opt.value)}
                  className="w-full text-left border rounded-xl p-4 text-sm hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
              {currentQ > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentQ(currentQ - 1)}
                >
                  ← Өмнөх
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step: kt-result */}
        {newStep === "kt-result" && ktResult && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kt коэффициент тогтлоо</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Хий", score: ktResult.scores.H, color: "text-blue-500" },
                    { label: "Шар", score: ktResult.scores.S, color: "text-amber-500" },
                    { label: "Бадган", score: ktResult.scores.B, color: "text-purple-500" },
                  ].map(({ label, score, color }) => (
                    <div key={label} className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-3xl font-bold ${color}`}>{score}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Kt коэффициент</p>
                  <p className="text-3xl font-bold">{ktResult.kt}</p>
                </div>
              </CardContent>
            </Card>

            <DoshaCard doshaKey={ktResult.doshaKey} kt={ktResult.kt} />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setNewStep("questions"); setCurrentQ(0); setAnswers({}); }}
                className="flex-1"
              >
                Дахин хийх
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex-1 font-semibold"
              >
                {savingProfile ? "Хадгалж байна..." : "Хадгалаад тооцоолол хийх →"}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CALCULATOR MODE
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">BEDI Тооцоолол</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Bio-Dosha-12 индекс тооцоолох</p>
        </div>
        <Button variant="outline" size="sm" onClick={startNewProfile}>
          + Шинэ профайл
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input card */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Өгөгдөл оруулах</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    setResult(null);
                    setRemedyResult(null);
                  }}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Profile summary card — auto-filled info */}
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
                  onClick={startNewProfile}
                  className="text-xs text-blue-500 hover:text-blue-700 underline-offset-2 hover:underline"
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
          </CardContent>
        </Card>

        {/* Result column */}
        <div className="space-y-4">
          {result && selectedProfile?.doshaType ? (
            <>
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Үр дүн</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <DoshaRadar
                    doshaKey={selectedProfile.doshaType as DoshaKey}
                    deviation={result.deviation}
                    size={300}
                  />
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">BEDI индекс</p>
                      <p className="text-2xl font-bold text-slate-800">{result.bedi}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Хазайлт (Δ)</p>
                      <p className={`text-2xl font-bold ${
                        result.deviation < -0.3 ? "text-blue-500"
                        : result.deviation > 0.3 ? "text-red-500"
                        : "text-emerald-500"
                      }`}>
                        {result.deviation >= 0 ? "+" : ""}{result.deviation}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleSaveBEDI}
                    disabled={saving}
                  >
                    {saving ? "Хадгалж байна..." : "Үр дүн хадгалах"}
                  </Button>
                </CardContent>
              </Card>

              {remedyResult && (
                <RemedyPanel status={result.status} remedyResult={remedyResult} />
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
