"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BEDIGauge from "@/components/BEDIGauge";
import RemedyPanel from "@/components/RemedyPanel";
import { calculateBEDI, calcAge, BEDIResult } from "@/lib/bediEngine";
import { getRemedies, RemedyResult } from "@/lib/remedyEngine";
import { getCurrentSeason, SEASON_LABELS, SeasonKey } from "@/lib/seasonFactors";
import { toast } from "sonner";

interface Profile {
  id: string;
  name: string;
  sex: "MALE" | "FEMALE";
  heightCm: number;
  ktScore: number | null;
  birthDate: string;
  relationship: string;
}

const SEASONS: SeasonKey[] = ["WINTER", "SPRING", "SUMMER", "AUTUMN"];

export default function CalculatorPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [season, setSeason] = useState<SeasonKey>(getCurrentSeason());
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<BEDIResult | null>(null);
  const [remedyResult, setRemedyResult] = useState<RemedyResult | null>(null);
  const [saving, setSaving] = useState(false);

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
    const remedies = getRemedies(res.status, age);
    setResult(res);
    setRemedyResult(remedies);
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
        <h1 className="text-2xl font-bold">BEDI Тооцоолол</h1>
        <p className="text-muted-foreground text-sm">Bio-Dosha-12 индекс тооцоолох</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Өгөгдөл оруулах</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {profiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Эхлээд үнэлгээ хийж профайл үүсгэнэ үү.
              </p>
            ) : (
              <>
                <div className="space-y-1">
                  <Label>Профайл</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
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

                {selectedProfile && (
                  <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Өндөр</span>
                      <span>{selectedProfile.heightCm} см</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Хүйс</span>
                      <span>{selectedProfile.sex === "MALE" ? "Эрэгтэй" : "Эмэгтэй"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Нас</span>
                      <span>{calcAge(selectedProfile.birthDate)} нас</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kt</span>
                      <span className="font-semibold">{selectedProfile.ktScore}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label>Одоогийн жин (кг)</Label>
                  <Input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="70"
                    min="20"
                    max="300"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Улирал</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SEASONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeason(s)}
                        className={`border rounded-lg p-2 text-sm transition-colors ${
                          season === s
                            ? "border-primary bg-primary/5 font-semibold"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {SEASON_LABELS[s].mn}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Тэмдэглэл (заавал биш)</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Нэмэлт тэмдэглэл..."
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={!weightKg || !selectedProfile?.ktScore}
                  onClick={handleCalculate}
                >
                  Тооцоолох
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {result ? (
            <>
              <Card>
                <CardHeader><CardTitle>Үр дүн</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center">
                  <BEDIGauge deviation={result.deviation} size={200} />
                  <div className="grid grid-cols-2 gap-4 mt-4 w-full text-center">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">BEDI индекс</p>
                      <p className="text-2xl font-bold">{result.bedi}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Хазайлт (Δ)</p>
                      <p className={`text-2xl font-bold ${
                        result.deviation < -0.3 ? "text-blue-500"
                        : result.deviation > 0.3 ? "text-red-500"
                        : "text-green-500"
                      }`}>
                        {result.deviation >= 0 ? "+" : ""}{result.deviation}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4"
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
          ) : (
            <Card className="h-64 flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground">
                <p>Тооцоолол хийхийн тулд өгөгдлөө оруулаад</p>
                <p className="font-medium">"Тооцоолох" дарна уу.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
