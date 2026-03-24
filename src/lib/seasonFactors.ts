export type SeasonKey = "WINTER" | "SPRING" | "SUMMER" | "AUTUMN";

export const SEASON_COEFFICIENTS: Record<SeasonKey, number> = {
  WINTER: 2.0,
  SPRING: 1.5,
  SUMMER: 1.0,
  AUTUMN: 1.3,
};

export const SEASON_LABELS: Record<SeasonKey, { mn: string; en: string }> = {
  WINTER: { mn: "Өвөл", en: "Winter" },
  SPRING: { mn: "Хавар", en: "Spring" },
  SUMMER: { mn: "Зун", en: "Summer" },
  AUTUMN: { mn: "Намар", en: "Autumn" },
};

/** Guess current season from month (1-based) */
export function getCurrentSeason(): SeasonKey {
  const month = new Date().getMonth() + 1;
  if (month >= 12 || month <= 2) return "WINTER";
  if (month >= 3 && month <= 5) return "SPRING";
  if (month >= 6 && month <= 8) return "SUMMER";
  return "AUTUMN";
}
