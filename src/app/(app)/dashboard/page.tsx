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
  khii_excess:       { label: "Хий арвидсан",      bg: "bg-blue-500",    light: "bg-blue-50 border-blue-200",   text: "text-blue-700"   },
  balanced:          { label: "Тэнцвэртэй",         bg: "bg-emerald-500", light: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  shar_badgan_excess:{ label: "Шар/Бадган арвидсан",bg: "bg-red-500",     light: "bg-red-50 border-red-200",     text: "text-red-700"    },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [profiles, setProfiles]   = useState<Profile[]>([]);
  const [selected, setSelected]   = useState<Profile | null>(null);
  const [loading, setLoading]     = useState(true);

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

  const latest = selected?.bediRecords?.[0];
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
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Сайн байна уу, {session?.user?.name}!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Bio-Dosha-12 хяналтын самбар</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <ButtonLink href="/calculator" size="sm">Тооцоолол</ButtonLink>
          {!selected?.doshaType && (
            <ButtonLink variant="outline" href="/assessment" size="sm">Үнэлгээ</ButtonLink>
          )}
        </div>
      </div>

      {profiles.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <CardContent className="space-y-4">
            <div className="text-4xl">🌿</div>
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
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
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
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${statusCfg.light}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${statusCfg.bg}`} />
                <span className={`text-sm font-semibold ${statusCfg.text}`}>
                  {statusCfg.label}
                </span>
                <span className="text-sm text-slate-500">
                  — Δ {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(latest.date).toLocaleDateString("mn-MN")}
              </span>
            </div>
          )}

          {/* Hero Radar Section */}
          <Card className="border-slate-200 overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              {latest && selected?.doshaType ? (
                <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
                  {/* Radar — hero size */}
                  <div className="flex-shrink-0">
                    <DoshaRadar
                      doshaKey={selected.doshaType as DoshaKey}
                      deviation={latest.deviation}
                      size={360}
                    />
                  </div>
                  {/* Side stats */}
                  <div className="flex flex-col gap-4 w-full lg:w-auto lg:min-w-[220px]">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">BEDI индекс</p>
                      <p className="text-4xl font-bold text-slate-800">{latest.bedi.toFixed(2)}</p>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Улирал</p>
                        <p className="text-lg font-semibold text-slate-700">{SEASON_LABELS[latest.season]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Жин</p>
                        <p className="text-lg font-semibold text-slate-700">
                          {latest?.weightKg ? `${latest.weightKg} кг` : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Нийт тооцоолол</p>
                        <p className="text-lg font-semibold text-slate-700">{selected?.bediRecords?.length ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Гэр бүл</p>
                        <p className="text-lg font-semibold text-slate-700">
                          {profiles.filter((p) => p.relationship !== "self").length}
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <ButtonLink href="/calculator" size="sm" className="flex-1">
                        Шинэ тооцоолол
                      </ButtonLink>
                      <ButtonLink href="/recommendations" variant="outline" size="sm" className="flex-1">
                        Ерөндөг харах
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              ) : latest ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Үнэлгээ хийгдээгүй</p>
                  <ButtonLink size="sm" href="/assessment">Үнэлгээ өгөх</ButtonLink>
                </div>
              ) : (
                <div className="py-10 text-center space-y-3">
                  <p className="text-3xl">📊</p>
                  <p className="text-sm text-muted-foreground">Тооцоолол хийгдэж байна...</p>
                  <ButtonLink size="sm" href="/calculator">Тооцоолол хийх</ButtonLink>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dosha Card */}
          {selected?.doshaType ? (
            <DoshaCard
              doshaKey={selected.doshaType as DoshaKey}
              kt={selected.ktScore ?? 1.0}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center space-y-3">
                <p className="text-3xl">🌀</p>
                <p className="text-slate-500 font-medium">Махбодийн үнэлгээ хийгдээгүй байна</p>
                <p className="text-sm text-muted-foreground">12 асуулт хариулж таны Kt коэффициентийг тодорхойлно</p>
                <ButtonLink href="/assessment">12 асуултын үнэлгээ өгөх</ButtonLink>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
