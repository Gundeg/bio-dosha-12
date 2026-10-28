import { useTranslations } from "next-intl";
import { DOSHA_MAP, DoshaKey } from "@/lib/ktMapping";
import { cn } from "@/lib/utils";

interface DoshaCardProps {
  doshaKey: DoshaKey;
  kt: number;
}

/** Colour of the leading dosha (the first part of the key). */
function leadColor(doshaKey: DoshaKey): string {
  if (doshaKey === "Tentsveertei") return "bg-emerald-600";
  if (doshaKey.startsWith("Khii")) return "bg-primary";
  if (doshaKey.startsWith("Shar")) return "bg-secondary";
  return "bg-tertiary";
}

const KT_MIN = 0.7;
const KT_MAX = 1.5;

/** Where Kt sits on the 0.70–1.50 scale, as a percentage. */
function ktToPercent(kt: number) {
  return Math.min(100, Math.max(0, ((kt - KT_MIN) / (KT_MAX - KT_MIN)) * 100));
}

export default function DoshaCard({ doshaKey, kt }: DoshaCardProps) {
  const t = useTranslations("help.doshaCard");
  const tDosha = useTranslations("dosha");
  const tShared = useTranslations("shared");

  if (!DOSHA_MAP[doshaKey]) return null;

  const qualities = tDosha.raw(`${doshaKey}.qualities`) as string[];
  const risks = tDosha.raw(`${doshaKey}.risks`) as string[];

  return (
    <div className="rounded-xl bg-surface-container-lowest shadow-ambient">
      <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-on-surface">
            <span className={cn("size-2.5 shrink-0 rounded-full", leadColor(doshaKey))} aria-hidden="true" />
            {tDosha(`${doshaKey}.label`)}
          </h2>
          <p className="mt-0.5 text-sm text-on-surface-variant">{t("constitution")}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-on-surface-variant">{t("kt")}</p>
          <p className="text-lg font-semibold tabular-nums text-on-surface">{kt.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        {/* Kt scale (visual only; the value is shown above) */}
        <div aria-hidden="true">
          <div className="relative h-1.5 rounded-full bg-surface-container">
            <span
              className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-container-lowest bg-primary"
              style={{ left: `${ktToPercent(kt)}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-on-surface-variant">
            <span>{tShared("dosha3.H")} 0.70</span>
            <span>{tShared("dosha3.B")} 1.50</span>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-on-surface-variant">{tDosha(`${doshaKey}.description`)}</p>

        <div>
          <p className="mb-2 text-sm font-medium text-on-surface">{t("qualities")}</p>
          <ul className="flex flex-wrap gap-1.5">
            {qualities.map((q) => (
              <li key={q} className="rounded-md bg-surface-container-low px-2 py-1 text-xs text-on-surface">
                {q}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-on-surface">{t("risks")}</p>
          <ul className="flex flex-wrap gap-1.5">
            {risks.map((r) => (
              <li key={r} className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-900">
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
