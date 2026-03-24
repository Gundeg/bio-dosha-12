"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DOSHA_MAP, DoshaKey } from "@/lib/ktMapping";
import { calcAge, BEDIStatus } from "@/lib/bediEngine";
import { getRemedies } from "@/lib/remedyEngine";

interface Patient {
  id: string;
  profile: {
    id: string;
    name: string;
    birthDate: string;
    sex: "MALE" | "FEMALE";
    heightCm: number;
    doshaType: string | null;
    ktScore: number | null;
    bediRecords: Array<{
      date: string;
      bedi: number;
      deviation: number;
      status: string;
      weightKg: number;
      season: string;
    }>;
  };
}

const STATUS_LABELS: Record<string, string> = {
  khii_excess: "Хий арвидсан",
  balanced: "Тэнцвэртэй",
  shar_badgan_excess: "Шар/Бадган арвидсан",
};

const SEASON_LABELS: Record<string, string> = {
  WINTER: "Өвөл", SPRING: "Хавар", SUMMER: "Зун", AUTUMN: "Намар",
};

function ReportContent() {
  const searchParams = useSearchParams();
  const patientProfileId = searchParams.get("patient");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState(patientProfileId ?? "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then((data) => {
        setPatients(Array.isArray(data) ? data : []);
        if (!patientProfileId && data.length > 0) setSelectedId(data[0].profile.id);
        setLoading(false);
      });
  }, [patientProfileId]);

  const patient = patients.find((p) => p.profile.id === selectedId);
  const profile = patient?.profile;
  const age = profile ? calcAge(profile.birthDate) : 0;
  const latest = profile?.bediRecords?.[0];
  const dosha = profile?.doshaType ? DOSHA_MAP[profile.doshaType as DoshaKey] : null;
  const remedies = latest ? getRemedies(latest.status as BEDIStatus, age) : null;
  const reportDate = new Date().toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" });

  function handlePrint() {
    window.print();
  }

  if (loading) return <div className="text-center py-12 text-muted-foreground">Ачааллаж байна...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Клиникийн Тайлан</h1>
          <p className="text-muted-foreground text-sm">PDF хэлбэрт хэвлэх</p>
        </div>
        <Button onClick={handlePrint} disabled={!profile}>Хэвлэх / PDF</Button>
      </div>

      {patients.length > 0 && (
        <div className="flex gap-2 flex-wrap print:hidden">
          {patients.map((p) => (
            <button
              key={p.profile.id}
              onClick={() => setSelectedId(p.profile.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedId === p.profile.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {p.profile.name}
            </button>
          ))}
        </div>
      )}

      {!profile ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Өвчтөн сонгоно уу.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 max-w-3xl mx-auto print:max-w-none">
          {/* Report header */}
          <div className="border-b-2 border-slate-800 pb-4 text-center">
            <h2 className="text-2xl font-bold">BIO-DOSHA-12 КЛИНИКИЙН ТАЙЛАН</h2>
            <p className="text-sm text-muted-foreground">Тб оточ системийн албан ёсны үнэлгээний тайлан</p>
            <p className="text-sm mt-1">{reportDate}</p>
          </div>

          {/* Patient info */}
          <Card>
            <CardHeader><CardTitle>Өвчтөний мэдээлэл</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Нэр: </span><span className="font-semibold">{profile.name}</span></div>
                <div><span className="text-muted-foreground">Нас: </span><span>{age}</span></div>
                <div><span className="text-muted-foreground">Хүйс: </span><span>{profile.sex === "MALE" ? "Эрэгтэй" : "Эмэгтэй"}</span></div>
                <div><span className="text-muted-foreground">Өндөр: </span><span>{profile.heightCm} см</span></div>
                <div><span className="text-muted-foreground">Махбод: </span><span className="font-semibold">{dosha?.label ?? "—"}</span></div>
                <div><span className="text-muted-foreground">Kt коэффициент: </span><span>{profile.ktScore ?? "—"}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Latest BEDI */}
          {latest && (
            <Card>
              <CardHeader><CardTitle>Сүүлийн BEDI Үнэлгээ</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">BEDI индекс</p>
                    <p className="text-3xl font-bold">{latest.bedi.toFixed(2)}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Хазайлт (Δ)</p>
                    <p className={`text-3xl font-bold ${
                      latest.deviation < -0.3 ? "text-blue-500"
                      : latest.deviation > 0.3 ? "text-red-500"
                      : "text-green-500"
                    }`}>
                      {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Төлөв</p>
                    <Badge variant={latest.status === "balanced" ? "default" : "destructive"} className="mt-2">
                      {STATUS_LABELS[latest.status]}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 text-sm text-muted-foreground flex gap-4">
                  <span>Огноо: {new Date(latest.date).toLocaleDateString("mn-MN")}</span>
                  <span>Жин: {latest.weightKg} кг</span>
                  <span>Улирал: {SEASON_LABELS[latest.season]}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dosha details */}
          {dosha && (
            <Card>
              <CardHeader><CardTitle>Махбодийн Шинж Чанар</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{dosha.description}</p>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Шинж чанарууд:</p>
                  <p className="text-sm">{dosha.qualities.join(", ")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Эрсдэлт хүчин зүйл:</p>
                  <p className="text-sm">{dosha.risks.join(", ")}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Remedies */}
          {remedies && (
            <Card>
              <CardHeader><CardTitle>Ерөндөгийн Зөвлөмж</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-green-700 mb-1">Алтан Ерөндөг:</p>
                  <ul className="text-sm space-y-1">
                    {remedies.remedies.map((r, i) => <li key={i}>• {r}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-1">Хориглох идээн:</p>
                  <ul className="text-sm space-y-1">
                    {remedies.avoidFoods.map((f, i) => <li key={i}>• {f}</li>)}
                  </ul>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground italic">{remedies.ageNote}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* BEDI history table */}
          {profile.bediRecords.length > 1 && (
            <Card>
              <CardHeader><CardTitle>BEDI Хандлага</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left py-2">Огноо</th>
                      <th className="text-right py-2">BEDI</th>
                      <th className="text-right py-2">Δ</th>
                      <th className="text-right py-2">Жин</th>
                      <th className="text-right py-2">Улирал</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.bediRecords.slice(0, 10).map((r) => (
                      <tr key={r.date} className="border-b last:border-0">
                        <td className="py-2">{new Date(r.date).toLocaleDateString("mn-MN")}</td>
                        <td className="text-right">{r.bedi.toFixed(2)}</td>
                        <td className={`text-right font-medium ${
                          r.deviation < -0.3 ? "text-blue-500"
                          : r.deviation > 0.3 ? "text-red-500"
                          : "text-green-500"
                        }`}>
                          {r.deviation >= 0 ? "+" : ""}{r.deviation.toFixed(2)}
                        </td>
                        <td className="text-right">{r.weightKg} кг</td>
                        <td className="text-right">{SEASON_LABELS[r.season]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Signature */}
          <div className="border-t pt-6 mt-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-muted-foreground">Тб оточийн гарын үсэг:</p>
                <div className="border-b border-slate-400 mt-8 mb-1" />
                <p className="text-xs text-muted-foreground">Нэр, тамга</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Огноо:</p>
                <div className="border-b border-slate-400 mt-8 mb-1" />
                <p className="text-xs text-muted-foreground">{reportDate}</p>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-6">
              Bio-Dosha-12 • Тб оточ систем • Энэхүү тайлан нь зөвхөн мэдээллийн зорилгоор зориулагдсан
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Ачааллаж байна...</div>}>
      <ReportContent />
    </Suspense>
  );
}
