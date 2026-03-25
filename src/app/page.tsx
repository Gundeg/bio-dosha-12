import { ButtonLink } from "@/components/ui/button-link";

const DOSHA_TYPES = [
  { label: "Хий",         kt: "0.70", color: "border-blue-200 bg-blue-50",    dot: "bg-blue-400",    desc: "Хөнгөн · Хүйтэн" },
  { label: "Хий-Шар",    kt: "0.80", color: "border-sky-200 bg-sky-50",       dot: "bg-sky-400",     desc: "Хөнгөн · Хурц" },
  { label: "Хий-Бадган", kt: "0.85", color: "border-cyan-200 bg-cyan-50",     dot: "bg-cyan-400",    desc: "Хүйтэн · Тогтворгүй" },
  { label: "Шар-Хий",    kt: "0.90", color: "border-orange-200 bg-orange-50", dot: "bg-orange-400",  desc: "Халуун · Хурдан" },
  { label: "Шар",         kt: "1.00", color: "border-amber-200 bg-amber-50",   dot: "bg-amber-400",   desc: "Халуун · Хурц" },
  { label: "Тэнцвэртэй", kt: "1.00", color: "border-emerald-200 bg-emerald-50",dot: "bg-emerald-400",desc: "Тэнцвэртэй" },
  { label: "Шар-Бадган", kt: "1.10", color: "border-yellow-200 bg-yellow-50", dot: "bg-yellow-400",  desc: "Халуун · Тослог" },
  { label: "Бадган-Хий", kt: "1.25", color: "border-slate-200 bg-slate-50",   dot: "bg-slate-400",   desc: "Хүнд · Хүйтэн" },
  { label: "Бадган-Шар", kt: "1.35", color: "border-stone-200 bg-stone-50",   dot: "bg-stone-400",   desc: "Хүнд · Халуун" },
  { label: "Бадган",      kt: "1.50", color: "border-violet-200 bg-violet-50", dot: "bg-violet-400",  desc: "Хүнд · Мохоо" },
];

