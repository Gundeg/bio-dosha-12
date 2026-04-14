"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Area, AreaChart,
} from "recharts";
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
  khii_excess:        { label: "Хий арвидсан",       color: "#00626b", bg: "bg-primary/10",   text: "text-primary"   },
  balanced:           { label: "Тэнцвэртэй",          color: "#00626b", bg: "bg-primary/10",   text: "text-primary"   },
  shar_badgan_excess: { label: "Шар/Бадган",          color: "#904d00", bg: "bg-secondary/10", text: "text-secondary" },
};

const SEASON_LABELS: Record<string, string> = {
  WINTER: "Өвөл", SPRING: "Хавар", SUMMER: "Зун", AUTUMN: "Намар",
};

const SEASON_ICON: Record<string, string> = {
  WINTER: "❄", SPRING: "🌸", SUMMER: "☀", AUTUMN: "🍂",
};

// Custom tooltip component for the chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value as number;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-4 py-3 shadow-ambient text-sm">
      <p className="text-on-surface-variant text-xs mb-1">{label}</p>
      <p className={`font-headline text-xl font-bold ${val > 0.3 ? "text-secondary" : "text-primary"}`}>
        {val >= 0 ? "+" : ""}{val.toFixed(2)}
      </p>
      <p className="text-[11px] text-on-surface-variant mt-0.5">хазайлт (Δ)</p>
    </div>
  );
}

