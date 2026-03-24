import { DoshaKey } from "./ktMapping";

export type DominantType = "H" | "S" | "B";

export interface QuestionOption {
  value: DominantType;
  label: string;
}

export interface Question {
  id: number;
  question: string;
  options: [QuestionOption, QuestionOption, QuestionOption]; // H, S, B
}

export const QUESTIONNAIRE: Question[] = [
  {
    id: 1,
    question: "Яс, дугуйн бүтэц ямар байдаг вэ?",
    options: [
      { value: "H", label: "Нарийн / Жижиг (Хий)" },
      { value: "S", label: "Дундаж хэмжээтэй (Шар)" },
      { value: "B", label: "Том / Хүнд (Бадган)" },
    ],
  },
  {
    id: 2,
    question: "Жингийн тогтвортой байдал ямар байдаг вэ?",
    options: [
      { value: "H", label: "Жин нэмэхэд хэцүү (Хий)" },
      { value: "S", label: "Жин тогтвортой (Шар)" },
      { value: "B", label: "Жин хасахад хэцүү (Бадган)" },
    ],
  },
  {
    id: 3,
    question: "Арьсны чанар ямар байдаг вэ?",
    options: [
      { value: "H", label: "Хуурай / Барзгар (Хий)" },
      { value: "S", label: "Улаавтар / Дулаан (Шар)" },
      { value: "B", label: "Цайвар / Чийглэг (Бадган)" },
    ],
  },
  {
    id: 4,
    question: "Халуун хүйтэнд хэрхэн мэдрэгддэг вэ?",
    options: [
      { value: "H", label: "Хүйтэнд мэдрэмтгий (Хий)" },
      { value: "S", label: "Халуунд мэдрэмтгий (Шар)" },
      { value: "B", label: "Чийгт мэдрэмтгий (Бадган)" },
    ],
  },
  {
    id: 5,
    question: "Нойрны хэв маяг ямар байдаг вэ?",
    options: [
      { value: "H", label: "Хөнгөн / Богино нойр (Хий)" },
      { value: "S", label: "Дундаж (Шар)" },
      { value: "B", label: "Гүн / Урт нойр (Бадган)" },
    ],
  },
  {
    id: 6,
    question: "Хоол боловсруулалт ямар байдаг вэ?",
    options: [
      { value: "H", label: "Тогтворгүй (Хий)" },
      { value: "S", label: "Маш хурдан (Шар)" },
      { value: "B", label: "Удаан (Бадган)" },
    ],
  },
  {
    id: 7,
    question: "Яриа, үйл ажиллагааны хурд ямар байдаг вэ?",
    options: [
      { value: "H", label: "Хурдан / Их ярьдаг (Хий)" },
      { value: "S", label: "Хурц / Идэвхтэй (Шар)" },
      { value: "B", label: "Удаан / Тогтвортой (Бадган)" },
    ],
  },
  {
    id: 8,
    question: "Суралцах, санах ойн онцлог ямар байдаг вэ?",
    options: [
      { value: "H", label: "Хурдан сурч, хурдан мартдаг (Хий)" },
      { value: "S", label: "Хурдан сурч, сайн санадаг (Шар)" },
      { value: "B", label: "Удаан сурч, хэзээ ч мартдаггүй (Бадган)" },
    ],
  },
  {
    id: 9,
    question: "Сэтгэл хөдлөлийн байдал ямар байдаг вэ?",
    options: [
      { value: "H", label: "Тэсгим / Санаа зоволт (Хий)" },
      { value: "S", label: "Уурлах / Цочромтгой (Шар)" },
      { value: "B", label: "Тайван / Тогтвортой (Бадган)" },
    ],
  },
  {
    id: 10,
    question: "Мөч (гар, хөл)-ийн байдал ямар байдаг вэ?",
    options: [
      { value: "H", label: "Хүйтэн / Хуурай (Хий)" },
      { value: "S", label: "Халуун / Хөлсний (Шар)" },
      { value: "B", label: "Чийглэг / Сэрүүн (Бадган)" },
    ],
  },
  {
    id: 11,
    question: "Тэсвэр хатуужил ямар байдаг вэ?",
    options: [
      { value: "H", label: "Бага / Хурдан ядардаг (Хий)" },
      { value: "S", label: "Дундаж (Шар)" },
      { value: "B", label: "Өндөр / Тогтвортой (Бадган)" },
    ],
  },
  {
    id: 12,
    question: "Ялгарал (баас)-ын байдал ямар байдаг вэ?",
    options: [
      { value: "H", label: "Хуурай / Өтгөн хатаха (Хий)" },
      { value: "S", label: "Зөөлөн / Шаргал (Шар)" },
      { value: "B", label: "Том хэмжээ / Тогтвортой (Бадган)" },
    ],
  },
];

export interface QuestionnaireResult {
  scores: { H: number; S: number; B: number };
  dominant: DominantType;
  doshaKey: DoshaKey;
  kt: number;
}

/** Maps dominant + secondary score to a DoshaKey */
function mapToDoshaKey(scores: { H: number; S: number; B: number }): DoshaKey {
  const sorted = (["H", "S", "B"] as DominantType[]).sort(
    (a, b) => scores[b] - scores[a]
  );
  const [first, second] = sorted;

  // Perfectly balanced or near-balanced
  if (Math.abs(scores.H - scores.S) <= 1 && Math.abs(scores.S - scores.B) <= 1) {
    return "Tentsveertei";
  }

  if (first === "H" && second === "S") return "Khii_Shar";
  if (first === "H" && second === "B") return "Khii_Badgan";
  if (first === "S" && second === "H") return "Shar_Khii";
  if (first === "S" && second === "B") return "Shar_Badgan";
  if (first === "B" && second === "H") return "Badgan_Khii";
  if (first === "B" && second === "S") return "Badgan_Shar";

  // Pure types
  if (first === "H") return "Khii";
  if (first === "S") return "Shar";
  return "Badgan";
}

const KT_BY_KEY: Record<DoshaKey, number> = {
  Khii: 0.70,
  Khii_Shar: 0.80,
  Khii_Badgan: 0.85,
  Shar_Khii: 0.90,
  Shar: 1.00,
  Tentsveertei: 1.00,
  Shar_Badgan: 1.10,
  Badgan_Khii: 1.25,
  Badgan_Shar: 1.35,
  Badgan: 1.50,
};

export function scoreQuestionnaire(
  answers: Record<number, DominantType>
): QuestionnaireResult {
  const scores = { H: 0, S: 0, B: 0 };
  Object.values(answers).forEach((v) => scores[v]++);

  const dominant = (["H", "S", "B"] as DominantType[]).reduce((a, b) =>
    scores[a] >= scores[b] ? a : b
  );

  const doshaKey = mapToDoshaKey(scores);
  const kt = KT_BY_KEY[doshaKey];

  return { scores, dominant, doshaKey, kt };
}
