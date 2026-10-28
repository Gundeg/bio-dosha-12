"use client";

import { useTranslations } from "next-intl";
import { DoshaKey } from "@/lib/ktMapping";
import { BEDI_THRESHOLDS } from "@/lib/bediConfig";
import type { BEDIStatus } from "@/lib/bediEngine";

// Constitutional component proportions [Хий%, Шар%, Бадган%]
// Based on traditional Mongolian medicine dosha theory
const BASE_SCORES: Record<DoshaKey, [number, number, number]> = {
  Khii:         [82, 10,  8],
  Khii_Shar:    [55, 35, 10],
  Khii_Badgan:  [55, 10, 35],
  Shar_Khii:    [30, 60, 10],
  Shar:         [10, 80, 10],
  Tentsveertei: [34, 33, 33],
  Shar_Badgan:  [10, 55, 35],
  Badgan_Khii:  [30, 10, 60],
  Badgan_Shar:  [10, 30, 60],
  Badgan:       [ 8, 10, 82],
};

/** Falls back to the configured band only when the caller has no stored status. */
function statusFromDeviation(deviation: number): BEDIStatus {
  return deviation < BEDI_THRESHOLDS.khiiBelow
    ? "khii_excess"
    : deviation > BEDI_THRESHOLDS.sharBadganAbove
    ? "shar_badgan_excess"
    : "balanced";
}

// Status labels come from the "shared" namespace (shared.status.<status>).
const STATUS_VISUAL: Record<BEDIStatus, { color: string; badge: string }> = {
  khii_excess: { color: "#3b82f6", badge: "bg-blue-600" },
  balanced: { color: "#10b981", badge: "bg-emerald-700" },
  shar_badgan_excess: { color: "#f87171", badge: "bg-red-600" },
};

function applyDeviation(
  base: [number, number, number],
  deviation: number,
  status: BEDIStatus
): [number, number, number] {
  const [k, s, b] = base;
  const intensity = Math.min(28, Math.abs(deviation) * 32);

  if (status === "khii_excess") {
    // Хий arvidsan — wind excess pushes Хий axis out
    return [
      Math.min(97, k + intensity),
      Math.max(5, s - intensity * 0.55),
      Math.max(5, b - intensity * 0.45),
    ];
  } else if (status === "shar_badgan_excess") {
    // Шар/Бадган arvidsan — boost whichever is dominant in constitution
    if (s >= b) {
      return [Math.max(5, k - intensity * 0.5), Math.min(97, s + intensity), Math.max(5, b - intensity * 0.5)];
    } else {
      return [Math.max(5, k - intensity * 0.5), Math.max(5, s - intensity * 0.5), Math.min(97, b + intensity)];
    }
  }
  return [k, s, b];
}

// Fixed viewBox coords — SVG scales via width prop
const VW = 280;
const VH = 256;
const CX = 140;
const CY = 132;
const R  = 88;
const LR = R + 30; // label radius

// Equilateral triangle: Хий=top, Шар=bottom-right, Бадган=bottom-left
const ANGLES = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6] as const;
const AXIS_KEYS = ["H", "S", "B"] as const; // calculator.radar.axis.<key>
const AXIS_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6"] as const; // blue, amber, violet
// Darker shades of the axis colours for text, so labels keep ≥ 4.5:1 contrast on white.
const AXIS_TEXT_COLORS = ["#1d4ed8", "#b45309", "#6d28d9"] as const; // blue-700, amber-700, violet-700
const AXIS_TEXT_CLASSES = ["text-blue-700", "text-amber-700", "text-violet-700"] as const;
const GRID_LEVELS = [25, 50, 75, 100];

function pt(angle: number, value: number, radius = R): [number, number] {
  return [
    CX + radius * (value / 100) * Math.cos(angle),
    CY + radius * (value / 100) * Math.sin(angle),
  ];
}

function toPolygonPoints(scores: [number, number, number]): string {
  return ANGLES.map((a, i) => pt(a, scores[i]).join(",")).join(" ");
}

interface DoshaRadarProps {
  doshaKey: DoshaKey;
  deviation: number;
  /** The engine's classification. Pass it whenever it is known so the chart matches the status badge. */
  status?: BEDIStatus | string;
  size?: number;
  /** Hide the status badge, legend, and axis score summary below the SVG */
  compact?: boolean;
}

function isStatus(value: unknown): value is BEDIStatus {
  return value === "khii_excess" || value === "balanced" || value === "shar_badgan_excess";
}

