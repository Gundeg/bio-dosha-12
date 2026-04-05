/**
 * potencyEngine.ts
 * 16 чадлын терапийн матриц (Therapeutic Potency Matrix)
 *
 * Баримт бичгийн дагуу:
 * - Хийг дарах: Зөөлөн, Хүнд, Дулаан, Тослог
 * - Шарыг дарах: Сэрүүн, Мохоо, Тунгалаг, Зөөлөн
 * - Бадганыг дарах: Ширүүн, Хөнгөн, Хүйтэн, Хурц
 */

import { DoshaKey } from "./ktMapping";

export type PotencyType = "WARM" | "COOL" | "HEAVY" | "LIGHT" | "OILY" | "ROUGH" | "SHARP" | "SOFT" | "CLEAR" | "COLD";

export interface TherapyEntry {
  foods: string[];
  lifestyle: string[];
  potencies: PotencyType[]; // Активирдаг 16 чадлын төрлүүд
}

/** Доша тус бүрийн эсрэг чадал (Antidote potencies) */
export const ANTIDOTE_POTENCIES: Record<"Khii" | "Shar" | "Badgan", PotencyType[]> = {
  Khii:   ["SOFT", "HEAVY", "WARM", "OILY"],   // Зөөлөн, Хүнд, Дулаан, Тослог
  Shar:   ["COOL", "SOFT", "CLEAR", "SOFT"],    // Сэрүүн, Мохоо, Тунгалаг, Зөөлөн
  Badgan: ["ROUGH", "LIGHT", "COLD", "SHARP"],  // Ширүүн, Хөнгөн, Хүйтэн, Хурц
};

/**
 * THERAPY_MAP — Баримт бичгийн lib/potencyEngine.ts шаардлага
 * Доша тус бүрд идээ ба амьдралын хэв маягийн зөвлөмж
 */
export const THERAPY_MAP: Record<"Khii" | "Shar" | "Badgan", TherapyEntry> = {
  Khii: {
    potencies: ["SOFT", "HEAVY", "WARM", "OILY"],
    foods: [
      "Хонины мах",
      "Шар тос (тослог цөцгийн тос)",
      "Бүлээн сүү",
      "Сармис",
      "Бурам (боловсруулаагүй чихэр)",
      "Халуун ус, цай",
      "Сарнайн үр, хатаасан жимс",
    ],
    lifestyle: [
      "Тостой иллэг (абьянга)",
      "Дулаан газар амрах",
      "Тогтмол нойр, тогтмол цагт унтах",
      "Дулаан, тайван орчинд байх",
      "Хэт их салхинд гарахаас зайлсхийх",
    ],
  },
  Shar: {
    potencies: ["COOL", "SOFT", "CLEAR", "SOFT"],
    foods: [
      "Үхрийн мах",
      "Арвайн гурил",
      "Тараг",
      "Цэвэр ус",
      "Мөсөн чихэр (арваан чихэр)",
      "Хүйтэн, хөнгөн ногоо, жимс",
      "Гашуун ногоо (хулуу, тунис)",
    ],
    lifestyle: [
      "Сэрүүн орчинд байх",
      "Бясалгал, амгалан тайван байдал",
      "Цэвэр агаарт алхах (өглөөний цагт)",
      "Халуун нарнаас зайлсхийх",
      "Хэт их хүчин чармайлт, уур хилэнгээс зайлсхийх",
    ],
  },
  Badgan: {
    potencies: ["ROUGH", "LIGHT", "COLD", "SHARP"],
    foods: [
      "Загасны мах",
      "Зөгийн бал (насанд хүрэгчдэд)",
      "Халуун ногоо (чинжүү, сонгино)",
      "Арвай",
      "Хөнгөн, хуурай хоол",
      "Гашуун болон халуун амттай идээ",
    ],
    lifestyle: [
      "Идэвхтэй дасгал хөдөлгөөн (өдөр бүр)",
      "Нарны гэрэлд байх",
      "Хааяа мацаг барих",
      "Хэт их унтахаас зайлсхийх",
      "Шинэ туршлага, идэвхтэй амьдралын хэв маяг",
    ],
  },
};

/**
 * DoshaKey-г үндсэн 3 доша бүлэгт хөрвүүлэх
 * (холимог махбодийн хувьд давамгайлсан дошагийн зөвлөмжийг өгнө)
 */
function getDominantDosha(doshaKey: DoshaKey): "Khii" | "Shar" | "Badgan" {
  if (doshaKey.startsWith("Khii")) return "Khii";
  if (doshaKey.startsWith("Shar")) return "Shar";
  if (doshaKey.startsWith("Badgan")) return "Badgan";
  return "Shar"; // Tentsveertei → Shar (хамгийн дундаж)
}

/** Доша төрлөөр терапийн зөвлөмж авах */
export function getTherapy(doshaKey: DoshaKey): TherapyEntry & { dominantDosha: "Khii" | "Shar" | "Badgan" } {
  const dominant = getDominantDosha(doshaKey);
  return { ...THERAPY_MAP[dominant], dominantDosha: dominant };
}

/**
 * validateRemedy — Logic Gate (Сөрөг нөлөөллийн хяналт)
 * Баримт бичгийн Patent Claim 3-ын шаардлага
 *
 * @param delta    BEDI хазайлт (deviation)
 * @param potency  Сонгосон чадлын төрөл
 * @param constitution  Хэрэглэгчийн махбодийн төрөл (DoshaKey)
 */
export interface RemedyValidation {
  status: "OK" | "WARNING" | "CONTRAINDICATED";
  action: string;
  adjustedDosePercent: number; // 100 = өөрчлөлтгүй, 70 = 30% бууруулах
}

export function validateRemedy(
  delta: number,
  potency: PotencyType,
  constitution: DoshaKey
): RemedyValidation {
  const dominant = getDominantDosha(constitution);

  // Шар махбодьтой хүнд халуун засал — Шарыг сэдрээх эрсдэл
  if (potency === "WARM" && dominant === "Shar" && delta > 0.8) {
    return {
      status: "WARNING",
      action: "Шарыг сэдрээх эрсдэлтэй тул тунг 30% бууруулж, сэрүүн чанарын идээгээр хавсарна.",
      adjustedDosePercent: 70,
    };
  }

  // Хий махбодьтой хүнд хүйтэн засал — Хийг сэдрээх эрсдэл
  if (potency === "COLD" && dominant === "Khii" && delta < -0.5) {
    return {
      status: "WARNING",
      action: "Хийг сэдрээх эрсдэлтэй тул тунг 50% бууруулж, дулаан чанарын идээгээр хавсарна.",
      adjustedDosePercent: 50,
    };
  }

  // Бадган махбодьтой хүнд тослог засал — Бадганыг сэдрээх эрсдэл
  if (potency === "OILY" && dominant === "Badgan" && delta > 0.5) {
    return {
      status: "CONTRAINDICATED",
      action: "Бадганыг хүчтэй сэдрээх тул энэ заслыг хэрэглэхгүй байхыг зөвлөж байна.",
      adjustedDosePercent: 0,
    };
  }

  return {
    status: "OK",
    action: "Зөвлөмж идэвхтэй.",
    adjustedDosePercent: 100,
  };
}
