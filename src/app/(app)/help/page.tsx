import Link from "next/link";
import { GLOSSARY } from "@/lib/glossary";

export const metadata = {
  title: "Тусламж | Bio-Dosha-12",
};

const STEPS = [
  {
    icon: "🧬",
    title: "1. Махбодоо тодорхойл",
    body: "12 энгийн асуултад нэг удаа хариулахад таны төрөлхийн биеийн төрөл (махбод) болон суурь тоо Kt тогтоогдоно. Зөв, буруу хариулт гэж байхгүй.",
  },
  {
    icon: "⚖️",
    title: "2. Өдөр бүр 30 секунд хэмж",
    body: "Зөвхөн жингээ оруулахад л хангалттай — улирал автоматаар тооцогдож, биеийн тэнцвэрийн BEDI индекс шууд гарна.",
  },
  {
    icon: "🌿",
    title: "3. Зөвлөмжөө дага",
    body: "Хазайлтад тань тохирсон хоол хүнс, дэглэмийн ерөндөг автоматаар санал болгогдоно. Насны онцлог (хүүхэд, ахмад) давхар тооцогдоно.",
  },
];

const FAQ = [
  {
    q: "Үнэлгээг хэдэн удаа хийх ёстой вэ?",
    a: "Нэг л удаа. Махбод бол таны төрөлхийн чанар тул өөрчлөгддөггүй. Харин жингээ өдөр бүр эсвэл долоо хоног бүр оруулж тэнцвэрээ хянана. Буруу хариулсан гэж бодвол үнэлгээг хэдийд ч дахин хийж болно.",
  },
  {
    q: "«Тэнцвэртэй» гэж юу гэсэн үг вэ?",
    a: "Таны жин өөрийн махбод, өндөрт тохирсон хэвийн хэмжээндээ байна гэсэн үг. Хазайлт 0 цэгт ойр байх тусмаа сайн.",
  },
  {
    q: "Яагаад өвөл, зун өөр үр дүн гардаг вэ?",
    a: "Улирал бүр биед өөрөөр нөлөөлдөг: өвөл Бадган талруу хүндрүүлж, зун Хий талруу хөнгөрүүлдэг. Энэ жам ёсны хэлбэлзэл тул тооцоололд автоматаар тусгагддаг.",
  },
  {
    q: "Гэр бүлийн гишүүдээ хэрхэн хянах вэ?",
    a: "«Гэр бүл» хэсгээс гишүүн нэмээд, тухайн гишүүнд зориулж үнэлгээ хийнэ. Дараа нь гишүүн бүрийн жинг тус тусад нь оруулж хянана.",
  },
  {
    q: "Хүүхдэд ямар онцлог үйлчилдэг вэ?",
    a: "13 хүртэлх насны хүүхдэд зөгийн бал огт хориглодог — систем үүнийг автоматаар шүүж, насанд тохирсон зөвлөмж л гаргана.",
  },
  {
    q: "Эмч (Тб оточ) эрхийг хэрхэн авах вэ?",
    a: "Бүртгүүлэхдээ «Тб оточ» төрлийг сонгоход хүсэлт админд илгээгдэнэ. Админ баталсны дараа дахин нэвтрэхэд эмчийн цэс (Өвчтөнүүд, Тайлан) нээгдэнэ.",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Тусламж
        </p>
        <h1 className="text-2xl font-bold">Хэрхэн ажилладаг вэ?</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bio-Dosha-12 — уламжлалт анагаах ухааны махбодын онолыг орчин үеийн
          тооцооллын аргатай хослуулсан биеийн тэнцвэрийн хяналт.
        </p>
      </header>

      {/* 3 алхам */}
      <section className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5"
          >
            <span className="text-3xl" aria-hidden>
              {step.icon}
            </span>
            <h2 className="mt-3 font-semibold text-sm">{step.title}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </div>
        ))}
      </section>

      {/* Тайлбар толь */}
      <section aria-labelledby="glossary-heading">
        <h2 id="glossary-heading" className="text-lg font-bold mb-3">
          Тайлбар толь
        </h2>
        <dl className="space-y-3">
          {GLOSSARY.map((entry) => (
            <div
              key={entry.key}
              id={entry.key}
              className="scroll-mt-24 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3"
            >
              <dt className="flex items-center gap-2 font-semibold text-sm">
                <span aria-hidden>{entry.emoji}</span>
                {entry.term.mn}
                <span className="text-xs font-normal text-muted-foreground">
                  · {entry.term.en}
                </span>
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {entry.short.mn}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Түгээмэл асуулт */}
      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-lg font-bold mb-3">
          Түгээмэл асуулт
        </h2>
        <div className="space-y-2">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3"
            >
              <summary className="cursor-pointer list-none font-medium text-sm flex items-center justify-between gap-2">
                {item.q}
                <span
                  aria-hidden
                  className="material-symbols-outlined text-[18px] text-muted-foreground transition-transform group-open:rotate-180"
                >
                  expand_more
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Судалгааны үндэслэл */}
      <section
        aria-labelledby="methodology-heading"
        className="rounded-2xl border border-primary/20 bg-primary/5 p-5"
      >
        <h2 id="methodology-heading" className="text-lg font-bold">
          Судалгааны үндэслэл
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          BEDI аргачлал нь «Төмөрбаатар Оточ» уламжлалт анагаах ухааны эмнэлэгт
          2023–2025 онд хийгдсэн, <strong>400 өвчний түүх</strong> хамарсан
          судалгаагаар баталгаажсан. Нас, өндөр, жингийн хамаарлаар тооцсон
          хазайлтын статистик босго (стандарт хазайлтад суурилсан) нь эмчийн
          бодит оноштой <strong>81% яг таарч</strong>, статистикийн өндөр ач
          холбогдолтой (p&nbsp;&lt;&nbsp;0.01) хамаарал тогтоогдсон.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          В.Төмөрбаатар, «Нас, өндөр, жингийн хамаарлаар хүний биеийн
          өвөрчлөлийг тодорхойлох нь», «Төмөрбаатар Оточ» эмнэлэг.
        </p>
      </section>

      {/* Disclaimer + холбоо барих */}
      <footer className="space-y-3 pb-6">
        <p className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
          ⚕️ Энэхүү систем нь эмчийн үзлэг, оношилгоог орлохгүй. Зөвлөмжийг
          хэрэгжүүлэхийн өмнө мэргэжлийн эмчтэй зөвлөлдөнө үү. Эрүүл мэндийн
          ноцтой асуудал илэрвэл эмнэлэгт хандаарай.
        </p>
        <p className="text-xs text-muted-foreground">
          Асуулт, санал хүсэлтээ{" "}
          <Link href="/dashboard" className="text-primary hover:underline">
            самбараас
          </Link>{" "}
          эсвэл бүртгэлтэй эмчээсээ асуугаарай.
        </p>
      </footer>
    </div>
  );
}
