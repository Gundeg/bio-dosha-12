"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  name: string;
  relationship: string;
}

interface BEDIRecord {
  id: string;
  date: string;
  bedi: number;
  deviation: number;
  status: string;
  weightKg: number;
  season: string;
  notes: string | null;
}

const STATUS_CONFIG = {
  khii_excess: { label: "Хий арвидсан", color: "#60a5fa" },
  balanced: { label: "Тэнцвэртэй", color: "#4ade80" },
  shar_badgan_excess: { label: "Шар/Бадган", color: "#f87171" },
};

const SEASON_LABELS: Record<string, string> = {
  WINTER: "Өвөл", SPRING: "Хавар", SUMMER: "Зун", AUTUMN: "Намар",
};

export default function HistoryPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [records, setRecords] = useState<BEDIRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((data: Profile[]) => {
        if (!Array.isArray(data)) return;
        setProfiles(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    fetch(`/api/bedi?profileId=${selectedId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRecords(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedId]);

  const chartData = [...records]
    .reverse()
    .map((r) => ({
      date: new Date(r.date).toLocaleDateString("mn-MN", { month: "short", day: "numeric" }),
      deviation: r.deviation,
      bedi: r.bedi,
      weight: r.weightKg,
      season: SEASON_LABELS[r.season],
    }));

  function exportCSV() {
    const header = "Огноо,BEDI,Хазайлт,Жин,Улирал,Төлөв\n";
    const rows = records.map((r) =>
      `${new Date(r.date).toLocaleDateString()},${r.bedi},${r.deviation},${r.weightKg},${SEASON_LABELS[r.season]},${STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG]?.label ?? r.status}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bedi-history.csv";
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">BEDI Түүх</h1>
          <p className="text-muted-foreground text-sm">Хазайлтын динамик хандлага</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={records.length === 0}>
          CSV татах
        </Button>
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

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Ачааллаж байна...</div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Тооцооллын түүх байхгүй байна. Эхлээд тооцоолол хийнэ үү.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Хазайлт (Δ) хандлага</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[-1, 1]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [typeof value === "number" ? value.toFixed(2) : value, "Хазайлт"]}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <ReferenceLine y={0.3} stroke="#f87171" strokeDasharray="4 4" label={{ value: "+0.3", fontSize: 11 }} />
                  <ReferenceLine y={-0.3} stroke="#60a5fa" strokeDasharray="4 4" label={{ value: "-0.3", fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="deviation"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Хазайлт (Δ)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Дэлгэрэнгүй бүртгэл</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {records.map((r) => {
                  const sc = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG];
                  return (
                    <div key={r.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">
                          {new Date(r.date).toLocaleDateString("mn-MN")}
                        </div>
                        <Badge
                          variant={r.status === "balanced" ? "default" : r.status === "khii_excess" ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {sc?.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>
                          <span className="text-muted-foreground">BEDI </span>
                          <span className="font-medium">{r.bedi.toFixed(2)}</span>
                        </span>
                        <span className={`font-semibold ${
                          r.deviation < -0.3 ? "text-blue-500"
                          : r.deviation > 0.3 ? "text-red-500"
                          : "text-green-500"
                        }`}>
                          {r.deviation >= 0 ? "+" : ""}{r.deviation.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">{r.weightKg}кг</span>
                        <span className="text-muted-foreground">{SEASON_LABELS[r.season]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
