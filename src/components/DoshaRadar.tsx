"use client";

import { DoshaKey } from "@/lib/ktMapping";

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

function applyDeviation(
  base: [number, number, number],
  deviation: number
): [number, number, number] {
  const [k, s, b] = base;
  const intensity = Math.min(28, Math.abs(deviation) * 32);

  if (deviation < -0.3) {
    // Хий arvidsan — wind excess pushes Хий axis out
    return [
      Math.min(97, k + intensity),
      Math.max(5, s - intensity * 0.55),
      Math.max(5, b - intensity * 0.45),
    ];
  } else if (deviation > 0.3) {
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
const AXIS_LABELS = ["Хий", "Шар", "Бадган"] as const;
const AXIS_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6"] as const; // blue, amber, violet
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
  size?: number;
  /** Hide the status badge, legend, and axis score summary below the SVG */
  compact?: boolean;
}

export default function DoshaRadar({ doshaKey, deviation, size = 260, compact = false }: DoshaRadarProps) {
  const base    = BASE_SCORES[doshaKey] ?? BASE_SCORES.Tentsveertei;
  const current = applyDeviation(base, deviation);

  const statusColor =
    deviation < -0.3 ? "#3b82f6" : deviation > 0.3 ? "#f87171" : "#10b981";
  const statusLabel =
    deviation < -0.3 ? "Хий арвидсан" : deviation > 0.3 ? "Шар/Бадган арвидсан" : "Тэнцвэртэй";
  const statusBadgeClass =
    deviation < -0.3 ? "bg-blue-500" : deviation > 0.3 ? "bg-red-400" : "bg-emerald-500";

  const svgH = Math.round(size * (VH / VW));

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={svgH}
        viewBox={`0 0 ${VW} ${VH}`}
        aria-label="Доша радар диаграм"
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
            <text key={lvl} x={x + 4} y={y} fontSize="8" fill="#cbd5e1" dominantBaseline="central">
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
        {AXIS_LABELS.map((label, i) => {
          const [lx, ly] = pt(ANGLES[i], 100, LR);
          return (
            <text
              key={label}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="13"
              fontWeight="700"
              fill={AXIS_COLORS[i]}
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
              Үндсэн
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="20" height="6" aria-hidden="true">
                <line x1="0" y1="3" x2="20" y2="3" stroke={statusColor} strokeWidth="2.5" />
              </svg>
              Одоогийн
            </span>
          </div>
        </>
      )}

      {!compact && (
        <div className="flex gap-4 mt-1">
          {AXIS_LABELS.map((label, i) => {
            const textClass = i === 0 ? "text-blue-500" : i === 1 ? "text-amber-500" : "text-violet-500";
            return (
              <div key={label} className="flex flex-col items-center">
                <span className={`text-xs font-semibold ${textClass}`}>{label}</span>
                <span className="text-base font-bold text-slate-700">{Math.round(current[i])}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
