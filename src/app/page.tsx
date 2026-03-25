import { ButtonLink } from "@/components/ui/button-link";

const DOSHA_TYPES = [
  { label: "Хий",         kt: "0.70", color: "border-blue-200 bg-blue-50",      dot: "bg-blue-400",    desc: "Хөнгөн · Хүйтэн" },
  { label: "Хий-Шар",    kt: "0.80", color: "border-sky-200 bg-sky-50",         dot: "bg-sky-400",     desc: "Хөнгөн · Хурц" },
  { label: "Хий-Бадган", kt: "0.85", color: "border-cyan-200 bg-cyan-50",       dot: "bg-cyan-400",    desc: "Хүйтэн · Тогтворгүй" },
  { label: "Шар-Хий",    kt: "0.90", color: "border-orange-200 bg-orange-50",   dot: "bg-orange-400",  desc: "Халуун · Хурдан" },
  { label: "Шар",         kt: "1.00", color: "border-amber-200 bg-amber-50",     dot: "bg-amber-400",   desc: "Халуун · Хурц" },
  { label: "Тэнцвэртэй", kt: "1.00", color: "border-emerald-200 bg-emerald-50", dot: "bg-emerald-400", desc: "Тэнцвэртэй" },
  { label: "Шар-Бадган", kt: "1.10", color: "border-yellow-200 bg-yellow-50",   dot: "bg-yellow-400",  desc: "Халуун · Тослог" },
  { label: "Бадган-Хий", kt: "1.25", color: "border-slate-200 bg-slate-50",     dot: "bg-slate-400",   desc: "Хүнд · Хүйтэн" },
  { label: "Бадган-Шар", kt: "1.35", color: "border-stone-200 bg-stone-50",     dot: "bg-stone-400",   desc: "Хүнд · Халуун" },
  { label: "Бадган",      kt: "1.50", color: "border-violet-200 bg-violet-50",   dot: "bg-violet-400",  desc: "Хүнд · Мохоо" },
];

const STEPS = [
  {
    num: "01",
    icon: "🌀",
    title: "Махбодоо тодорхойл",
    desc: "Ясны бүтэц, нойр, хоол боловсруулалт зэрэг 12 асуулт хариулж таны биеийн онцлогт тохирсон Kt коэффициент тогтооно.",
    accent: "border-blue-200 bg-blue-50",
    num_color: "text-blue-500",
    tag: "12 асуулт · 3 минут",
  },
  {
    num: "02",
    icon: "⚖",
    title: "Биеийн тэнцвэр хэмжих",
    desc: "Жин, улирал, нас, хүйс болон Kt коэффициентийг хослуулан BEDI индекс тооцоолж тэнцвэрийн хазайлтыг Δ-ээр илэрхийлнэ.",
    accent: "border-amber-200 bg-amber-50",
    num_color: "text-amber-500",
    tag: "Шуурхай тооцоолол",
  },
  {
    num: "03",
    icon: "✦",
    title: "Хувийн зөвлөмж авах",
    desc: "Хий, Шар, Бадган хазайлтын дагуу улирлын хоол тэжээл, амьдралын хэв маягийн нарийн зөвлөмж автоматаар гарна.",
    accent: "border-emerald-200 bg-emerald-50",
    num_color: "text-emerald-500",
    tag: "Алтан ерөндөг",
  },
];

