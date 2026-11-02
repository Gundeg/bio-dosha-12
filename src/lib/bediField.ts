/**
 * Geometry of the махбод field: the ternary triangle (Хий top, Шар bottom-right,
 * Бадган bottom-left), its 91-point lattice of questionnaire score combinations,
 * the ten constitution zones, and the display rule that moves a person's point by
 * their BEDI deviation. Shared by DoshaRadar (2D) and BediField (3D).
 *
 * Nothing here changes the formula: zones come from mapToDoshaKey, the deviation
 * and status come from bediEngine; applyDeviation only decides where to draw.
 */
import type { BEDIStatus } from "./bediEngine";
import type { DoshaKey } from "./ktMapping";
import { mapToDoshaKey } from "./questionnaireEngine";

export type Axis = "H" | "S" | "B";
export type Point2 = [number, number];
export type ScoreTriple = [number, number, number];

/** Constitutional component proportions [Хий%, Шар%, Бадган%] per zone. */
export const BASE_SCORES: Record<DoshaKey, ScoreTriple> = {
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

/**
 * Display rule (not part of the formula): Хий excess pushes the Хий share out;
 * Шар/Бадган excess boosts whichever of the two the constitution favours. The
 * push grows with |Δ| and is capped so the point always stays inside the field.
 */
export function applyDeviation(base: ScoreTriple, deviation: number, status: BEDIStatus): ScoreTriple {
  const [k, s, b] = base;
  const intensity = Math.min(28, Math.abs(deviation) * 32);

  if (status === "khii_excess") {
    return [
      Math.min(97, k + intensity),
      Math.max(5, s - intensity * 0.55),
      Math.max(5, b - intensity * 0.45),
    ];
  }
  if (status === "shar_badgan_excess") {
    if (s >= b) {
      return [Math.max(5, k - intensity * 0.5), Math.min(97, s + intensity), Math.max(5, b - intensity * 0.5)];
    }
    return [Math.max(5, k - intensity * 0.5), Math.max(5, s - intensity * 0.5), Math.min(97, b + intensity)];
  }
  return [k, s, b];
}

// ── 2D field (texture space) ───────────────────────────────────────────────
const SIDE = 300;
const OX = 60;
const OY = 62;
const HEIGHT = (SIDE * Math.sqrt(3)) / 2;

export const CORNERS: Record<Axis, Point2> = {
  H: [OX + SIDE / 2, OY],
  S: [OX + SIDE, OY + HEIGHT],
  B: [OX, OY + HEIGHT],
};
const CENTROID: Point2 = [OX + SIDE / 2, OY + (HEIGHT * 2) / 3];

/** The triangle is this many world units wide in the 3D scene. */
export const WORLD_SIZE = 6;
const K2W = WORLD_SIZE / SIDE;
/** Hexagon radius of one lattice cell in 2D field units. */
export const HEX_RADIUS = SIDE / 12 / Math.sqrt(3);
/** 2D field size, for a square texture that contains the whole triangle. */
export const FIELD_EXTENT = 420;

/** Barycentric (h, s, b) → 2D field point. Weights are normalised, so any scale works. */
export function baryToPoint(h: number, s: number, b: number): Point2 {
  const n = h + s + b || 1;
  const wh = h / n, ws = s / n, wb = b / n;
  return [
    wh * CORNERS.H[0] + ws * CORNERS.S[0] + wb * CORNERS.B[0],
    wh * CORNERS.H[1] + ws * CORNERS.S[1] + wb * CORNERS.B[1],
  ];
}

/** 2D field point → world (x, z), centred on the triangle's centroid. */
export function toWorld(x: number, y: number): Point2 {
  return [(x - CENTROID[0]) * K2W, (y - CENTROID[1]) * K2W];
}

/** Barycentric weights of a 2D point, clamped to the triangle and normalised. */
export function baryWeights([x, y]: Point2): [number, number, number] {
  const [ax, ay] = CORNERS.H, [bx, by] = CORNERS.S, [cx, cy] = CORNERS.B;
  const det = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
  let wH = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / det;
  let wS = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / det;
  let wB = 1 - wH - wS;
  wH = Math.max(0, wH); wS = Math.max(0, wS); wB = Math.max(0, wB);
  const sum = wH + wS + wB || 1;
  return [wH / sum, wS / sum, wB / sum];
}

export interface LatticePoint {
  h: number;
  s: number;
  b: number;
  x: number;
  y: number;
  key: DoshaKey;
}

/** All (h, s, b) with h + s + b = 12, each with its engine zone. */
export const LATTICE: LatticePoint[] = (() => {
  const out: LatticePoint[] = [];
  for (let h = 0; h <= 12; h++) {
    for (let s = 0; s <= 12 - h; s++) {
      const b = 12 - h - s;
      const [x, y] = baryToPoint(h, s, b);
      out.push({ h, s, b, x, y, key: mapToDoshaKey({ H: h, S: s, B: b }) });
    }
  }
  return out;
})();

export interface ZoneInfo {
  /** Mean of the zone's lattice points (label anchor). */
  centre: Point2;
  /** The zone's lattice point nearest its centre (pin position). */
  rep: LatticePoint;
}

export const ZONES: Record<DoshaKey, ZoneInfo> = (() => {
  const zones = {} as Record<DoshaKey, ZoneInfo>;
  const keys = Array.from(new Set(LATTICE.map((p) => p.key)));
  for (const key of keys) {
    const pts = LATTICE.filter((p) => p.key === key);
    const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
    const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    const rep = pts.reduce((best, p) =>
      Math.hypot(p.x - cx, p.y - cy) < Math.hypot(best.x - cx, best.y - cy) ? p : best
    );
    zones[key] = { centre: [cx, cy], rep };
  }
  return zones;
})();

export interface BorderSegment {
  a: DoshaKey;
  b: DoshaKey;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Short segments along the edges between neighbouring cells of different zones. */
export const BORDER_SEGMENTS: BorderSegment[] = (() => {
  const byKey = new Map(LATTICE.map((p) => [`${p.h},${p.s},${p.b}`, p]));
  const segs: BorderSegment[] = [];
  for (const p of LATTICE) {
    for (const [dh, ds, db] of [[1, -1, 0], [1, 0, -1], [0, 1, -1]] as const) {
      const q = byKey.get(`${p.h + dh},${p.s + ds},${p.b + db}`);
      if (!q || q.key === p.key) continue;
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      const vx = q.x - p.x, vy = q.y - p.y, len = Math.hypot(vx, vy);
      const px = (-vy / len) * (HEX_RADIUS / 2 + 0.6), py = (vx / len) * (HEX_RADIUS / 2 + 0.6);
      segs.push({ a: p.key, b: q.key, x1: mx - px, y1: my - py, x2: mx + px, y2: my + py });
    }
  }
  return segs;
})();

/** The zone of any 2D point: nearest score combination, then the engine rule. */
export function nearestZone(point: Point2): DoshaKey {
  const w = baryWeights(point);
  const raw = w.map((v) => v * 12);
  const fl = raw.map(Math.floor);
  let rem = 12 - fl[0] - fl[1] - fl[2];
  const order = raw.map((v, i) => [v - fl[i], i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rem <= 0) break;
    fl[i]++; rem--;
  }
  return mapToDoshaKey({ H: fl[0], S: fl[1], B: fl[2] });
}

export interface Displacement {
  scores: ScoreTriple;
  point: Point2;
  zone: DoshaKey;
  /** False when the status is balanced: the ball sits on the pin. */
  moved: boolean;
}

/** Where the current ball sits for a constitution, a deviation and the engine's status. */
export function displaceForDeviation(doshaKey: DoshaKey, deviation: number, status: BEDIStatus): Displacement {
  const base = BASE_SCORES[doshaKey] ?? BASE_SCORES.Tentsveertei;
  const scores = applyDeviation(base, deviation, status);
  const point = baryToPoint(...scores);
  const moved = status !== "balanced" && scores.some((v, i) => v !== base[i]);
  return { scores, point, zone: moved ? nearestZone(point) : doshaKey, moved };
}

export type TrailTrend = "none" | "closer" | "farther" | "same";

/** Compares |Δ| of the oldest earlier record with |Δ| now. */
export function trailTrend(earlierDeviations: number[], current: number): TrailTrend {
  if (earlierDeviations.length === 0) return "none";
  const diff = Math.abs(current) - Math.abs(earlierDeviations[0]);
  if (diff < -0.02) return "closer";
  if (diff > 0.02) return "farther";
  return "same";
}
