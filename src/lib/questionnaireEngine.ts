import { DoshaKey } from "./ktMapping";

export type DominantType = "H" | "S" | "B";

export interface QuestionOption {
  value: DominantType;
  label: string;
  hint: string; // Товч тайлбар
}

export interface Question {
  id: number;
  category: string; // Бүлэг
  question: string;
  options: [QuestionOption, QuestionOption, QuestionOption]; // H, S, B
}

export const QUESTIONNAIRE: Question[] = [
  {
    id: 1,
    category: "Биеийн бүтэц",
    question: "Яс, үений бүтэц ямар вэ?",
    options: [
      { value: "H", label: "Нарийн, жижиг", hint: "Ясны тохой, судас харагдах, биеийн хүрээ бага" },
      { value: "S", label: "Дундаж, хэвийн", hint: "Дунд зэргийн бие, нарийн ч биш, бүдүүн ч биш" },
      { value: "B", label: "Том, өргөн, хүнд", hint: "Өргөн нуруу, том яс, хүнд биетэй" },
    ],
  },
  {
    id: 2,
    category: "Биеийн бүтэц",
    question: "Жингийн тогтвортой байдал ямар вэ?",
    options: [
      { value: "H", label: "Жин нэмэхэд хэцүү", hint: "Их идсэн ч жин нэмдэггүй, туранхай хэвтэй" },
      { value: "S", label: "Жин тогтвортой", hint: "Жин хэт нэмэгддэггүй, хэт буурдаггүй" },
      { value: "B", label: "Жин хасахад хэцүү", hint: "Цөөн идсэн ч жин нэмдэг, хасахад хэцүү" },
    ],
  },
  {
    id: 3,
    category: "Арьс, нүүр",
    question: "Арьсны чанар ямар вэ?",
    options: [
      { value: "H", label: "Хуурай, барзгар, хагарамтгай", hint: "Арьс хуурайшдаг, тос нэмэлт хэрэгтэй" },
      { value: "S", label: "Дулаан, улаавтар, хөлстэй", hint: "Арьс халуун мэдрэгддэг, амархан улайдаг" },
      { value: "B", label: "Цайвар, чийглэг, зөөлөн", hint: "Арьс чийгтэй, дэлэнтэй, хүйтэн мэдрэгддэг" },
    ],
  },
  {
    id: 4,
    category: "Мэдрэмж",
    question: "Халуун, хүйтэнд хэрхэн мэдрэгддэг вэ?",
    options: [
      { value: "H", label: "Хүйтэнд мэдрэмтгий", hint: "Хүйтэнд тааруухан, халуун газрыг илүүд үздэг" },
      { value: "S", label: "Халуунд мэдрэмтгий", hint: "Халуунд тааруухан, сэрүүн газрыг илүүд үздэг" },
      { value: "B", label: "Чийг, нойтонд мэдрэмтгий", hint: "Чийглэг цаг агаарт ядарч, хуурай дулаан газрыг илүүд үздэг" },
    ],
  },
  {
    id: 5,
    category: "Нойр",
    question: "Нойрны хэв маяг ямар вэ?",
    options: [
      { value: "H", label: "Хөнгөн нойр, цөөн цаг", hint: "Амархан сэрдэг, нойр хүрэхэд удаан, 5-6 цаг хангалттай" },
      { value: "S", label: "Дундаж, тогтмол нойр", hint: "7-8 цаг тогтмол унтдаг, нойр хэвийн" },
      { value: "B", label: "Гүн нойр, урт цаг", hint: "Унтаж байх дуртай, 9-10+ цаг унтдаг, босоход хэцүү" },
    ],
  },
  {
    id: 6,
    category: "Хоол боловсруулалт",
    question: "Хоол шингэлт, хоолны дуршил ямар вэ?",
    options: [
      { value: "H", label: "Тогтворгүй, цагаас хамаарна", hint: "Заримдаа хоолны дуршил байдаг, заримдаа байдаггүй" },
      { value: "S", label: "Хурдан шингэдэг, их дурладаг", hint: "Хоол амархан шингэдэг, хоол алгасвал бухимддаг" },
      { value: "B", label: "Удаан шингэдэг, бага иддэг", hint: "Цөөхөн хоолоор хангалттай, шингэлт удаан" },
    ],
  },
  {
    id: 7,
    category: "Үйл ажиллагаа",
    question: "Ярих, хөдлөх хурд ямар вэ?",
    options: [
      { value: "H", label: "Хурдан, их ярьдаг", hint: "Санаа хурдан шилждэг, их ярьдаг, хурдан алхдаг" },
      { value: "S", label: "Хурц, зорилготой", hint: "Тодорхой, шийдэмгий ярьдаг, хурдан алхдаг" },
      { value: "B", label: "Тайван, удаан, тогтвортой", hint: "Бодолтой ярьдаг, удаан алхдаг, тогтвортой" },
    ],
  },
  {
    id: 8,
    category: "Оюун ухаан",
    question: "Суралцах, санах ойн онцлог ямар вэ?",
    options: [
      { value: "H", label: "Хурдан сурч, хурдан мартдаг", hint: "Шинэ зүйл хурдан ойлгодог ч удалгүй мартдаг" },
      { value: "S", label: "Хурдан сурч, сайн санадаг", hint: "Хурдан ойлгоод удаан санадаг" },
      { value: "B", label: "Удаан сурч, хэзээ ч мартдаггүй", hint: "Ойлгоход цаг хэрэгтэй ч нэгэнт сурсан бол мартдаггүй" },
    ],
  },
  {
    id: 9,
    category: "Сэтгэл хөдлөл",
    question: "Сэтгэл хөдлөлийн байдал ямар вэ?",
    options: [
      { value: "H", label: "Санаа зовдог, тэсгим", hint: "Ирээдүйд санаа зовдог, шийдэмгий биш, хандлага байнга өөрчлөгддөг" },
      { value: "S", label: "Идэвхтэй, уурлах нь хурдан", hint: "Тодорхой бодолтой, зорилгодоо хүрэх дуртай, шударга" },
      { value: "B", label: "Тайван, тогтвортой, уйтгар", hint: "Ховор уурладаг, тогтвортой ч заримдаа уйтгарладаг" },
    ],
  },
  {
    id: 10,
    category: "Гар, хөл",
    question: "Гар, хөлийн байдал ямар вэ?",
    options: [
      { value: "H", label: "Хүйтэн, хуурай", hint: "Гар, хөл байнга хүйтэн, ялангуяа өвөлдөө" },
      { value: "S", label: "Халуун, хөлстэй", hint: "Гар, хөл дулаан, амархан хөлсддөг" },
      { value: "B", label: "Сэрүүн, чийглэг", hint: "Гар нэлэнхүйдээ сэрүүн, чийглэг мэдрэгддэг" },
    ],
  },
  {
    id: 11,
    category: "Тэсвэр",
    question: "Биеийн тэсвэр хатуужил ямар вэ?",
    options: [
      { value: "H", label: "Бага, хурдан ядардаг", hint: "Богино хугацааны ажилд сайн ч удаан ажил хийхэд ядардаг" },
      { value: "S", label: "Дундаж, тогтмол", hint: "Тогтмол ажилдаа сайн, хэт их ачаалалд дутаж болно" },
      { value: "B", label: "Өндөр, маш тэсвэртэй", hint: "Удаан хугацааны ажилд сайн, бие хурдан ядардаггүй" },
    ],
  },
  {
    id: 12,
    category: "Хэвлий",
    question: "Гэдэс, хэвлийн байдал ямар вэ?",
    options: [
      { value: "H", label: "Хатуурдаг, хуурай", hint: "Цэцэрхэй болдог, баас хатуу" },
      { value: "S", label: "Зөөлөн, тогтмол", hint: "Тогтмол хэвийн, шаргал өнгөтэй" },
      { value: "B", label: "Бүдүүн, удаан, тогтвортой", hint: "Их хэмжээтэй, гэдэс дүүргэх мэт" },
    ],
  },
];

export interface QuestionnaireResult {
  scores: { H: number; S: number; B: number };
  dominant: DominantType;
  doshaKey: DoshaKey;
  kt: number;
}

function mapToDoshaKey(scores: { H: number; S: number; B: number }): DoshaKey {
  const sorted = (["H", "S", "B"] as DominantType[]).sort(
    (a, b) => scores[b] - scores[a]
  );
  const [first, second] = sorted;

  if (Math.abs(scores.H - scores.S) <= 1 && Math.abs(scores.S - scores.B) <= 1) {
    return "Tentsveertei";
  }

  if (first === "H" && second === "S") return "Khii_Shar";
  if (first === "H" && second === "B") return "Khii_Badgan";
  if (first === "S" && second === "H") return "Shar_Khii";
  if (first === "S" && second === "B") return "Shar_Badgan";
  if (first === "B" && second === "H") return "Badgan_Khii";
  if (first === "B" && second === "S") return "Badgan_Shar";

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
