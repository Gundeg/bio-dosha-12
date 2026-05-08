export const SEASON_LABELS = {
  WINTER: "Өвөл",
  SPRING: "Хавар",
  SUMMER: "Зун",
  AUTUMN: "Намар",
} as const;

export const SEX_LABELS = {
  MALE: "Эрэгтэй",
  FEMALE: "Эмэгтэй",
} as const;

export const CONDITION_OPTIONS = [
  { value: "light", label: "Хөнгөн" },
  { value: "medium", label: "Дунд" },
  { value: "severe", label: "Хүнд" },
] as const;

export const MENTAL_STATE_OPTIONS = [
  { value: "clear", label: "Саруул" },
  { value: "notClear", label: "Саруул бус" },
] as const;

export const POSITION_OPTIONS = [
  { value: "active", label: "Идэвхтэй" },
  { value: "inactive", label: "Идэвхгүй" },
] as const;

export const PULSE_ROW_LABELS = {
  dolovor: "Долоовор",
  dund: "Дунд",
  yadam: "Ядам",
} as const;

export const PULSE_ROW_KEYS = ["dolovor", "dund", "yadam"] as const;
export type PulseRowKey = (typeof PULSE_ROW_KEYS)[number];

export const PULSE_COL_LABELS = {
  rightTop: "Баруун — Дээр",
  rightBottom: "Баруун — Доор",
  leftTop: "Зүүн — Дээр",
  leftBottom: "Зүүн — Доор",
} as const;

export const PULSE_COL_KEYS = ["rightTop", "rightBottom", "leftTop", "leftBottom"] as const;
export type PulseColKey = (typeof PULSE_COL_KEYS)[number];

export interface TherapyLeaf {
  key: string;
  label: string;
}

export interface TherapyGroup {
  number: number;
  label: string;
  leaves: TherapyLeaf[];
}

export const THERAPY_GROUPS: TherapyGroup[] = [
  {
    number: 1,
    label: "Татлага",
    leaves: [
      { key: "tractionNeck", label: "Хүзүү" },
      { key: "tractionBack", label: "Нуруу" },
    ],
  },
  {
    number: 2,
    label: "Бариа",
    leaves: [
      { key: "barriaaHead", label: "Толгой" },
      { key: "barriaaNeckShoulder", label: "Хүзүү, Сэрвээ" },
      { key: "barriaaBack", label: "Нуруу" },
      { key: "barriaaLegs", label: "Хөл" },
    ],
  },
  { number: 3, label: "Зүү", leaves: [{ key: "acupuncture", label: "Зүү" }] },
  { number: 4, label: "Бумба", leaves: [{ key: "cupping", label: "Бумба" }] },
  { number: 5, label: "Шарлага", leaves: [{ key: "heatTreatment", label: "Шарлага" }] },
  {
    number: 6,
    label: "Тосон иллэг",
    leaves: [
      { key: "oilZad5", label: "Задь 5 — шар тосон иллэг" },
      { key: "oilBoigor10", label: "Бойгор 10 — шар тосон иллэг" },
      { key: "oilSenden4", label: "Сэндэн 4 — шар тосон иллэг" },
      { key: "oilSesame", label: "Гүнжидийн үртэй тосон иллэг" },
      { key: "oilGinger", label: "Цагаан гаатай тосон иллэг" },
      { key: "oilMilk", label: "Цэвэр сүүний тосон иллэг" },
      { key: "oilZad5Tail", label: "Задь 5 — сүүлний тосон иллэг" },
      { key: "oilGarlic", label: "Гаатай тосон иллэг" },
    ],
  },
  { number: 7, label: "Халуун чулуун массаж", leaves: [{ key: "hotStone", label: "Халуун чулуун массаж" }] },
  { number: 8, label: "Электрофорез", leaves: [{ key: "electrophoresis", label: "Электрофорез" }] },
  { number: 9, label: "Хордлого тайлах детокс", leaves: [{ key: "detox", label: "Хордлого тайлах детокс" }] },
  {
    number: 10,
    label: "Хөлийн улны цэгэн массажны аппарат",
    leaves: [{ key: "footReflex", label: "Хөлийн улны цэгэн массажны аппарат" }],
  },
  { number: 11, label: "Хануур, самнуур", leaves: [{ key: "bloodletting", label: "Хануур, самнуур" }] },
  { number: 12, label: "Төөнүүр", leaves: [{ key: "moxibustion", label: "Төөнүүр" }] },
  { number: 13, label: "Дасгал, хөдөлгөөн засал", leaves: [{ key: "exerciseTherapy", label: "Дасгал, хөдөлгөөн засал" }] },
];

export const ALL_THERAPY_KEYS = THERAPY_GROUPS.flatMap((g) => g.leaves.map((l) => l.key));

export const TREATMENT_MAX_SESSIONS = 10;
