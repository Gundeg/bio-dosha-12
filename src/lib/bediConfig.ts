/**
 * BEDI тохиргооны тогтмолууд — анхны веб хувилбарын (commit 25e015a) утгууд.
 * Эзэмшигч 2026-10-26-нд эдгээрийг зөв гэж баталсан.
 *
 *   BEDI = (W · Kg · Ks · Kc) / (H · Age · Kt),  Δ = BEDI − 1
 *   Δ < −0.3 → Хий арвидсан · Δ > +0.3 → Шар/Бадган арвидсан · бусад → Тэнцвэртэй
 *
 * ⚠️ Эдгээр утгыг эзэмшигчийн бичгээр өгсөн зөвшөөрөлгүйгээр ӨӨРЧЛӨХГҮЙ.
 * See lessons.md and src/lib/__tests__/bediEngine.test.ts.
 */

/** Тэнцвэртэй бүсийн доод/дээд босго (хазайлт Δ-ийн утгаар) */
export const BEDI_THRESHOLDS = {
  khiiBelow: -0.3,
  sharBadganAbove: 0.3,
} as const;

/** Хазайлт болон индексийн нарийвчлал (таслалаас хойших орон) */
export const BEDI_PRECISION = 2;

/** Нэг газар тодорхойлсон тоймлолт */
export function roundBedi(value: number): number {
  const f = 10 ** BEDI_PRECISION;
  return Math.round(value * f) / f;
}
