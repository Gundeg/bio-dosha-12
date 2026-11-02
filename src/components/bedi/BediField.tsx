"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import DoshaRadar from "@/components/DoshaRadar";
import type { BEDIStatus } from "@/lib/bediEngine";
import { displaceForDeviation, trailTrend } from "@/lib/bediField";
import { formatDate } from "@/lib/formatDate";
import { DOSHA_MAP, type DoshaKey } from "@/lib/ktMapping";
import { cn } from "@/lib/utils";
import type { FieldHistoryPoint, FieldLabels } from "./BediFieldScene";

const BediFieldScene = dynamic(() => import("./BediFieldScene"), {
  ssr: false,
  loading: () => <FieldPlaceholder />,
});

function FieldPlaceholder() {
  const t = useTranslations("shared.field3d");
  return (
    <div className="flex aspect-[16/11] w-full items-center justify-center rounded-lg bg-surface-container-low text-xs text-on-surface-variant">
      {t("loading")}
    </div>
  );
}

export interface BediFieldHistoryRecord {
  date: string | Date;
  deviation: number;
  status: string;
}

export interface BediFieldProps {
  doshaKey: DoshaKey;
  deviation: number;
  status: BEDIStatus | string;
  /** Earlier measurements, oldest first, without the current one. */
  history?: BediFieldHistoryRecord[];
  className?: string;
}

const isStatus = (v: unknown): v is BEDIStatus =>
  v === "khii_excess" || v === "balanced" || v === "shar_badgan_excess";

const fmtSigned = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}`;

/**
 * The махбод field in 3D: constitution pin, current ball moved by the BEDI
 * deviation, trail of earlier measurements. Loads three.js only on the client;
 * falls back to the 2D radar when WebGL is unavailable.
 */
export function BediField({ doshaKey, deviation, status, history = [], className }: BediFieldProps) {
  const t = useTranslations("shared.field3d");
  const tShared = useTranslations("shared");
  const locale = useLocale();
  const [unsupported, setUnsupported] = useState(false);
  const onUnsupported = useCallback(() => setUnsupported(true), []);

  const resolved: BEDIStatus = isStatus(status) ? status : "balanced";
  const zoneName = useCallback(
    (key: DoshaKey) => (locale === "en" ? DOSHA_MAP[key].labelEn : DOSHA_MAP[key].label),
    [locale]
  );

  const trail = useMemo<FieldHistoryPoint[]>(
    () =>
      history
        .filter((h) => isStatus(h.status))
        .map((h) => ({
          label: formatDate(h.date, locale, "monthDay"),
          deviation: h.deviation,
          status: h.status as BEDIStatus,
        })),
    [history, locale]
  );

  const labels = useMemo<FieldLabels>(() => {
    const zoneNames = Object.fromEntries(
      (Object.keys(DOSHA_MAP) as DoshaKey[]).map((k) => [k, zoneName(k)])
    ) as Record<DoshaKey, string>;
    const cur = displaceForDeviation(doshaKey, deviation, resolved);
    const trend = trailTrend(trail.map((h) => h.deviation), deviation);
    const trailText =
      trend === "none"
        ? t("trailNone")
        : t(trend === "closer" ? "trailCloser" : trend === "farther" ? "trailFarther" : "trailSame", { count: trail.length });
    const statusLabel = tShared(`status.${resolved}`);
    return {
      pin: t("pin", { zone: zoneName(doshaKey) }),
      now: t("now", { status: statusLabel }),
      aria: t("aria", {
        constitution: zoneName(doshaKey),
        deviation: fmtSigned(deviation),
        status: statusLabel,
        zone: zoneName(cur.zone),
        trail: trailText,
      }),
      viewTop: t("viewTop"),
      viewSide: t("viewSide"),
      hint: t("hint"),
      zoneNames,
    };
  }, [doshaKey, deviation, resolved, trail, t, tShared, zoneName]);

  if (unsupported) {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <p className="text-xs text-on-surface-variant">{t("noWebgl")}</p>
        <DoshaRadar doshaKey={doshaKey} deviation={deviation} status={resolved} size={280} compact />
      </div>
    );
  }

  return (
    <div className={className}>
      <BediFieldScene
        doshaKey={doshaKey}
        deviation={deviation}
        status={resolved}
        history={trail}
        labels={labels}
        onUnsupported={onUnsupported}
      />
    </div>
  );
}
