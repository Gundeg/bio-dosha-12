"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QUESTIONNAIRE, scoreQuestionnaire, DominantType } from "@/lib/questionnaireEngine";
import { DOSHA_MAP } from "@/lib/ktMapping";
import DoshaCard from "@/components/DoshaCard";
import { toast } from "sonner";

type Step = "profile" | "questions" | "result";

interface ProfileForm {
  name: string;
  birthDate: string;
  sex: "MALE" | "FEMALE";
  heightCm: string;
  relationship: string;
}

export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, DominantType>>({});
  const [profile, setProfile] = useState<ProfileForm>({
    name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "self",
  });
  const [result, setResult] = useState<ReturnType<typeof scoreQuestionnaire> | null>(null);
  const [saving, setSaving] = useState(false);

  function handleAnswer(value: DominantType) {
    const updated = { ...answers, [QUESTIONNAIRE[currentQ].id]: value };
    setAnswers(updated);
    if (currentQ < QUESTIONNAIRE.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const scored = scoreQuestionnaire(updated);
      setResult(scored);
      setStep("result");
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          birthDate: profile.birthDate,
          sex: profile.sex,
          heightCm: parseFloat(profile.heightCm),
          doshaType: result.doshaKey,
          ktScore: result.kt,
          relationship: profile.relationship,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Профайл амжилттай хадгалагдлаа!");
      router.push("/dashboard");
    } catch {
      toast.error("Хадгалах явцад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  }

  const q = QUESTIONNAIRE[currentQ];
  const progress = step === "profile" ? 0 : step === "result" ? 100 : ((currentQ) / QUESTIONNAIRE.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Махбодийн Үнэлгээ</h1>
        <p className="text-muted-foreground text-sm">12 асуулт — Kt коэффициент тогтоох</p>
      </div>

      <Progress value={progress} className="h-2" />

      {step === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Хувийн мэдээлэл</CardTitle>
            <CardDescription>Тооцооллын үндсэн өгөгдлүүдийг оруулна уу.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Нэр</Label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Таны нэр"
              />
            </div>
            <div className="space-y-1">
              <Label>Төрсөн огноо</Label>
              <Input
                type="date"
                value={profile.birthDate}
                onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Хүйс</Label>
              <div className="grid grid-cols-2 gap-2">
                {[{ value: "MALE", label: "Эрэгтэй" }, { value: "FEMALE", label: "Эмэгтэй" }].map(
                  ({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setProfile({ ...profile, sex: value as "MALE" | "FEMALE" })}
                      className={`border rounded-lg p-3 text-sm transition-colors ${
                        profile.sex === value
                          ? "border-primary bg-primary/5 font-semibold"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Өндөр (см)</Label>
              <Input
                type="number"
                value={profile.heightCm}
                onChange={(e) => setProfile({ ...profile, heightCm: e.target.value })}
                placeholder="170"
              />
            </div>
            <div className="space-y-1">
              <Label>Хамаарал</Label>
              <select
                aria-label="Хамаарал сонгох"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={profile.relationship}
                onChange={(e) => setProfile({ ...profile, relationship: e.target.value })}
              >
                <option value="self">Өөрийнхөө</option>
                <option value="spouse">Эхнэр/Нөхөр</option>
                <option value="child">Хүүхэд</option>
                <option value="parent">Эцэг эх</option>
                <option value="other">Бусад</option>
              </select>
            </div>
            <Button
              className="w-full"
              disabled={!profile.name || !profile.birthDate || !profile.heightCm}
              onClick={() => setStep("questions")}
            >
              Асуултуудыг эхлүүлэх →
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "questions" && (
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
                onClick={() => handleAnswer(opt.value)}
                className="w-full text-left border rounded-xl p-4 text-sm hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {opt.label}
              </button>
            ))}
            {currentQ > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentQ(currentQ - 1)}
                className="mt-2"
              >
                ← Өмнөх
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {step === "result" && result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Үнэлгээний үр дүн</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Хий (H)", score: result.scores.H, color: "text-blue-500" },
                  { label: "Шар (S)", score: result.scores.S, color: "text-amber-500" },
                  { label: "Бадган (B)", score: result.scores.B, color: "text-purple-500" },
                ].map(({ label, score, color }) => (
                  <div key={label} className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`text-3xl font-bold ${color}`}>{score}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Kt коэффициент</p>
                <p className="text-3xl font-bold">{result.kt}</p>
              </div>
            </CardContent>
          </Card>

          <DoshaCard doshaKey={result.doshaKey} kt={result.kt} />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => { setStep("questions"); setCurrentQ(0); setAnswers({}); }}
              className="flex-1"
            >
              Дахин хийх
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Хадгалж байна..." : "Хадгалах & Үргэлжлүүлэх"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
