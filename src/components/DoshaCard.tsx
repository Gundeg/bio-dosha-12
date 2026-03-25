import { DOSHA_MAP, DoshaKey } from "@/lib/ktMapping";

interface DoshaCardProps {
  doshaKey: DoshaKey;
  kt: number;
}

// Dosha-specific gradient headers and accent colors
const DOSHA_THEME: Record<string, { gradient: string; accent: string; dot: string }> = {
  Khii:         { gradient: "from-blue-500 to-sky-400",       accent: "bg-blue-50 text-blue-700 border-blue-200",   dot: "bg-blue-500" },
  Khii_Shar:    { gradient: "from-blue-400 to-amber-400",     accent: "bg-sky-50 text-sky-700 border-sky-200",      dot: "bg-sky-500" },
  Khii_Badgan:  { gradient: "from-blue-400 to-violet-400",    accent: "bg-cyan-50 text-cyan-700 border-cyan-200",   dot: "bg-cyan-500" },
  Shar_Khii:    { gradient: "from-amber-400 to-blue-400",     accent: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-400" },
  Shar:         { gradient: "from-amber-500 to-orange-400",   accent: "bg-amber-50 text-amber-700 border-amber-200",dot: "bg-amber-500" },
  Tentsveertei: { gradient: "from-emerald-500 to-teal-400",   accent: "bg-green-50 text-green-700 border-green-200",dot: "bg-emerald-500" },
  Shar_Badgan:  { gradient: "from-amber-400 to-violet-400",   accent: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  Badgan_Khii:  { gradient: "from-violet-500 to-blue-400",    accent: "bg-slate-50 text-slate-700 border-slate-200",dot: "bg-slate-500" },
  Badgan_Shar:  { gradient: "from-violet-500 to-amber-400",   accent: "bg-stone-50 text-stone-700 border-stone-200",dot: "bg-stone-500" },
  Badgan:       { gradient: "from-violet-600 to-purple-500",  accent: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-violet-500" },
};

// Kt scale: 0.70 to 1.50 → 0% to 100%
function ktToPercent(kt: number) {
  return Math.round(((kt - 0.7) / (1.5 - 0.7)) * 100);
}

export default function DoshaCard({ doshaKey, kt }: DoshaCardProps) {
  const dosha = DOSHA_MAP[doshaKey];
  if (!dosha) return null;

  const theme = DOSHA_THEME[doshaKey] ?? DOSHA_THEME.Tentsveertei;
  const ktPct = ktToPercent(kt);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
      {/* Colored gradient header */}
      <div className={`bg-linear-to-r ${theme.gradient} px-5 py-4`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">{dosha.label}</h2>
            <p className="text-white/70 text-sm mt-0.5">{dosha.labelEn}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs font-medium">Kt коэффициент</p>
            <p className="text-white text-lg font-black">{kt.toFixed(2)}</p>
          </div>
        </div>

        {/* Kt indicator — 10 segments */}
        <div className="mt-3">
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  idx < Math.round(ktPct / 10) ? "bg-white/80" : "bg-white/20"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/50 text-[10px]">Хий (0.70)</span>
            <span className="text-white/50 text-[10px]">Бадган (1.50)</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">{dosha.description}</p>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Шинж чанарууд</p>
          <div className="flex flex-wrap gap-1.5">
            {dosha.qualities.map((q) => (
              <span
                key={q}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${theme.accent}`}
              >
                {q}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Эрсдэлт хүчин зүйл</p>
          <div className="flex flex-wrap gap-1.5">
            {dosha.risks.map((r) => (
              <span
                key={r}
                className="text-xs font-medium px-2.5 py-1 rounded-full border bg-red-50 text-red-600 border-red-200"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
