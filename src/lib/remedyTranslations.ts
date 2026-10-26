/**
 * English translations for every text that remedyEngine.ts and potencyEngine.ts
 * produce. Recommendations are stored in the database as these exact Mongolian
 * strings, so the lookup matches the whole string: if an engine text changes,
 * add the new string here (old stored strings stay valid).
 */
const REMEDY_EN = new Map<string, string>([
  // ── BASE_REMEDIES: khii_excess ─────────────────────────────────────────
  ["Шар тос (Тослог цөцгийн тос)", "Ghee (rich clarified butter)"],
  ["Бурам (Боловсруулаагүй чихэр)", "Buram (unrefined cane sugar)"],
  ["Халуун сүү", "Hot milk"],
  ["Халуун ус, цай", "Hot water, tea"],
  ["Сарнайн үр, хатаасан жимс", "Rose hips, dried fruit"],
  ["Хүйтэн, хөлдөөсөн идээн", "Cold and frozen foods"],
  ["Шимгүй, хуурай хоол", "Non-nourishing, dry food"],
  ["Хүйтэн ус", "Cold water"],
  ["Мацаг барих (урт хугацаагаар)", "Fasting (for long periods)"],

  // ── BASE_REMEDIES: balanced ────────────────────────────────────────────
  ["Одоогийн хоол тэжээлийн дэглэмийг хадгалах", "Keep your current diet"],
  ["Улирлын дагуу хоол идэх", "Eat according to the season"],
  ["Дунд зэргийн дасгал хөдөлгөөн", "Moderate exercise"],
  ["Хэт их идэх", "Overeating"],
  ["Нэг махбодын хоолыг хэт их идэх", "Too much food that favours a single constitution"],

  // ── BASE_REMEDIES: shar_badgan_excess ──────────────────────────────────
  ["Мөсөн чихэр (Лёд чихэр)", "Rock sugar (crystal sugar)"],
  ["Арвай (Хоолойн арвай)", "Barley (pearl barley)"],
  ["Зөгийн бал (Насанд хүрэгчдэд)", "Honey (adults only)"],
  ["Хүйтэн, хөнгөн ногоо, жимс", "Cool, light vegetables and fruit"],
  ["Гашуун ногоо (Хулуу, тунис)", "Bitter vegetables (gourd, turnip)"],
  ["Архи, согтууруулах ундаа", "Alcohol and spirits"],
  ["Тослог, хирний хоол", "Fatty, greasy food"],
  ["Халуун ногоо, халуун амт", "Hot spices and pungent flavours"],
  ["Улаан мах их хэмжээгээр", "Large amounts of red meat"],

  // ── RISK_FACTORS ───────────────────────────────────────────────────────
  ["Мэдрэлийн ядаргаа", "Nervous exhaustion"],
  ["Нойргүйдэл", "Insomnia"],
  ["Сэтгэл санааны хямрал", "Low mood"],
  ["Яс, үеийн өвдөлт", "Bone and joint pain"],
  ["Хоол боловсруулалтын асуудал", "Digestive problems"],
  ["Дархлааны сулрал хэт ачааллаас", "Weakened immunity from overwork"],
  ["Элэгний үрэвсэл", "Liver inflammation"],
  ["Чихрийн шижин", "Diabetes"],
  ["Цусны даралт нэмэгдэх", "Raised blood pressure"],
  ["Таргалалт", "Obesity"],
  ["Арьсны үрэвсэл", "Skin inflammation"],

  // ── AGE_REMEDIES ───────────────────────────────────────────────────────
  ["Ясны хатууруулалтанд мах, шөл", "Meat and broth to strengthen the bones"],
  ["Шулуун яс, шөвгийн хоол", "Long-bone broth dishes"],
  ["ЗӨГИЙН БАЛ ОГТООС ХОРИГЛОНО (13 хүртэл нас)", "NO HONEY AT ALL (under 13)"],
  [
    "13 хүртэлх насанд зөгийн бал огт хориглоно. Ясыг хатуужуулах хоол иде.",
    "No honey at all under the age of 13. Eat foods that strengthen the bones.",
  ],
  ["Хавирга мах (өөхтэй болон булчингийн холимог)", "Rib meat (a mix of fat and lean)"],
  ["Мөсөн чихэр (Шарыг хөргөх)", "Rock sugar (cools Shar)"],
  ["13–61 насанд холимог мах, мөсөн чихэр тохиромжтой.", "Ages 13–61: mixed meat and rock sugar are suitable."],
  ["Зөөлөн мах, шөл", "Tender meat, broth"],
  [
    "Бурам + тос (Хийг тэжээх, хуурайшлаас хамгаалах)",
    "Buram + butter (nourishes Khii, protects against dryness)",
  ],
  ["Хатуу, боловсруулахад хэцүү хоол", "Hard, hard-to-digest food"],
  [
    "61+ насанд зөөлөн мах, бурам ба тос Хийг тэжээж, хуурайшлаас хамгаална.",
    "Age 61+: tender meat, buram and butter nourish Khii and protect against dryness.",
  ],

  // ── THERAPY_MAP: Khii ──────────────────────────────────────────────────
  ["Хонины мах", "Mutton"],
  ["Шар тос (тослог цөцгийн тос)", "Ghee (rich clarified butter)"],
  ["Бүлээн сүү", "Warm milk"],
  ["Сармис", "Garlic"],
  ["Бурам (боловсруулаагүй чихэр)", "Buram (unrefined cane sugar)"],
  ["Тостой иллэг (абьянга)", "Oil massage (abhyanga)"],
  ["Дулаан газар амрах", "Rest in a warm place"],
  ["Тогтмол нойр, тогтмол цагт унтах", "Regular sleep, going to bed at the same time"],
  ["Дулаан, тайван орчинд байх", "Stay in warm, calm surroundings"],
  ["Хэт их салхинд гарахаас зайлсхийх", "Avoid too much exposure to wind"],

  // ── THERAPY_MAP: Shar ──────────────────────────────────────────────────
  ["Үхрийн мах", "Beef"],
  ["Арвайн гурил", "Barley flour"],
  ["Тараг", "Yoghurt"],
  ["Цэвэр ус", "Clean water"],
  ["Мөсөн чихэр (арваан чихэр)", "Rock sugar (crystal sugar)"],
  ["Гашуун ногоо (хулуу, тунис)", "Bitter vegetables (gourd, turnip)"],
  ["Сэрүүн орчинд байх", "Stay in cool surroundings"],
  ["Бясалгал, амгалан тайван байдал", "Meditation, peace and calm"],
  ["Цэвэр агаарт алхах (өглөөний цагт)", "Walk in fresh air (in the morning)"],
  ["Халуун нарнаас зайлсхийх", "Avoid the hot sun"],
  ["Хэт их хүчин чармайлт, уур хилэнгээс зайлсхийх", "Avoid overexertion and anger"],

  // ── THERAPY_MAP: Badgan ────────────────────────────────────────────────
  ["Загасны мах", "Fish"],
  ["Зөгийн бал (насанд хүрэгчдэд)", "Honey (adults only)"],
  ["Халуун ногоо (чинжүү, сонгино)", "Hot spices (chilli, onion)"],
  ["Арвай", "Barley"],
  ["Хөнгөн, хуурай хоол", "Light, dry food"],
  ["Гашуун болон халуун амттай идээ", "Bitter and pungent foods"],
  ["Идэвхтэй дасгал хөдөлгөөн (өдөр бүр)", "Active exercise (every day)"],
  ["Нарны гэрэлд байх", "Spend time in sunlight"],
  ["Хааяа мацаг барих", "Fast now and then"],
  ["Хэт их унтахаас зайлсхийх", "Avoid oversleeping"],
  ["Шинэ туршлага, идэвхтэй амьдралын хэв маяг", "New experiences, an active lifestyle"],

  // ── validateRemedy actions ─────────────────────────────────────────────
  [
    "Шарыг сэдрээх эрсдэлтэй тул тунг 30% бууруулж, сэрүүн чанарын идээгээр хавсарна.",
    "Risk of aggravating Shar: reduce the dose by 30% and combine it with cooling foods.",
  ],
  [
    "Хийг сэдрээх эрсдэлтэй тул тунг 50% бууруулж, дулаан чанарын идээгээр хавсарна.",
    "Risk of aggravating Khii: reduce the dose by 50% and combine it with warming foods.",
  ],
  [
    "Бадганыг хүчтэй сэдрээх тул энэ заслыг хэрэглэхгүй байхыг зөвлөж байна.",
    "This remedy strongly aggravates Badgan, so it is best not to use it.",
  ],
  ["Зөвлөмж идэвхтэй.", "Recommendation active."],
]);

/**
 * Returns the English text for a remedy-engine string when `locale` is "en".
 * Any other locale, or a string without a translation, comes back unchanged.
 */
export function translateRemedy(text: string, locale: string): string {
  if (locale !== "en") return text;
  return REMEDY_EN.get(text) ?? text;
}