export default function HistoryPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [records, setRecords] = useState<BEDIRecord[] | null>(null);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((data: Profile[]) => {
        if (!Array.isArray(data)) return;
        setProfiles(data);
        if (data.length > 0) setSelectedId(data[0].id);
        else setRecords([]);
      })
      .catch(() => setRecords([]));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/bedi?profileId=${selectedId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRecords(data); })
      .catch(() => setRecords([]));
  }, [selectedId]);

  const chartData = [...(records ?? [])]
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
    const rows = (records ?? []).map((r) =>
      `${new Date(r.date).toLocaleDateString()},${r.bedi},${r.deviation},${r.weightKg},${SEASON_LABELS[r.season]},${STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG]?.label ?? r.status}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bedi-history.csv";
    a.click();
  }

  // Trend summary
  const trend = records && records.length >= 2
    ? records[0].deviation - records[records.length - 1].deviation
    : null;

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-1">
            BEDI протокол · Хандлага
          </p>
          <h1 className="font-headline text-3xl font-black text-on-surface tracking-tight">
            BEDI Түүх
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">Хазайлтын динамик хандлага</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {profiles.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {profiles.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedId === p.id
                      ? "bg-primary text-on-primary shadow-ambient"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
          <Button variant="outline" onClick={exportCSV} disabled={(records?.length ?? 0) === 0}>
            <span className="material-symbols-outlined text-[16px] mr-1.5">download</span>
            CSV татах
          </Button>
        </div>
      </div>

      {records === null ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-on-surface-variant">Ачааллаж байна...</p>
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient text-center py-20 px-8">
          <p className="text-5xl mb-4">📈</p>
          <p className="text-lg font-semibold text-on-surface">Тооцооллын түүх байхгүй байна</p>
          <p className="text-sm text-on-surface-variant mt-1">Эхлээд BEDI тооцоолол хийнэ үү.</p>
        </div>
      ) : (
        <>
          {/* ── Summary stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Нийт хэмжилт",
                value: records.length.toString(),
                sub: "удаа",
                color: "text-on-surface",
              },
              {
                label: "Сүүлийн хазайлт",
                value: `${records[0].deviation >= 0 ? "+" : ""}${records[0].deviation.toFixed(2)}`,
                sub: "Δ",
                color: records[0].deviation > 0.3 ? "text-secondary" : "text-primary",
              },
              {
                label: "Сүүлийн BEDI",
                value: records[0].bedi.toFixed(2),
                sub: "индекс",
                color: "text-on-surface",
              },
              {
                label: "Хандлага",
                value: trend !== null ? `${trend >= 0 ? "+" : ""}${trend.toFixed(2)}` : "—",
                sub: trend !== null ? (trend > 0 ? "нэмэгдсэн" : "буурсан") : "",
                color: trend !== null && trend > 0.1 ? "text-secondary" : "text-primary",
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface-container-lowest rounded-2xl shadow-ambient p-4">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold mb-1">{stat.label}</p>
                <p className={`font-headline text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                {stat.sub && <p className="text-[11px] text-on-surface-variant">{stat.sub}</p>}
              </div>
            ))}
          </div>

          {/* ── Deviation chart ── */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient overflow-hidden">
            <div className="px-6 py-5 border-b border-surface-container-high flex items-center justify-between">
              <div>
                <h2 className="font-headline font-bold text-on-surface">Хазайлт (Δ) хандлага</h2>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Цагийн хэмжилтийн динамик</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-on-surface-variant">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-secondary inline-block rounded" /> Шар/Бадган (&gt;+0.3)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary inline-block rounded" /> Хий (&lt;−0.3)</span>
              </div>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="deviationGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00626b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#00626b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5eeff" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#3e494a" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[-1, 1]} tick={{ fontSize: 11, fill: "#3e494a" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#bdc8ca" strokeWidth={1} />
                  <ReferenceLine y={0.3} stroke="#904d00" strokeDasharray="4 4" strokeOpacity={0.6}
                    label={{ value: "+0.3", fontSize: 10, fill: "#904d00", position: "right" }} />
                  <ReferenceLine y={-0.3} stroke="#00626b" strokeDasharray="4 4" strokeOpacity={0.6}
                    label={{ value: "−0.3", fontSize: 10, fill: "#00626b", position: "right" }} />
                  <Area
                    type="monotone"
                    dataKey="deviation"
                    stroke="#00626b"
                    strokeWidth={2.5}
                    fill="url(#deviationGrad)"
                    dot={{ r: 4, fill: "#fff", stroke: "#00626b", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#00626b" }}
                    name="Хазайлт (Δ)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Record list ── */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient overflow-hidden">
            <div className="px-6 py-5 border-b border-surface-container-high">
              <h2 className="font-headline font-bold text-on-surface">Дэлгэрэнгүй бүртгэл</h2>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{records.length} хэмжилт хадгалагдсан</p>
            </div>
            <div className="divide-y divide-surface-container-high">
              {records.map((r, idx) => {
                const sc = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG];
                const isLatest = idx === 0;
                return (
                  <div key={r.id} className={`flex items-center justify-between px-6 py-4 gap-4 transition-colors hover:bg-surface-container-low/50 ${isLatest ? "bg-surface-container-low/30" : ""}`}>
                    {/* Date + season */}
                    <div className="flex items-center gap-3 min-w-0 shrink-0">
                      <div className="text-center">
                        <p className="text-[10px] text-on-surface-variant font-medium">
                          {new Date(r.date).toLocaleDateString("mn-MN", { month: "short" })}
                        </p>
                        <p className="font-headline text-base font-bold text-on-surface leading-tight">
                          {new Date(r.date).getDate()}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm">{SEASON_ICON[r.season] ?? ""}</span>
                        <span className="text-xs text-on-surface-variant ml-1">{SEASON_LABELS[r.season]}</span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${sc?.bg ?? "bg-surface-container"} ${sc?.text ?? "text-on-surface-variant"}`}>
                      {sc?.label ?? r.status}
                      {isLatest && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                    </span>

                    {/* BEDI + deviation */}
                    <div className="flex items-center gap-5 ml-auto">
                      <div className="text-right">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold">BEDI</p>
                        <p className="font-headline text-base font-bold text-on-surface">{r.bedi.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold">Δ</p>
                        <p className={`font-headline text-base font-bold ${
                          r.deviation < -0.3 ? "text-primary"
                          : r.deviation > 0.3 ? "text-secondary"
                          : "text-on-surface"
                        }`}>
                          {r.deviation >= 0 ? "+" : ""}{r.deviation.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold">Жин</p>
                        <p className="font-medium text-sm text-on-surface">{r.weightKg} кг</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
