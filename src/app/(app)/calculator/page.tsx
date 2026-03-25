"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DoshaRadar from "@/components/DoshaRadar";
import RemedyPanel from "@/components/RemedyPanel";
import { calculateBEDI, calcAge, BEDIResult } from "@/lib/bediEngine";
import { getRemedies, RemedyResult } from "@/lib/remedyEngine";
import { getCurrentSeason, SEASON_LABELS, SeasonKey } from "@/lib/seasonFactors";
import { DoshaKey } from "@/lib/ktMapping";
import { toast } from "sonner";

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

const SEASONS: { key: SeasonKey; icon: string }[] = [
  { key: "WINTER", icon: "❄" },
  { key: "SPRING", icon: "🌸" },
  { key: "SUMMER", icon: "☀" },
  { key: "AUTUMN", icon: "🍂" },
];

export default function CalculatorPage() {
  const [profiles, setProfiles]             = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [weightKg, setWeightKg]             = useState("");
  const [season, setSeason]                 = useState<SeasonKey>(getCurrentSeason());
  const [notes, setNotes]                   = useState("");
  const [result, setResult]                 = useState<BEDIResult | null>(null);
  const [remedyResult, setRemedyResult]     = useState<RemedyResult | null>(null);
  const [saving, setSaving]                 = useState(false);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((data: Profile[]) => {
        const withKt = data.filter((p) => p.ktScore);
        setProfiles(withKt);
        if (withKt.length > 0) setSelectedProfileId(withKt[0].id);
      });
  }, []);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

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
    setRemedyResult(getRemedies(res.status, age));
  }

  async function handleSave() {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">BEDI Тооцоолол</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Bio-Dosha-12 индекс тооцоолох</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input card */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Өгөгдөл оруулах</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profiles.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Эхлээд үнэлгээ хийж профайл үүсгэнэ үү.
                </p>
              </div>
            ) : (
              <>
                {/* Profile selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Профайл</Label>
                  <select
                    id="profile-select"
                    aria-label="Профайл сонгох"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                {/* Profile summary */}
                {selectedProfile && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Өндөр", `${selectedProfile.heightCm} см`],
                      ["Хүйс", selectedProfile.sex === "MALE" ? "Эрэгтэй" : "Эмэгтэй"],
                      ["Нас", `${calcAge(selectedProfile.birthDate)} нас`],
                      ["Kt", selectedProfile.ktScore?.toFixed(2) ?? "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="font-semibold text-slate-700">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Weight input */}
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

                {/* Season picker */}
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
                    onClick={handleSave}
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
          ) : result ? (
            <Card className="border-slate-200">
              <CardContent className="py-8 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Үнэлгээ хийгдэж Kt тодорхойлогдоогүй байна.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-64 flex items-center justify-center border-dashed border-slate-200">
              <CardContent className="text-center text-muted-foreground space-y-2">
                <p className="text-3xl">🎯</p>
                <p className="text-sm">Өгөгдлөө оруулаад</p>
                <p className="font-semibold text-slate-600">"Тооцоолох" дарна уу</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
