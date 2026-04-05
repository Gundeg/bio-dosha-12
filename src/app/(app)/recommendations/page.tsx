"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RemedyPanel from "@/components/RemedyPanel";
import DoshaCard from "@/components/DoshaCard";
import { calcAge, BEDIStatus } from "@/lib/bediEngine";
import { DoshaKey } from "@/lib/ktMapping";
import { RemedyResult } from "@/lib/remedyEngine";

interface StoredRecommendation {
  remedies: string[];
  avoidFoods: string[];
  riskFactors: string[];
  ageNote: string | null;
  lifestyle: string[];
  validationStatus: string | null;
  validationAction: string | null;
}

interface Profile {
  id: string;
  name: string;
  relationship: string;
  birthDate: string;
  doshaType: string | null;
  ktScore: number | null;
  bediRecords: Array<{
    deviation: number;
    status: string;
    date: string;
    recommendation: StoredRecommendation | null;
  }>;
}

export default function RecommendationsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setProfiles(data);
        const self = data.find((p: Profile) => p.relationship === "self") ?? data[0];
        if (self) setSelectedId(self.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const profile = profiles.find((p) => p.id === selectedId);
  const latest = profile?.bediRecords?.[0];
  const age = profile ? calcAge(profile.birthDate) : 0;

  // DB-с хадгалагдсан recommendation ашиглах
  const rec = latest?.recommendation ?? null;
  const remedyResult: RemedyResult | null = rec
    ? {
        remedies: rec.remedies,
        avoidFoods: rec.avoidFoods,
        riskFactors: rec.riskFactors,
        ageNote: rec.ageNote ?? "",
        lifestyle: rec.lifestyle ?? [],
        validation: rec.validationStatus
          ? {
              status: rec.validationStatus as "OK" | "WARNING" | "CONTRAINDICATED",
              action: rec.validationAction ?? "",
              adjustedDosePercent: rec.validationStatus === "WARNING" ? 70 : rec.validationStatus === "CONTRAINDICATED" ? 0 : 100,
            }
          : null,
      }
    : null;

  if (loading) return <div className="text-center py-12 text-muted-foreground">Ачааллаж байна...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ерөндөг & Зөвлөмж</h1>
        <p className="text-muted-foreground text-sm">Хазайлт дээр үндэслэсэн алтан ерөндөг</p>
      </div>

      {profiles.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {profiles.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedId === p.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {!latest ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Тооцоолол хийгдээгүй байна. Эхлээд BEDI тооцоолол хийнэ үү.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Одоогийн төлөв</span>
                <Badge
                  variant={
                    latest.status === "balanced" ? "default"
                    : latest.status === "khii_excess" ? "secondary"
                    : "destructive"
                  }
                >
                  {latest.status === "balanced" ? "Тэнцвэртэй"
                   : latest.status === "khii_excess" ? "Хий арвидсан"
                   : "Шар/Бадган арвидсан"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Хазайлт</p>
                  <p className={`text-2xl font-bold ${
                    latest.deviation < -0.3 ? "text-blue-500"
                    : latest.deviation > 0.3 ? "text-red-500"
                    : "text-green-500"
                  }`}>
                    {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Нас</p>
                  <p className="text-2xl font-bold">{age}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Огноо</p>
                  <p className="text-sm font-medium">{new Date(latest.date).toLocaleDateString("mn-MN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {profile?.doshaType && (
            <DoshaCard doshaKey={profile.doshaType as DoshaKey} kt={profile.ktScore ?? 1} />
          )}

          {remedyResult && (
            <RemedyPanel status={latest.status as BEDIStatus} remedyResult={remedyResult} />
          )}
        </>
      )}
    </div>
  );
}
