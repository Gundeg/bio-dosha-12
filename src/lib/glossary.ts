/**
 * Нэр томьёоны нэгдсэн тайлбар толь — хэрэглэгчид ойлгомжгүй үг бүрийг
 * гарсан газарт нь (Term компонентоор) болон /help хуудсанд тайлбарлана.
 * Хоёр хэлтэй ({mn, en}) — i18n давхаргатай хамт хэрэглэгдэнэ.
 */

export interface GlossaryEntry {
  key: string;
  emoji: string;
  term: { mn: string; en: string };
  short: { mn: string; en: string };
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    key: "makhbod",
    emoji: "🧬",
    term: { mn: "Махбод", en: "Constitution (Dosha)" },
    short: {
      mn: "Таны төрөлхийн биеийн төрөл. Хий, Шар, Бадган гурван хүчний харьцаагаар тодорхойлогдоно.",
      en: "Your inborn body type, defined by the balance of the three forces: Khii, Shar, Badgan.",
    },
  },
  {
    key: "khii",
    emoji: "🌬️",
    term: { mn: "Хий", en: "Khii (Wind / Vata)" },
    short: {
      mn: "Хөдөлгөөний хүч — хөнгөн, хүйтэн, хуурай чанартай. Илүүдвэл түгшүүр, нойргүйдэл, хуурайшилт илэрдэг.",
      en: "The force of movement — light, cold, dry. In excess: anxiety, poor sleep, dryness.",
    },
  },
  {
    key: "shar",
    emoji: "🔥",
    term: { mn: "Шар", en: "Shar (Fire / Pitta)" },
    short: {
      mn: "Илч, хувиргалтын хүч — халуун, хурц чанартай. Илүүдвэл уур уцаар, үрэвсэл, халуу оргих байдал илэрдэг.",
      en: "The force of heat and transformation — hot, sharp. In excess: irritability, inflammation, heat.",
    },
  },
  {
    key: "badgan",
    emoji: "🏔️",
    term: { mn: "Бадган", en: "Badgan (Earth-Water / Kapha)" },
    short: {
      mn: "Тогтвор, бүтцийн хүч — хүнд, тослог, хүйтэн чанартай. Илүүдвэл жин нэмэгдэх, залхуурал, бөглөрөл илэрдэг.",
      en: "The force of stability and structure — heavy, oily, cold. In excess: weight gain, sluggishness, congestion.",
    },
  },
  {
    key: "bedi",
    emoji: "🧭",
    term: { mn: "BEDI индекс", en: "BEDI index" },
    short: {
      mn: "Bio-Energetic Dosha Index — жин, өндөр, нас, улирал, махбодын Kt-г нэгтгэсэн биеийн тэнцвэрийн үзүүлэлт.",
      en: "Bio-Energetic Dosha Index — a single balance score combining weight, height, age, season and your Kt.",
    },
  },
  {
    key: "kt",
    emoji: "🔢",
    term: { mn: "Kt коэффициент", en: "Kt coefficient" },
    short: {
      mn: "Таны махбодын суурь тоо (0.70–1.50). 12 асуултын үнэлгээгээр нэг удаа тодорхойлогдоно.",
      en: "Your constitutional base number (0.70–1.50), determined once by the 12-question assessment.",
    },
  },
  {
    key: "khazailt",
    emoji: "⚖️",
    term: { mn: "Хазайлт (Δ)", en: "Deviation (Δ)" },
    short: {
      mn: "Байх ёстой хэвийн жингээс хэр зөрсөнийг харуулна. 0 = яг тэнцвэр; −0.29-с бага бол Хий, +0.31-с их бол Шар/Бадган арвидсан.",
      en: "How far you are from your expected normal weight. 0 = perfectly balanced; below −0.29 = Wind excess, above +0.31 = Fire/Earth excess.",
    },
  },
  {
    key: "zero-point",
    emoji: "🎯",
    term: { mn: "0 цэг", en: "Zero Point" },
    short: {
      mn: "Биеийн төгс тэнцвэрийн цэг. Луужингийн зүү 0 цэг дээр байвал таны бие өөрийн хэвийн байдалдаа байна гэсэн үг.",
      en: "The point of perfect balance. When the compass needle rests at 0, your body is at its own norm.",
    },
  },
  {
    key: "yorondog",
    emoji: "🌿",
    term: { mn: "Ерөндөг", en: "Remedy" },
    short: {
      mn: "Тэнцвэрийг сэргээх хоол хүнс, дэглэмийн зөвлөмж — жишээ нь Хийд бурам, шар тос; Шарт мөсөн чихэр.",
      en: "Food and lifestyle recommendations that restore balance — e.g. crude sugar and ghee for Wind, rock sugar for Fire.",
    },
  },
  {
    key: "season",
    emoji: "❄️",
    term: { mn: "Улирлын нөлөө", en: "Seasonal effect" },
    short: {
      mn: "Улирал бүр биеийн тэнцвэрт өөр өөрөөр нөлөөлнө: өвөл хүндрүүлж, зун хөнгөрүүлдэг. Тооцоололд автоматаар тусгагдана.",
      en: "Each season tilts the balance differently: winter adds heaviness, summer lightness. Applied automatically.",
    },
  },
];

export const GLOSSARY_BY_KEY: Record<string, GlossaryEntry> = Object.fromEntries(
  GLOSSARY.map((entry) => [entry.key, entry])
);