const STEPS = [
  {
    num: "01", icon: "🌀",
    title: "12 Асуултын Үнэлгээ",
    desc: "Ясны бүтэц, нойр, хоол боловсруулалт зэрэг 12 асуулт хариулж таны Kt коэффициентийг тогтооно.",
    accent: "border-blue-200 bg-blue-50", num_color: "text-blue-500",
  },
  {
    num: "02", icon: "⚖",
    title: "BEDI Тооцоолол",
    desc: "Жин, улирал, нас, хүйс, Kt ашиглан BEDI индекс тооцоолж хазайлт Δ тодорхойлно.",
    accent: "border-amber-200 bg-amber-50", num_color: "text-amber-500",
  },
  {
    num: "03", icon: "✦",
    title: "Алтан Ерөндөг",
    desc: "Хий, Шар, Бадган хазайлтад тулгуурлан хоол тэжээл болон амьдралын хэв маягийн зөвлөмж гарна.",
    accent: "border-emerald-200 bg-emerald-50", num_color: "text-emerald-500",
  },
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
              <span className="text-[10px] text-slate-400 hidden sm:block">Тб оточ</span>
            </div>
          </div>
          <div className="flex gap-2">
            <ButtonLink variant="outline" href="/login" size="sm">Нэвтрэх</ButtonLink>
            <ButtonLink href="/register" size="sm">Бүртгүүлэх</ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Монгол уламжлалт анагаах ухаан × Математик алгоритм
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Биеийн дотоод
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-violet-600">
              тэнцвэрийг тооцоол
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-500 leading-relaxed">
            Bio-Dosha-12 нь таны биеийн хазайлтыг (Δ) нас, хүйс, улирал, махбодийн
            коэффицентийг ашиглан тооцоолж, алтан ерөндөгийг санал болгодог.
          </p>
          <div className="mt-10 flex gap-3 justify-center flex-wrap">
            <ButtonLink size="lg" href="/register">Үнэгүй эхлэх →</ButtonLink>
            <ButtonLink size="lg" variant="outline" href="/login">Нэвтрэх</ButtonLink>
          </div>
        </div>
      </section>

      {/* Formula */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Үндсэн томьёо
          </p>
          <div className="text-xl sm:text-2xl font-mono font-bold text-slate-800 bg-slate-50 rounded-xl px-6 py-4 inline-block border border-slate-100">
            BEDI = (Жин × Хүйс × Улирал) ÷ (Өндөр × Нас × Kt)
          </div>
          <div className="mt-6 grid grid-cols-3 gap-6 text-sm">
            {[
              { label: "Kt коэффициент", value: "0.7 – 1.5", sub: "12 махбодийн утга", color: "text-violet-600" },
              { label: "Улирлын хүчин зүйл", value: "1.0 – 2.0", sub: "Галын илчийн хэлбэлзэл", color: "text-amber-600" },
              { label: "Хүйсийн хүчин зүйл", value: "♂ 1.1 · ♀ 1.0", sub: "Физиологийн ялгаа", color: "text-blue-600" },
            ].map(({ label, value, sub, color }) => (
              <div key={label}>
                <p className={`text-base font-bold ${color}`}>{value}</p>
                <p className="font-semibold text-slate-700 text-xs mt-1">{label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-10">Хэрхэн ажилладаг вэ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map(({ num, icon, title, desc, accent, num_color }) => (
            <div key={num} className={`rounded-2xl border-2 ${accent} p-6 space-y-3`}>
              <div className="flex items-center gap-3">
                <span className={`text-3xl font-black ${num_color}`}>{num}</span>
                <span className="text-2xl">{icon}</span>
              </div>
              <h3 className="font-bold text-lg text-slate-800">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dosha types */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-3">10 Махбодийн Төрөл</h2>
        <p className="text-center text-sm text-slate-400 mb-8">
          Хий (Агаар) · Шар (Гал) · Бадган (Газар) — гурван элементийн харьцаа
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {DOSHA_TYPES.map(({ label, kt, color, dot, desc }) => (
            <div
              key={label}
              className={`border rounded-xl p-3.5 text-center ${color} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <p className="font-bold text-sm text-slate-800">{label}</p>
              </div>
              <p className="text-xs text-slate-500 font-mono font-semibold">Kt = {kt}</p>
              <p className="text-xs text-slate-400 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Target users */}
      <section className="bg-white border-y border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-10">Хэнд зориулагдсан вэ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                icon: "👤", title: "Хувь хүн", color: "border-blue-200",
                features: [
                  "Өөрийн BEDI хяналт",
                  "Гэр бүлийн гишүүд нэмэх",
                  "Улирлын ерөндөг авах",
                  "BEDI хандлагын график",
                ],
              },
              {
                icon: "🏥", title: "Тб оточ (Эмч)", color: "border-violet-200",
                features: [
                  "Олон өвчтөн удирдах",
                  "Клиникийн тэмдэглэл",
                  "PDF тайлан хэвлэх",
                  "Нарийн үнэлгээний систем",
                ],
              },
            ].map(({ icon, title, color, features }) => (
              <div key={title} className={`bg-white rounded-2xl border-2 ${color} p-6 space-y-4 shadow-sm`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{icon}</span>
                  <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                </div>
                <ul className="space-y-2">
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
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-3">Биеийн тэнцвэрийг хянаж эхлэ</h2>
        <p className="text-slate-500 mb-8 text-lg">Бүртгэл үнэгүй. Үнэлгээ болон тооцоолол шууд эхэлнэ.</p>
        <ButtonLink size="lg" href="/register">Одоо эхлэх →</ButtonLink>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <p>Bio-Dosha-12 © 2026 · Тб оточ · Монгол уламжлалт анагаах ухаан</p>
      </footer>
    </div>
  );
}