export default function DoshaRadar({ doshaKey, deviation, status, size = 260, compact = false }: DoshaRadarProps) {
  const t = useTranslations("calculator.radar");
  const tShared = useTranslations("shared");
  const resolved: BEDIStatus = isStatus(status) ? status : statusFromDeviation(deviation);
  const base    = BASE_SCORES[doshaKey] ?? BASE_SCORES.Tentsveertei;
  const current = applyDeviation(base, deviation, resolved);

  const { color: statusColor, badge: statusBadgeClass } = STATUS_VISUAL[resolved];
  const statusLabel = tShared(`status.${resolved}`);
  const axisLabels = AXIS_KEYS.map((key) => t(`axis.${key}`));

  const svgH = Math.round(size * (VH / VW));

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={svgH}
        viewBox={`0 0 ${VW} ${VH}`}
        role="img"
        aria-label={t("ariaLabel", {
          status: statusLabel,
          h: Math.round(current[0]),
          s: Math.round(current[1]),
          b: Math.round(current[2]),
        })}
      >
        {/* Grid rings */}
        {GRID_LEVELS.map((lvl) => (
          <polygon
            key={lvl}
            points={toPolygonPoints([lvl, lvl, lvl] as [number, number, number])}
            fill="none"
            stroke={lvl === 100 ? "#cbd5e1" : "#e2e8f0"}
            strokeWidth={lvl === 100 ? 1.5 : 1}
          />
        ))}

        {/* Ring value hints */}
        {[25, 50, 75].map((lvl) => {
          const [x, y] = pt(-Math.PI / 2, lvl);
          return (
            <text key={lvl} x={x + 4} y={y} fontSize="8" fill="#64748b" dominantBaseline="central">
              {lvl}
            </text>
          );
        })}

        {/* Axis spokes */}
        {ANGLES.map((a, i) => {
          const [tx, ty] = pt(a, 100);
          return <line key={i} x1={CX} y1={CY} x2={tx} y2={ty} stroke="#e2e8f0" strokeWidth="1" />;
        })}

        {/* Constitutional baseline (dashed) */}
        <polygon
          points={toPolygonPoints(base)}
          fill="rgba(148,163,184,0.07)"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          strokeLinejoin="round"
        />

        {/* Current BEDI state (filled solid) */}
        <polygon
          points={toPolygonPoints(current)}
          fill={`${statusColor}20`}
          stroke={statusColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Vertex dots for current state */}
        {current.map((val, i) => {
          const [x, y] = pt(ANGLES[i], val);
          return (
            <circle
              key={i}
              cx={x} cy={y} r={5}
              fill={AXIS_COLORS[i]}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}

        {/* Center dot */}
        <circle cx={CX} cy={CY} r={3} fill="#94a3b8" />

        {/* Axis labels */}
        {axisLabels.map((label, i) => {
          const [lx, ly] = pt(ANGLES[i], 100, LR);
          return (
            <text
              key={AXIS_KEYS[i]}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="13"
              fontWeight="700"
              fill={AXIS_TEXT_COLORS[i]}
            >
              {label}
            </text>
          );
        })}

        {/* Score values near dots */}
        {current.map((val, i) => {
          // Offset slightly inward from the dot
          const offsetR = Math.max(0, val - 16);
          const [x, y] = pt(ANGLES[i], offsetR);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fontWeight="600"
              fill="#475569"
            >
              {Math.round(val)}
            </text>
          );
        })}
      </svg>

      {!compact && (
        <>
          {/* Status badge */}
          <span className={`text-sm font-bold px-4 py-1 rounded-full text-white ${statusBadgeClass}`}>
            {statusLabel}
          </span>

          {/* Deviation value */}
          <span className="text-sm text-muted-foreground font-mono">
            Δ = {deviation >= 0 ? "+" : ""}{deviation.toFixed(2)}
          </span>

          {/* Legend */}
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <svg width="20" height="6" aria-hidden="true">
                <line x1="0" y1="3" x2="20" y2="3" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 3" />
              </svg>
              {t("legendBase")}
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="20" height="6" aria-hidden="true">
                <line x1="0" y1="3" x2="20" y2="3" stroke={statusColor} strokeWidth="2.5" />
              </svg>
              {t("legendCurrent")}
            </span>
          </div>
        </>
      )}

      {!compact && (
        <div className="flex gap-4 mt-1">
          {axisLabels.map((label, i) => (
            <div key={AXIS_KEYS[i]} className="flex flex-col items-center">
              <span className={`text-xs font-semibold ${AXIS_TEXT_CLASSES[i]}`}>{label}</span>
              <span className="text-base font-bold text-slate-700">{Math.round(current[i])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