const STATS = [
  { value: "10", label: "Махбодийн төрөл" },
  { value: "12", label: "Оношилгооны асуулт" },
  { value: "4", label: "Улирлын хүчин зүйл" },
  { value: "Δ", label: "BEDI хазайлтын хяналт" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">BD</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-slate-800 tracking-tight">Bio-Dosha-12</span>
              <span className="text-[10px] text-slate-400 hidden sm:block">Тб оточ А</span>
            </div>
          </div>
          <div className="flex gap-2">
            <ButtonLink variant="outline" href="/login" size="sm">Нэвтрэх</ButtonLink>
            <ButtonLink href="/register" size="sm">Бүртгүүлэх</ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Монгол уламжлалт анагаах ухаан · Тб оточ А
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Биеийн дотоод
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-violet-600">
              тэнцвэрийг мэд
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-xl mx-auto">
            Таны махбод, нас, улирлын онцлогт тулгуурлан BEDI индексийг тооцоолж,
            биеийн хазайлтыг тодорхойлон хувийн ерөндөг санал болгоно.
          </p>
          <div className="mt-10 flex gap-3 justify-center flex-wrap">
            <ButtonLink size="lg" href="/register">Үнэгүй эхлэх →</ButtonLink>
            <ButtonLink size="lg" variant="outline" href="/login">Нэвтрэх</ButtonLink>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-black text-slate-800">{value}</p>
              <p className="text-sm text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-800">Хэрхэн ажилладаг вэ?</h2>
          <p className="text-slate-400 text-sm mt-2">Гурван алхамаар биеийн тэнцвэрийг хянана</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map(({ num, icon, title, desc, accent, num_color, tag }) => (
            <div key={num} className={`rounded-2xl border-2 ${accent} p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`text-3xl font-black ${num_color}`}>{num}</span>
                  <span className="text-2xl">{icon}</span>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-white/70 border border-white rounded-full px-2.5 py-1">
                  {tag}
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-800">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dosha types */}
      <section className="bg-white border-y border-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-800">10 Махбодийн Төрөл</h2>
            <p className="text-sm text-slate-400 mt-2">
              Хий (Агаар) · Шар (Гал) · Бадган (Газар) — гурван элементийн харьцаа
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {DOSHA_TYPES.map(({ label, kt, color, dot, desc }) => (
              <div
                key={label}
                className={`border rounded-xl p-4 text-center ${color} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <p className="font-bold text-sm text-slate-800">{label}</p>
                </div>
                <p className="text-xs text-slate-500 font-mono font-semibold">Kt = {kt}</p>
                <p className="text-xs text-slate-400 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target users */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-800">Хэнд зориулагдсан вэ?</h2>
          <p className="text-slate-400 text-sm mt-2">Хувь хүнээс эмчид хүртэл</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            {
              icon: "👤",
              title: "Хувь хүн ба гэр бүл",
              subtitle: "Өдөр тутмын эрүүл мэндийн хяналт",
              color: "border-blue-200",
              badge: "bg-blue-50 text-blue-700",
              features: [
                "Өөрийн BEDI хяналт",
                "Гэр бүлийн гишүүдийг нэмэх",
                "Улирлын хувийн ерөндөг",
                "BEDI хандлагын график",
              ],
            },
            {
              icon: "🏥",
              title: "Тб оточ (Эмч)",
              subtitle: "Олон өвчтөний нэгдсэн удирдлага",
              color: "border-violet-200",
              badge: "bg-violet-50 text-violet-700",
              features: [
                "Олон өвчтөн удирдах",
                "Клиникийн тэмдэглэл хөтлөх",
                "PDF тайлан хэвлэх",
                "Нарийвчилсан оношилгооны систем",
              ],
            },
          ].map(({ icon, title, subtitle, color, badge, features }) => (
            <div key={title} className={`bg-white rounded-2xl border-2 ${color} p-7 shadow-sm space-y-5`}>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">{icon}</span>
                  <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                </div>
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${badge}`}>
                  {subtitle}
                </span>
              </div>
              <ul className="space-y-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-linear-to-br from-blue-600 to-violet-600 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Биеийн тэнцвэрийг хянаж эхлэ</h2>
          <p className="text-blue-100 mb-8 text-lg">Бүртгэл үнэгүй. Үнэлгээ болон тооцоолол шууд эхэлнэ.</p>
          <ButtonLink size="lg" href="/register" className="bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-lg">
            Одоо эхлэх →
          </ButtonLink>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8 text-center text-sm text-slate-400">
        <p>Bio-Dosha-12 © 2026 · Тб оточ А · Монгол уламжлалт анагаах ухаан</p>
      </footer>
    </div>
  );
}
