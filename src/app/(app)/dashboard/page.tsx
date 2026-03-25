"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DoshaRadar from "@/components/DoshaRadar";
import DoshaCard from "@/components/DoshaCard";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { DoshaKey } from "@/lib/ktMapping";

interface Profile {
  id: string;
  name: string;
  relationship: string;
  doshaType: string | null;
  ktScore: number | null;
  bediRecords: Array<{
    id: string;
    date: string;
    bedi: number;
    deviation: number;
    status: string;
    weightKg: number;
    season: string;
  }>;
}

const SEASON_LABELS: Record<string, string> = {
  WINTER: "Өвөл", SPRING: "Хавар", SUMMER: "Зун", AUTUMN: "Намар",
};

const STATUS_CONFIG = {
  khii_excess:        { label: "Хий арвидсан",       bg: "bg-blue-500",    light: "bg-blue-50 border-blue-200",        text: "text-blue-700"    },
  balanced:           { label: "Тэнцвэртэй",          bg: "bg-emerald-500", light: "bg-emerald-50 border-emerald-200",  text: "text-emerald-700" },
  shar_badgan_excess: { label: "Шар/Бадган арвидсан", bg: "bg-red-500",     light: "bg-red-50 border-red-200",          text: "text-red-700"     },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((data: Profile[]) => {
        setProfiles(data);
        const self = data.find((p) => p.relationship === "self") ?? data[0];
        setSelected(self ?? null);
        setLoading(false);
      });
  }, []);

  const latest    = selected?.bediRecords?.[0];
  const statusCfg = latest ? STATUS_CONFIG[latest.status as keyof typeof STATUS_CONFIG] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Сайн байна уу, {session?.user?.name}!
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Bio-Dosha-12 хяналтын самбар</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <ButtonLink href="/calculator" size="sm">+ Тооцоолол</ButtonLink>
          {!selected?.doshaType && (
            <ButtonLink variant="outline" href="/assessment" size="sm">Үнэлгээ</ButtonLink>
          )}
        </div>
      </div>

      {profiles.length === 0 ? (
        <Card className="text-center py-20 border-dashed">
          <CardContent className="space-y-4">
            <p className="text-5xl">🌿</p>
            <p className="text-lg font-medium text-slate-600">Профайл үүсгэгдээгүй байна</p>
            <p className="text-sm text-muted-foreground">12 асуултын үнэлгээ хийж эхэл</p>
            <ButtonLink href="/assessment">Үнэлгээ эхлүүлэх</ButtonLink>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Profile selector */}
          {profiles.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selected?.id === p.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Status banner */}
          {latest && statusCfg && (
            <div className={`flex items-center justify-between px-5 py-3.5 rounded-2xl border-2 ${statusCfg.light}`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusCfg.bg} ring-4 ring-current ring-opacity-20`} />
                <span className={`font-bold ${statusCfg.text}`}>{statusCfg.label}</span>
                <span className="text-slate-400 text-sm">
                  Δ {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>{SEASON_LABELS[latest.season]}</span>
                <span>{new Date(latest.date).toLocaleDateString("mn-MN")}</span>
              </div>
            </div>
          )}

          {/* Main grid — radar wider on left, info on right */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* ── Radar card (2/5 width) ── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
                {latest && selected?.doshaType ? (
                  <>
                    {/* Radar fills the card */}
                    <div className="flex justify-center pt-6 pb-2 px-4">
                      <DoshaRadar
                        doshaKey={selected.doshaType as DoshaKey}
                        deviation={latest.deviation}
                        size={340}
                        compact
                      />
                    </div>

                    {/* Stats strip at bottom of radar card */}
                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
                      <div className="py-3 text-center">
                        <p className="text-[11px] text-slate-400 uppercase tracking-wide">BEDI</p>
                        <p className="text-lg font-bold text-slate-800">{latest.bedi.toFixed(2)}</p>
                      </div>
                      <div className="py-3 text-center">
                        <p className="text-[11px] text-slate-400 uppercase tracking-wide">Жин</p>
                        <p className="text-lg font-bold text-slate-800">{latest.weightKg} кг</p>
                      </div>
                      <div className="py-3 text-center">
                        <p className="text-[11px] text-slate-400 uppercase tracking-wide">Улирал</p>
                        <p className="text-lg font-bold text-slate-800">{SEASON_LABELS[latest.season]}</p>
                      </div>
                    </div>
                  </>
                ) : latest ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-center px-6">
                    <p className="text-slate-400 text-sm">Үнэлгээ хийгдэж Kt тодорхойлогдоогүй байна</p>
                    <ButtonLink size="sm" href="/assessment">Үнэлгээ өгөх</ButtonLink>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-center px-6">
                    <p className="text-4xl">📊</p>
                    <p className="text-slate-500 font-medium">Тооцоолол хийгдэж байна...</p>
                    <ButtonLink size="sm" href="/calculator">Тооцоолол хийх</ButtonLink>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right column (3/5 width) ── */}
            <div className="lg:col-span-3 flex flex-col gap-4">

              {/* Dosha card */}
              {selected?.doshaType ? (
                <DoshaCard
                  doshaKey={selected.doshaType as DoshaKey}
                  kt={selected.ktScore ?? 1.0}
                />
              ) : (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-12 text-center gap-3 px-6">
                  <p className="text-4xl">🌀</p>
                  <p className="font-semibold text-slate-600">Махбодийн үнэлгээ хийгдээгүй</p>
                  <p className="text-sm text-slate-400">12 асуулт хариулж Kt коэффициентийг тодорхойлно</p>
                  <ButtonLink href="/assessment">Үнэлгээ эхлүүлэх</ButtonLink>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Нийт тооцоолол", value: String(selected?.bediRecords?.length ?? 0) },
                  { label: "Гэр бүлийн гишүүд", value: String(profiles.filter((p) => p.relationship !== "self").length) },
                  { label: "Сүүлийн жин", value: latest?.weightKg ? `${latest.weightKg} кг` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-xl border border-slate-200 py-4 text-center shadow-sm">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <ButtonLink
                  href="/calculator"
                  variant="outline"
                  className="h-12 text-sm font-semibold rounded-xl border-slate-200 hover:border-slate-300"
                >
                  ⚖ Шинэ тооцоолол
                </ButtonLink>
                <ButtonLink
                  href="/recommendations"
                  variant="outline"
                  className="h-12 text-sm font-semibold rounded-xl border-slate-200 hover:border-slate-300"
                >
                  ✦ Ерөндөг харах
                </ButtonLink>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
