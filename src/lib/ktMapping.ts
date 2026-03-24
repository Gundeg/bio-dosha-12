export type DoshaKey =
  | "Khii"
  | "Khii_Shar"
  | "Khii_Badgan"
  | "Shar_Khii"
  | "Shar"
  | "Tentsveertei"
  | "Shar_Badgan"
  | "Badgan_Khii"
  | "Badgan_Shar"
  | "Badgan";

export interface DoshaType {
  key: DoshaKey;
  kt: number;
  label: string;          // Mongolian name
  labelEn: string;        // English name
  qualities: string[];
  risks: string[];
  description: string;
}

export const DOSHA_MAP: Record<DoshaKey, DoshaType> = {
  Khii: {
    key: "Khii",
    kt: 0.70,
    label: "Хий",
    labelEn: "Wind (Khii)",
    qualities: ["Хөнгөн", "Хүйтэн", "Барзгар"],
    risks: ["Мэдрэлийн ядаргаа", "Нойргүйдэл", "Түгшүүр"],
    description: "Хий махбод давамгайлсан хүн хөнгөн, хүйтэн, барзгар шинж чанартай байна.",
  },
  Khii_Shar: {
    key: "Khii_Shar",
    kt: 0.80,
    label: "Хий-Шар",
    labelEn: "Wind-Fire",
    qualities: ["Хөнгөн", "Хурц"],
    risks: ["Мэдрэлийн стресс", "Элэгний хурцадмал байдал"],
    description: "Хий ба Шар холимог махбод. Хурц бодол, хөнгөн биетэй.",
  },
  Khii_Badgan: {
    key: "Khii_Badgan",
    kt: 0.85,
    label: "Хий-Бадган",
    labelEn: "Wind-Earth",
    qualities: ["Хүйтэн", "Тогтворгүй"],
    risks: ["Хоол боловсруулалтын асуудал", "Уйтгар гуниг"],
    description: "Хий ба Бадган холимог. Хүйтэн, тогтворгүй шинж давамгайлна.",
  },
  Shar_Khii: {
    key: "Shar_Khii",
    kt: 0.90,
    label: "Шар-Хий",
    labelEn: "Fire-Wind",
    qualities: ["Халуун", "Хөдөлгөөнтэй"],
    risks: ["Цусны даралт", "Уур хилэн"],
    description: "Шар ба Хий холимог. Халуун, хурдан хөдөлгөөнтэй.",
  },
  Shar: {
    key: "Shar",
    kt: 1.00,
    label: "Шар",
    labelEn: "Fire (Shar)",
    qualities: ["Халуун", "Хурц", "Хөнгөн"],
    risks: ["Элэгний үрэвсэл", "Цөсний асуудал", "Хэт халах"],
    description: "Шар махбод давамгайлсан. Халуун, хурц, хурдан бодолтой.",
  },
  Tentsveertei: {
    key: "Tentsveertei",
    kt: 1.00,
    label: "Тэнцвэртэй",
    labelEn: "Balanced (Tridosha)",
    qualities: ["Тэнцвэртэй", "Бүх чанар жигд"],
    risks: ["Дархлааны сулрал (хэт их ачааллаас)"],
    description: "Гурван махбод тэнцвэртэй байна. Хамгийн эрүүл төлөв.",
  },
  Shar_Badgan: {
    key: "Shar_Badgan",
    kt: 1.10,
    label: "Шар-Бадган",
    labelEn: "Fire-Earth",
    qualities: ["Халуун", "Тослог"],
    risks: ["Чихрийн шижин", "Арьсны үрэвсэл"],
    description: "Шар ба Бадган холимог. Халуун, тослог шинж давамгайлна.",
  },
  Badgan_Khii: {
    key: "Badgan_Khii",
    kt: 1.25,
    label: "Бадган-Хий",
    labelEn: "Earth-Wind",
    qualities: ["Хүнд", "Хүйтэн"],
    risks: ["Амьсгалын замын асуудал", "Хаван"],
    description: "Бадган ба Хий холимог. Хүнд, хүйтэн шинж давамгайлна.",
  },
  Badgan_Shar: {
    key: "Badgan_Shar",
    kt: 1.35,
    label: "Бадган-Шар",
    labelEn: "Earth-Fire",
    qualities: ["Хүнд", "Халуун"],
    risks: ["Чихрийн шижин", "Таргалалт"],
    description: "Бадган ба Шар холимог. Хүнд биетэй, дотоод дулаан их.",
  },
  Badgan: {
    key: "Badgan",
    kt: 1.50,
    label: "Бадган",
    labelEn: "Earth (Badgan)",
    qualities: ["Хүнд", "Мохоо", "Наалдамхай"],
    risks: ["Таргалалт", "Чихрийн шижин", "Цусны өтгөрөлт"],
    description: "Бадган махбод давамгайлсан. Хүнд, удаан, тогтвортой шинж чанартай.",
  },
};

export const DOSHA_LIST = Object.values(DOSHA_MAP);

export function getDoshaByKt(kt: number): DoshaType {
  return (
    DOSHA_LIST.find((d) => d.kt === kt) ??
    DOSHA_LIST.reduce((prev, curr) =>
      Math.abs(curr.kt - kt) < Math.abs(prev.kt - kt) ? curr : prev
    )
  );
}
