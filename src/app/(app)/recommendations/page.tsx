"use client";

import { useEffect, useState } from "react";
import RemedyPanel from "@/components/RemedyPanel";
import DoshaCard from "@/components/DoshaCard";
import { calcAge, BEDIStatus } from "@/lib/bediEngine";
import { DoshaKey } from "@/lib/ktMapping";
import { RemedyResult } from "@/lib/remedyEngine";
import { ButtonLink } from "@/components/ui/button-link";

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

const STATUS_META = {
  balanced: {
    label: "Тэнцвэртэй",
    sub: "Гурван доша тэнцвэртэй байна. Одоогийн хэв маягаа хадгалаарай.",
    bg: "bg-primary/6",
    border: "border-primary/20",
    text: "text-primary",
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary",
  },
  khii_excess: {
    label: "Хий арвидсан",
    sub: "Хий (Вата) давамгайлж байна. Дулаалга, амрах горим шаардлагатай.",
    bg: "bg-primary/6",
    border: "border-primary/20",
    text: "text-primary",
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary",
  },
  shar_badgan_excess: {
    label: "Шар/Бадган арвидсан",
    sub: "Шар (Питта) эсвэл Бадган (Капха) давамгайлж байна. Хоол горим, хөргөх дасгал хэрэгтэй.",
    bg: "bg-secondary/6",
    border: "border-secondary/20",
    text: "text-secondary",
    dot: "bg-secondary",
    badge: "bg-secondary/10 text-secondary",
  },
};

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
              adjustedDosePercent:
                rec.validationStatus === "WARNING" ? 70
                : rec.validationStatus === "CONTRAINDICATED" ? 0
                : 100,
            }
          : null,
      }
    : null;

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

  const statusMeta = latest
    ? STATUS_META[latest.status as keyof typeof STATUS_META] ?? STATUS_META.balanced
    : null;

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-1">
            BEDI протокол · Зөвлөмж
          </p>
          <h1 className="font-headline text-3xl font-black text-on-surface tracking-tight">
            Ерөндөг & Зөвлөмж
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Хазайлт болон доша байдал дээр үндэслэсэн алтан ерөндөг
          </p>
        </div>

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
      </div>

      {!latest ? (
        /* ── Empty state ── */
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient text-center py-20 px-8">
          <p className="text-5xl mb-4">🌿</p>
          <p className="text-lg font-semibold text-on-surface">Тооцоолол хийгдээгүй байна</p>
          <p className="text-sm text-on-surface-variant mt-1 mb-6">
            Эхлээд BEDI тооцоолол хийснээр зөвлөмж автоматаар гарна
          </p>
          <ButtonLink href="/calculator">Тооцоолол хийх</ButtonLink>
        </div>
      ) : (
        <>
          {/* ── Status hero card ── */}
          <div className={`relative overflow-hidden rounded-3xl px-7 py-6 border ${statusMeta?.bg} ${statusMeta?.border}`}>
            {/* Decorative circle */}
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-current opacity-[0.04] pointer-events-none" />

            <div className="flex items-center justify-between gap-6 flex-wrap">
              {/* Deviation number */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">
                  Одоогийн BEDI хазайлт
                </p>
                <div className="flex items-baseline gap-3">
                  <span className={`font-headline text-5xl font-black ${statusMeta?.text}`}>
                    {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                  </span>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusMeta?.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusMeta?.dot}`} />
                      {statusMeta?.label}
                    </span>
                    <p className="text-[11px] text-on-surface-variant mt-1.5 max-w-48 leading-snug">
                      {statusMeta?.sub}
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 text-center shrink-0">
                <div className="bg-surface-container-lowest/70 rounded-2xl px-5 py-3">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold mb-1">Нас</p>
                  <p className="font-headline text-2xl font-bold text-on-surface">{age}</p>
                </div>
                <div className="bg-surface-container-lowest/70 rounded-2xl px-5 py-3">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold mb-1">Огноо</p>
                  <p className="text-sm font-semibold text-on-surface">
                    {new Date(latest.date).toLocaleDateString("mn-MN", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Dosha constitution card ── */}
          {profile?.doshaType && (
            <DoshaCard doshaKey={profile.doshaType as DoshaKey} kt={profile.ktScore ?? 1} />
          )}

          {/* ── Remedy panel ── */}
          {remedyResult ? (
            <RemedyPanel status={latest.status as BEDIStatus} remedyResult={remedyResult} />
          ) : (
            <div className="bg-surface-container-lowest rounded-3xl shadow-ambient text-center py-14 px-8">
              <p className="text-3xl mb-3">📋</p>
              <p className="font-semibold text-on-surface">Зөвлөмж байхгүй байна</p>
              <p className="text-sm text-on-surface-variant mt-1 mb-5">
                Шинэ тооцоолол хийснээр зөвлөмж автоматаар үүснэ
              </p>
              <ButtonLink href="/calculator">Тооцоолол хийх</ButtonLink>
            </div>
          )}

          {/* ── Context info strip ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: "💨",
                iconBg: "bg-primary/8",
                iconColor: "text-primary",
                title: "Хий (Vata) давамгайлсан үед",
                body: "Дулаан хоол, тунгалаг тос, амралт зайлшгүй. Хүйтэн, хуурай орчноос зайлс.",
              },
              {
                icon: "⚖",
                iconBg: "bg-surface-container",
                iconColor: "text-on-surface",
                title: "Тэнцвэртэй байхад",
                body: "Одоогийн хэв маягаа хадгалаарай. Улирлын дагуу жижиг тохируулга хийнэ үү.",
              },
              {
                icon: "🔥",
                iconBg: "bg-secondary/8",
                iconColor: "text-secondary",
                title: "Шар/Бадган давамгайлсан үед",
                body: "Хөнгөн хоол, дасгал хөдөлгөөн, хүнд чийглэг хоолноос татгалзах шаардлагатай.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-surface-container-low rounded-2xl p-4 flex items-start gap-3">
                <div className={`shrink-0 w-8 h-8 ${item.iconBg} rounded-lg flex items-center justify-center ${item.iconColor} text-base`}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-bold text-xs text-on-surface mb-0.5">{item.title}</p>
                  <p className="text-[11px] text-on-surface-variant leading-snug">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-on-surface-variant/50 italic text-center pb-2">
            Зөвлөмжийг хэрэгжүүлэхийн өмнө мэргэжлийн эмчтэй зөвлөлдөнө үү.
          </p>
        </>
      )}
    </div>
  );
}
