import { describe, expect, it } from "vitest";
import { DOSHA_MAP, type DoshaKey } from "../ktMapping";
import { mapToDoshaKey } from "../questionnaireEngine";
import {
  BASE_SCORES,
  CORNERS,
  LATTICE,
  ZONES,
  applyDeviation,
  baryToPoint,
  displaceForDeviation,
  nearestZone,
  toWorld,
  trailTrend,
} from "../bediField";

const KEYS = Object.keys(DOSHA_MAP) as DoshaKey[];

function insideTriangle([x, y]: [number, number]): boolean {
  const [[ax, ay], [bx, by], [cx, cy]] = [CORNERS.H, CORNERS.S, CORNERS.B];
  const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
  const w1 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / d;
  const w2 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / d;
  const w3 = 1 - w1 - w2;
  const eps = -1e-6;
  return w1 >= eps && w2 >= eps && w3 >= eps;
}

describe("the махбод field lattice", () => {
  it("has the 91 score combinations that sum to 12, each in its engine zone", () => {
    expect(LATTICE).toHaveLength(91);
    const seen = new Set<string>();
    for (const p of LATTICE) {
      expect(p.h + p.s + p.b).toBe(12);
      seen.add(`${p.h},${p.s},${p.b}`);
      expect(p.key).toBe(mapToDoshaKey({ H: p.h, S: p.s, B: p.b }));
      expect(insideTriangle([p.x, p.y])).toBe(true);
    }
    expect(seen.size).toBe(91);
  });

  it("gives every one of the ten zones a centre and a representative point of that zone", () => {
    for (const key of KEYS) {
      expect(ZONES[key].rep.key).toBe(key);
      expect(insideTriangle(ZONES[key].centre)).toBe(true);
    }
  });

  it("puts the pure corners on the triangle corners and the balance point at the centroid", () => {
    expect(baryToPoint(12, 0, 0)).toEqual(CORNERS.H);
    expect(baryToPoint(0, 12, 0)).toEqual(CORNERS.S);
    expect(baryToPoint(0, 0, 12)).toEqual(CORNERS.B);
    const [cx, cy] = baryToPoint(4, 4, 4);
    const [wx, wz] = toWorld(cx, cy);
    expect(Math.abs(wx)).toBeLessThan(1e-9);
    expect(Math.abs(wz)).toBeLessThan(1e-9);
  });

  it("maps the 2D field onto six world units across", () => {
    const [sx] = toWorld(...CORNERS.S);
    const [bx] = toWorld(...CORNERS.B);
    expect(sx - bx).toBeCloseTo(6, 9);
  });
});

describe("displacement by BEDI deviation (the radar's display rule)", () => {
  it("leaves a balanced person on their constitution point", () => {
    const r = displaceForDeviation("Khii_Shar", 0.1, "balanced");
    expect(r.moved).toBe(false);
    expect(r.scores).toEqual(BASE_SCORES.Khii_Shar);
    expect(r.zone).toBe("Khii_Shar");
  });

  it("pushes Хий excess toward the Хий corner, exactly as applyDeviation does", () => {
    const r = displaceForDeviation("Shar_Badgan", -0.6, "khii_excess");
    expect(r.moved).toBe(true);
    expect(r.scores).toEqual(applyDeviation(BASE_SCORES.Shar_Badgan, -0.6, "khii_excess"));
    expect(r.scores[0]).toBeGreaterThan(BASE_SCORES.Shar_Badgan[0]);
  });

  it("pushes Шар/Бадган excess toward whichever of the two the constitution favours", () => {
    const shar = displaceForDeviation("Shar_Khii", 0.8, "shar_badgan_excess");
    const badgan = displaceForDeviation("Badgan_Khii", 0.8, "shar_badgan_excess");
    expect(shar.scores[1]).toBeGreaterThan(BASE_SCORES.Shar_Khii[1]);
    expect(badgan.scores[2]).toBeGreaterThan(BASE_SCORES.Badgan_Khii[2]);
  });

  it("keeps every displaced point inside the triangle for extreme deviations", () => {
    for (const key of KEYS) {
      for (const [d, status] of [[-2, "khii_excess"], [3, "shar_badgan_excess"], [0, "balanced"]] as const) {
        const r = displaceForDeviation(key, d, status);
        expect(insideTriangle(r.point), `${key} ${d}`).toBe(true);
        expect(KEYS).toContain(r.zone);
      }
    }
  });

  it("finds the zone of an arbitrary point through the engine rule", () => {
    expect(nearestZone(CORNERS.H)).toBe("Khii");
    expect(nearestZone(baryToPoint(4, 4, 4))).toBe("Tentsveertei");
    expect(nearestZone(ZONES.Badgan_Shar.centre)).toBe("Badgan_Shar");
  });
});

describe("trailTrend", () => {
  it("reports movement toward or away from balance by |Δ| from the oldest record to now", () => {
    expect(trailTrend([1.2, 0.9], 0.5)).toBe("closer");
    expect(trailTrend([-0.1], -0.6)).toBe("farther");
    expect(trailTrend([0.4], 0.41)).toBe("same");
    expect(trailTrend([], 0.4)).toBe("none");
  });
});
