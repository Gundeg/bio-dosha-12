import { BEDIStatus } from "./bediEngine";
import { getTherapy, validateRemedy, RemedyValidation } from "./potencyEngine";
import { DoshaKey } from "./ktMapping";

export interface RemedyResult {
  remedies: string[];
  avoidFoods: string[];
  riskFactors: string[];
  ageNote: string;
  lifestyle: string[];
  validation: RemedyValidation | null;
}

interface AgeGroup {
  min: number;
  max: number;
  label: string;
}

const AGE_GROUPS: AgeGroup[] = [
  { min: 0, max: 12, label: "child" },
  { min: 13, max: 61, label: "middle" },
  { min: 62, max: 999, label: "elder" },
];

function getAgeGroup(age: number): string {
  return (
    AGE_GROUPS.find((g) => age >= g.min && age <= g.max)?.label ?? "middle"
  );
}

const BASE_REMEDIES: Record<BEDIStatus, { remedies: string[]; avoidFoods: string[] }> = {
  khii_excess: {
    remedies: [
      "Шар тос (Тослог цөцгийн тос)",
      "Бурам (Боловсруулаагүй чихэр)",
      "Халуун сүү",
      "Халуун ус, цай",
      "Сарнайн үр, хатаасан жимс",
    ],
    avoidFoods: [
      "Хүйтэн, хөлдөөсөн идээн",
      "Шимгүй, хуурай хоол",
      "Хүйтэн ус",
      "Мацаг барих (урт хугацаагаар)",
    ],
  },
  balanced: {
    remedies: [
      "Одоогийн хоол тэжээлийн дэглэмийг хадгалах",
      "Улирлын дагуу хоол идэх",
      "Дунд зэргийн дасгал хөдөлгөөн",
    ],
    avoidFoods: [
      "Хэт их идэх",
      "Нэг махбодын хоолыг хэт их идэх",
    ],
  },
  shar_badgan_excess: {
    remedies: [
      "Мөсөн чихэр (Лёд чихэр)",
      "Арвай (Хоолойн арвай)",
      "Зөгийн бал (Насанд хүрэгчдэд)",
      "Хүйтэн, хөнгөн ногоо, жимс",
      "Гашуун ногоо (Хулуу, тунис)",
    ],
    avoidFoods: [
      "Архи, согтууруулах ундаа",
      "Тослог, хирний хоол",
      "Халуун ногоо, халуун амт",
      "Улаан мах их хэмжээгээр",
    ],
  },
};

const RISK_FACTORS: Record<BEDIStatus, string[]> = {
  khii_excess: [
    "Мэдрэлийн ядаргаа",
    "Нойргүйдэл",
    "Сэтгэл санааны хямрал",
    "Яс, үеийн өвдөлт",
    "Хоол боловсруулалтын асуудал",
  ],
  balanced: ["Дархлааны сулрал хэт ачааллаас"],
  shar_badgan_excess: [
    "Элэгний үрэвсэл",
    "Чихрийн шижин",
    "Цусны даралт нэмэгдэх",
    "Таргалалт",
    "Арьсны үрэвсэл",
  ],
};

const AGE_REMEDIES: Record<string, { extra: string[]; avoidExtra: string[]; note: string }> = {
  child: {
    extra: ["Ясны хатууруулалтанд мах, шөл", "Шулуун яс, шөвгийн хоол"],
    avoidExtra: ["ЗӨГИЙН БАЛ ОГТООС ХОРИГЛОНО (13 хүртэл нас)"],
    note: "13 хүртэлх насанд зөгийн бал огт хориглоно. Ясыг хатуужуулах хоол иде.",
  },
  middle: {
    extra: ["Хавирга мах (өөхтэй болон булчингийн холимог)", "Мөсөн чихэр (Шарыг хөргөх)"],
    avoidExtra: [],
    note: "13–61 насанд холимог мах, мөсөн чихэр тохиромжтой.",
  },
  elder: {
    extra: ["Зөөлөн мах, шөл", "Бурам + тос (Хийг тэжээх, хуурайшлаас хамгаалах)"],
    avoidExtra: ["Хатуу, боловсруулахад хэцүү хоол"],
    note: "61+ насанд зөөлөн мах, бурам ба тос Хийг тэжээж, хуурайшлаас хамгаална.",
  },
};

export function getRemedies(status: BEDIStatus, age: number, doshaKey?: DoshaKey, deviation?: number): RemedyResult {
  const ageGroup = getAgeGroup(age);
  const base = BASE_REMEDIES[status];
  const ageData = AGE_REMEDIES[ageGroup];
  const risks = RISK_FACTORS[status];

  // potencyEngine-с доша-д тохирсон идээ болон амьдралын хэв маягийн зөвлөмж авах
  const therapy = doshaKey ? getTherapy(doshaKey) : null;

  // potencyEngine-ийн идээг нэгтгэх (давхардлаас зайлсхийх)
  const therapyFoods = therapy ? therapy.foods : [];
  let remedies = [...base.remedies, ...therapyFoods, ...ageData.extra];

  // Children: зөгийн бал огт хориглоно
  if (ageGroup === "child") {
    remedies = remedies.filter((r) => !r.includes("Зөгийн бал"));
  }

  // Logic Gate — validateRemedy (баримт бичгийн Patent Claim 3)
  let validation: RemedyValidation | null = null;
  if (doshaKey && deviation !== undefined && status === "shar_badgan_excess") {
    validation = validateRemedy(deviation, "WARM", doshaKey);
  }

  return {
    remedies,
    avoidFoods: [...base.avoidFoods, ...ageData.avoidExtra],
    riskFactors: risks,
    ageNote: ageData.note,
    lifestyle: therapy ? therapy.lifestyle : [],
    validation,
  };
}
