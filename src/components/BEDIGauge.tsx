"use client";

import { useEffect, useRef } from "react";

interface BEDIGaugeProps {
  deviation: number; // -1 to +1
  size?: number;
}

export default function BEDIGauge({ deviation, size = 240 }: BEDIGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = size / 2;
    const cy = size * 0.65;
    const r = size * 0.4;
    const lineW = size * 0.1;

    ctx.clearRect(0, 0, size, size);

    // Draw arc segments: khii (blue) | balanced (green) | shar/badgan (red)
    const segments = [
      { start: Math.PI, end: Math.PI * 1.33, color: "#60a5fa" },   // blue: khii excess
      { start: Math.PI * 1.33, end: Math.PI * 1.66, color: "#4ade80" }, // green: balanced
      { start: Math.PI * 1.66, end: Math.PI * 2, color: "#f87171" }, // red: shar/badgan
    ];

    segments.forEach(({ start, end, color }) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, end);
      ctx.lineWidth = lineW;
      ctx.strokeStyle = color;
      ctx.lineCap = "butt";
      ctx.stroke();
    });

    // Track background
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, Math.PI * 2);
    ctx.lineWidth = lineW + 4;
    ctx.strokeStyle = "transparent";
    ctx.stroke();

    // Needle
    const clamped = Math.max(-1, Math.min(1, deviation));
    // Map deviation -1..+1 to angle Math.PI..Math.PI*2
    const angle = Math.PI + ((clamped + 1) / 2) * Math.PI;
    const needleLen = r - lineW / 2;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + needleLen * Math.cos(angle),
      cy + needleLen * Math.sin(angle)
    );
    ctx.lineWidth = size * 0.025;
    ctx.strokeStyle = "#1e293b";
    ctx.lineCap = "round";
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.035, 0, Math.PI * 2);
    ctx.fillStyle = "#1e293b";
    ctx.fill();

    // Labels
    ctx.fillStyle = "#64748b";
    ctx.font = `${size * 0.06}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Хий", cx - r * 0.85, cy + size * 0.05);
    ctx.fillText("Бадган", cx + r * 0.85, cy + size * 0.05);
  }, [deviation, size]);

  const statusColor =
    deviation < -0.3 ? "text-blue-500" : deviation > 0.3 ? "text-red-500" : "text-green-500";
  const statusLabel =
    deviation < -0.3 ? "Хий арвидсан" : deviation > 0.3 ? "Шар/Бадган арвидсан" : "Тэнцвэртэй";

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} width={size} height={size * 0.75} />
      <div className={`text-lg font-bold ${statusColor}`}>{statusLabel}</div>
      <div className="text-sm text-muted-foreground">
        Δ = {deviation >= 0 ? "+" : ""}{deviation.toFixed(2)}
      </div>
    </div>
  );
}
