"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import DoshaRadar from "@/components/DoshaRadar";
import DoshaCard from "@/components/DoshaCard";
import { ButtonLink } from "@/components/ui/button-link";
import { InfoItem } from "@/components/InfoPanel";
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
  khii_excess:        { label: "Хий арвидсан",       light: "bg-surface-container-low", text: "text-primary",   dot: "bg-primary"   },
  balanced:           { label: "Тэнцвэртэй",          light: "bg-surface-container-low", text: "text-primary",   dot: "bg-primary-container" },
  shar_badgan_excess: { label: "Шар/Бадган арвидсан", light: "bg-surface-container-low", text: "text-secondary", dot: "bg-secondary" },
};

const ACTION_CARDS = [
  {
    href: "/calculator",
    icon: "⚖",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "BEDI Тооцоолол",
    desc: "Өнөөдрийн жингээ оруулж биоэнергетик доша индексийг тооцоол",
    cta: "ТООЦООЛОХ →",
    ctaColor: "text-primary",
  },
  {
    href: "/recommendations",
    icon: "✦",
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
    title: "Ерөндөгийн Зөвлөмж",
    desc: "Таны доша байдалд тохирсон хоол хүнс ба амьдралын зөвлөмж",
    cta: "ЗӨВЛӨМЖ ХАРАХ →",
    ctaColor: "text-secondary",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((data: Profile[]) => {
        if (!Array.isArray(data)) return;
        setProfiles(data);
        const self = data.find((p) => p.relationship === "self") ?? data[0];
        setSelected(self ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const latest    = selected?.bediRecords?.[0];
  const statusCfg = latest ? STATUS_CONFIG[latest.status as keyof typeof STATUS_CONFIG] : null;

  // Historical bar chart data — oldest → newest (left → right)
  const recentRecords = [...(selected?.bediRecords ?? [])].reverse().slice(-7);
  const maxBedi = recentRecords.length > 0 ? Math.max(...recentRecords.map((r) => r.bedi), 1) : 1;

  // Map a 0–100 percentage to a discrete Tailwind height class (container is h-16)
  function barH(pct: number): string {
    if (pct < 15) return "h-2";
    if (pct < 28) return "h-4";
    if (pct < 41) return "h-6";
    if (pct < 54) return "h-8";
    if (pct < 67) return "h-10";
    if (pct < 80) return "h-12";
    if (pct < 92) return "h-14";
    return "h-16";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-on-surface-variant">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="relative overflow-hidden bg-surface-container-lowest rounded-3xl shadow-ambient px-8 py-6">
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-8 right-20 w-24 h-24 bg-secondary/5 rounded-full pointer-events-none" />

        <div className="flex items-center justify-between gap-4 relative">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/50 mb-1.5">
              Bio-Dosha-12 · Хяналтын самбар
            </p>
            <h1 className="font-headline text-3xl font-black text-on-surface tracking-tight leading-tight">
              Сайн байна уу,<br />
              <span className="text-primary">{session?.user?.name}</span>!
            </h1>
            {latest && (
              <p className="text-on-surface-variant text-sm mt-2 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${latest.deviation > 0.3 ? "bg-secondary" : "bg-primary"} animate-pulse`} />
                Сүүлийн хэмжилт: {new Date(latest.date).toLocaleDateString("mn-MN", { month: "long", day: "numeric" })}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <ButtonLink href="/calculator" size="sm">
              <span className="mr-1.5">+</span> Тооцоолол
            </ButtonLink>
            {!selected?.doshaType && (
              <ButtonLink variant="outline" href="/calculator?tab=assessment" size="sm">Үнэлгээ</ButtonLink>
            )}
          </div>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient text-center py-20 px-8">
          <p className="text-5xl mb-4">🌿</p>
          <p className="text-lg font-semibold text-on-surface">Профайл үүсгэгдээгүй байна</p>
          <p className="text-sm text-on-surface-variant mt-1 mb-6">12 асуултын үнэлгээ хийж эхэл</p>
          <ButtonLink href="/calculator?tab=assessment">Үнэлгээ эхлүүлэх</ButtonLink>
        </div>
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
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selected?.id === p.id
                      ? "bg-primary text-on-primary shadow-ambient"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Status banner */}
          {latest && statusCfg && (
            <div className={`flex items-center justify-between px-5 py-3.5 rounded-2xl ${statusCfg.light}`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusCfg.dot} ring-4 ring-current ring-opacity-20`} />
                <span className={`font-bold ${statusCfg.text}`}>{statusCfg.label}</span>
                <span className="text-on-surface-variant text-sm">
                  Δ {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                <span>{SEASON_LABELS[latest.season]}</span>
                <span>{new Date(latest.date).toLocaleDateString("mn-MN")}</span>
              </div>
            </div>
          )}

          {/* ── Main bento grid (12-col) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Radar card — 5/12 */}
            <div className="lg:col-span-5">
              <div className="bg-surface-container-lowest rounded-3xl shadow-ambient overflow-hidden h-full relative group">
                {/* Decorative corner arc */}
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-primary/5 rounded-full transition-transform duration-700 group-hover:scale-125 pointer-events-none" />

                {latest && selected?.doshaType ? (
                  <>
                    <div className="px-6 pt-6 pb-1">
                      <p className="text-xs uppercase tracking-[0.15em] font-bold text-primary">
                        Доша байдал тэнцвэр
                      </p>
                    </div>
                    <div className="flex justify-center px-4 pb-2">
                      <DoshaRadar
                        doshaKey={selected.doshaType as DoshaKey}
                        deviation={latest.deviation}
                        size={320}
                        compact
                      />
                    </div>
                    <div className="grid grid-cols-3 bg-surface-container-low">
                      <div className="py-3.5 text-center">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold">BEDI</p>
                        <p className="font-headline text-xl font-bold text-on-surface">{latest.bedi.toFixed(2)}</p>
                      </div>
                      <div className="py-3.5 text-center">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold">Жин</p>
                        <p className="font-headline text-xl font-bold text-on-surface">{latest.weightKg} кг</p>
                      </div>
                      <div className="py-3.5 text-center">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold">Улирал</p>
                        <p className="font-headline text-xl font-bold text-on-surface">{SEASON_LABELS[latest.season]}</p>
                      </div>
                    </div>
                  </>
                ) : latest ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-center px-6">
                    <p className="text-on-surface-variant text-sm">Үнэлгээ хийгдэж Kt тодорхойлогдоогүй байна</p>
                    <ButtonLink size="sm" href="/calculator?tab=assessment">Үнэлгээ өгөх</ButtonLink>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-center px-6">
                    <p className="text-4xl">📊</p>
                    <p className="text-on-surface-variant font-medium">Тооцоолол хийгдэж байна...</p>
                    <ButtonLink size="sm" href="/calculator">Тооцоолол хийх</ButtonLink>
                  </div>
                )}
              </div>
            </div>

            {/* Right column — 7/12 */}
            <div className="lg:col-span-7 flex flex-col gap-4">

              {/* Dosha card */}
              {selected?.doshaType ? (
                <DoshaCard doshaKey={selected.doshaType as DoshaKey} kt={selected.ktScore ?? 1.0} />
              ) : (
                <div className="bg-surface-container-lowest rounded-3xl flex flex-col items-center justify-center py-10 text-center gap-3 px-6 shadow-ambient">
                  <p className="text-4xl">🌀</p>
                  <p className="font-semibold text-on-surface">Махбодийн үнэлгээ хийгдээгүй</p>
                  <p className="text-sm text-on-surface-variant">12 асуулт хариулж Kt коэффициентийг тодорхойлно</p>
                  <ButtonLink href="/calculator?tab=assessment">Үнэлгээ эхлүүлэх</ButtonLink>
                </div>
              )}

              {/* Metric cards — BEDI + Deviation */}
              {latest && (
                <div className="grid grid-cols-2 gap-3">
                  {/* BEDI index */}
                  <div className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
                    <div className="bg-primary/5 px-4 py-2 border-b border-primary/8 flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">BEDI Индекс</p>
                      <span className="w-5 h-5 bg-primary/10 rounded-md flex items-center justify-center text-[9px] font-black text-primary">Б</span>
                    </div>
                    <div className="p-4 space-y-2.5">
                      <span className="font-headline text-3xl font-black text-on-surface">{latest.bedi.toFixed(2)}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={i}
                            className={`flex-1 h-1.5 rounded-full transition-colors ${
                              i < Math.round(Math.min(10, (latest.bedi / 30) * 10))
                                ? "bg-primary"
                                : "bg-surface-container-high"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Deviation — bidirectional bar */}
                  <div className={`bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden`}>
                    <div className={`${latest.deviation > 0.3 ? "bg-secondary/5 border-secondary/8" : "bg-primary/5 border-primary/8"} px-4 py-2 border-b flex items-center justify-between`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${latest.deviation > 0.3 ? "text-secondary" : "text-primary"}`}>Хазайлт (Δ)</p>
                      <span className={`w-5 h-5 ${latest.deviation > 0.3 ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"} rounded-md flex items-center justify-center text-[9px] font-black`}>Δ</span>
                    </div>
                    <div className="p-4 space-y-2.5">
                      <span className={`font-headline text-3xl font-black ${latest.deviation > 0.3 ? "text-secondary" : "text-primary"}`}>
                        {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => {
                          const khiiSegs = Math.round(Math.abs(Math.min(0, latest.deviation)) * 5);
                          const sharSegs = Math.round(Math.max(0, latest.deviation) * 5);
                          const khiiFilled = i < 5 && (4 - i) < khiiSegs;
                          const sharFilled = i >= 5 && (i - 5) < sharSegs;
                          return (
                            <div
                              key={i}
                              className={`flex-1 h-1.5 rounded-full ${
                                khiiFilled ? "bg-primary"
                                : sharFilled ? "bg-secondary"
                                : "bg-surface-container-high"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Historical mini bar chart */}
              {recentRecords.length > 0 && (
                <div className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 bg-surface-container-low">
                    <span className="text-xs font-bold text-on-surface">BEDI Хандлага</span>
                    {recentRecords.length > 1 && (
                      <span className="text-xs font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                        {(recentRecords[recentRecords.length - 1].bedi - recentRecords[0].bedi >= 0 ? "+" : "")}
                        {(recentRecords[recentRecords.length - 1].bedi - recentRecords[0].bedi).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="px-5 pb-4 pt-6">
                    <div className="h-16 flex items-end gap-1.5">
                      {recentRecords.map((r, i) => {
                        const isLatest = i === recentRecords.length - 1;
                        const pct = Math.max(8, (r.bedi / maxBedi) * 100);
                        return (
                          <div key={r.id} className="flex-1 flex flex-col items-end gap-0 relative">
                            {isLatest && (
                              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-primary tracking-wider">ОДОО</span>
                            )}
                            <div
                              className={`w-full rounded-t-md transition-all ${barH(pct)} ${
                                isLatest ? "bg-primary" : "bg-surface-container-highest"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Priority Actions */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-headline text-xl font-bold text-on-surface">Хурдан үйлдэл</h2>
              <ButtonLink href="/recommendations" size="sm" variant="ghost" className="text-primary font-semibold">
                Бүгдийг харах →
              </ButtonLink>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACTION_CARDS.map(({ href, icon, iconBg, iconColor, title, desc, cta, ctaColor }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-start gap-5 p-7 bg-surface-container-lowest rounded-3xl shadow-ambient hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 no-underline"
                >
                  <div className={`shrink-0 w-12 h-12 ${iconBg} rounded-full flex items-center justify-center ${iconColor} text-xl font-black`}>
                    {icon}
                  </div>
                  <div>
                    <p className="font-headline font-bold text-on-surface text-base">{title}</p>
                    <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{desc}</p>
                    <p className={`text-xs font-bold ${ctaColor} tracking-widest uppercase mt-3`}>{cta}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </>
      )}

      {/* BEDI Reference — inline grid, no horizontal space stolen */}
      <div className="bg-surface-container-low rounded-2xl p-5 border border-primary/5">
        <div className="flex items-center gap-1.5 text-secondary mb-3">
          <span className="text-xs">✦</span>
          <span className="font-bold text-[10px] uppercase tracking-wider">Системийн тайлбар</span>
        </div>
        <h2 className="font-headline font-bold text-on-surface text-sm mb-1">BEDI Индекс гэж юу вэ?</h2>
        <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
          Bio-Energetic Dosha Index — жин, өндөр, нас, улирал, махбодийн Kt коэффициентийг нэгтгэн тооцоолсон үзүүлэлт.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <InfoItem
            iconBg="bg-primary/10" iconColor="text-primary" icon="⚖"
            title="Тэнцвэртэй — Δ ∈ [−0.3, +0.3]"
            body="Биеийн доша тэнцвэртэй байна. Одоогийн хэв маягаа хадгалаарай."
          />
          <InfoItem
            iconBg="bg-primary/10" iconColor="text-primary" icon="💨"
            title="Хий арвидсан — Δ < −0.3"
            body="Хий (Вата) давамгайлж байна. Дулаалга, тосолгоо, амрах горим шаардлагатай."
          />
          <InfoItem
            iconBg="bg-secondary/10" iconColor="text-secondary" icon="🔥"
            title="Шар/Бадган — Δ > +0.3"
            body="Шар (Питта) эсвэл Бадган (Капха) арвидсан. Хоол горим, хөргөх дасгал хэрэгтэй."
          />
        </div>
        <p className="text-[10px] text-on-surface-variant/60 mt-4 italic leading-relaxed border-t border-surface-container-high pt-3">
          Kt коэффициент нь 12 асуулт бүхий үнэлгээгээр нэг удаа тодорхойлогдоно.
        </p>
      </div>

    </div>
  );
}
