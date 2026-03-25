import { ButtonLink } from "@/components/ui/button-link";

const DOSHA_GROUPS = [
  {
    element: "Хий (Агаар)",
    elementDesc: "Wind Element",
    color: "from-blue-500 to-cyan-400",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    dotColor: "bg-blue-400",
    types: [
      { label: "Хий", desc: "Хөнгөн · Хүйтэн" },
      { label: "Хий-Шар", desc: "Хөнгөн · Хурц" },
      { label: "Хий-Бадган", desc: "Хүйтэн · Тогтворгүй" },
    ],
  },
  {
    element: "Шар (Гал)",
    elementDesc: "Fire Element",
    color: "from-amber-500 to-orange-400",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    dotColor: "bg-amber-400",
    types: [
      { label: "Шар-Хий", desc: "Халуун · Хурдан" },
      { label: "Шар", desc: "Халуун · Хурц" },
      { label: "Шар-Бадган", desc: "Халуун · Тослог" },
    ],
  },
  {
    element: "Бадган (Газар)",
    elementDesc: "Earth Element",
    color: "from-violet-500 to-purple-400",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    dotColor: "bg-violet-400",
    types: [
      { label: "Бадган-Хий", desc: "Хүнд · Хүйтэн" },
      { label: "Бадган-Шар", desc: "Хүнд · Халуун" },
      { label: "Бадган", desc: "Хүнд · Мохоо" },
    ],
  },
];

const FEATURES = [
  {
    icon: "🌀",
    title: "12 Асуултын Үнэлгээ",
    desc: "Ясны бүтэц, нойр, хоол боловсруулалт зэрэг 12 асуулт хариулж таны махбодийн хэв шинжийг тогтооно.",
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
  },
  {
    icon: "📊",
    title: "Биеийн Тэнцвэрийн Индекс",
    desc: "Нас, хүйс, улирал, махбодийн коэффицентийг ашиглан биеийн тэнцвэрийн индексийг тооцоолно.",
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
  },
  {
    icon: "✦",
    title: "Алтан Ерөндөг",
    desc: "Хий, Шар, Бадган хазайлтад тулгуурлан хоол тэжээл болон амьдралын хэв маягийн зөвлөмж гарна.",
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
  },
  {
    icon: "📈",
    title: "Хандлагын График",
    desc: "Биеийн тэнцвэрийн өөрчлөлтийг цаг хугацааны турш хянаж, хандлагыг нь ажиглана.",
    gradient: "from-violet-500 to-purple-500",
    bg: "bg-violet-50",
  },
];

const STATS = [
  { value: "12", label: "Асуултын Үнэлгээ" },
  { value: "10", label: "Махбодийн Төрөл" },
  { value: "4", label: "Улирлын Хүчин Зүйл" },
  { value: "3", label: "Гурван Элемент" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center">
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-blue-50/80 via-violet-50/40 to-slate-50" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Монгол уламжлалт анагаах ухаан × Математик алгоритм
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
              Биеийн дотоод{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-violet-600">
                тэнцвэрийг
              </span>
              <br />
              мэдэрч, хянаарай
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
              Bio-Dosha-12 нь Монгол уламжлалт анагаах ухааны Хий, Шар, Бадган гурван
              элементийн тэнцвэрийг шинжлэх ухааны аргаар тооцоолж, танд хувь хүний
              ерөндөг санал болгоно.
            </p>
            <div className="mt-10 flex gap-3 justify-center flex-wrap">
              <ButtonLink size="lg" href="/register">Үнэгүй эхлэх →</ButtonLink>
              <ButtonLink size="lg" variant="outline" href="/login">Нэвтрэх</ButtonLink>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
              {STATS.map(({ value, label }) => (
                <div key={label} className="px-6 py-5 text-center">
                  <p className="text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-violet-600">{value}</p>
                  <p className="text-xs text-slate-400 font-medium mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Боломжууд</p>
          <h2 className="text-3xl font-bold text-slate-800">Хэрхэн ажилладаг вэ?</h2>
          <p className="mt-3 text-slate-400 max-w-lg mx-auto">
            Энгийн 3 алхамаар биеийн тэнцвэрийг тодорхойлж, хувийн зөвлөмж аваарай.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon, title, desc, gradient, bg }) => (
            <div key={title} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center text-2xl mb-4`}>
                {icon}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              <div className={`mt-4 h-1 w-12 rounded-full bg-linear-to-r ${gradient} opacity-60 group-hover:w-full transition-all duration-500`} />
            </div>
          ))}
        </div>
      </section>

      {/* Three Elements */}
      <section className="bg-white border-y border-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">Махбодийн Систем</p>
            <h2 className="text-3xl font-bold text-slate-800">Гурван Элемент, 10 Махбод</h2>
            <p className="mt-3 text-slate-400 max-w-lg mx-auto">
              Хий, Шар, Бадган — бүх зүйлийн үндэс. Тэдгээрийн харьцаагаар 10 махбодийн
              төрөл тодорхойлогдоно.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DOSHA_GROUPS.map(({ element, elementDesc, color, bgColor, borderColor, dotColor, types }) => (
              <div key={element} className={`rounded-2xl border-2 ${borderColor} overflow-hidden`}>
                <div className={`bg-linear-to-r ${color} px-6 py-4`}>
                  <h3 className="text-white font-bold text-lg">{element}</h3>
                  <p className="text-white/70 text-xs">{elementDesc}</p>
                </div>
                <div className="p-5 space-y-3">
                  {types.map(({ label, desc }) => (
                    <div key={label} className={`flex items-center gap-3 ${bgColor} rounded-xl px-4 py-3`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0`} />
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Balanced type */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <p className="font-bold text-slate-800">Тэнцвэртэй</p>
              </div>
              <p className="text-xs text-slate-400">Гурван элемент тэнцвэрт байдалтай</p>
            </div>
          </div>
        </div>
      </section>

      {/* Target users */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Хэрэглэгчид</p>
          <h2 className="text-3xl font-bold text-slate-800">Хэнд зориулагдсан вэ?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            {
              icon: "👤", title: "Хувь хүн",
              gradient: "from-blue-500 to-cyan-500",
              borderColor: "border-blue-200",
              features: [
                "Өөрийн биеийн тэнцвэрийн хяналт",
                "Гэр бүлийн гишүүд нэмэх",
                "Улирлын ерөндөг авах",
                "Хандлагын график харах",
              ],
            },
            {
              icon: "🏥", title: "Тб оточ (Эмч)",
              gradient: "from-violet-500 to-purple-500",
              borderColor: "border-violet-200",
              features: [
                "Олон өвчтөн удирдах",
                "Клиникийн тэмдэглэл хөтлөх",
                "PDF тайлан хэвлэх",
                "Нарийн үнэлгээний систем",
              ],
            },
          ].map(({ icon, title, gradient, borderColor, features }) => (
            <div key={title} className={`bg-white rounded-2xl border-2 ${borderColor} p-7 space-y-5 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center`}>
                  <span className="text-2xl">{icon}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
              </div>
              <ul className="space-y-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-violet-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Биеийн тэнцвэрийг хянаж эхлэ</h2>
          <p className="text-blue-100 mb-8 text-lg max-w-lg mx-auto">
            Бүртгэл үнэгүй. Үнэлгээ болон тооцоолол шууд эхэлнэ.
          </p>
          <ButtonLink size="lg" href="/register" variant="outline" className="bg-white text-blue-600 border-white hover:bg-blue-50">
            Одоо эхлэх →
          </ButtonLink>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-10 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-6 h-6 rounded-md bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <span className="text-white text-[9px] font-black">BD</span>
          </div>
          <span className="text-sm font-bold text-slate-700">Bio-Dosha-12</span>
        </div>
        <p className="text-sm text-slate-400">© 2026 · Тб оточ · Монгол уламжлалт анагаах ухаан</p>
      </footer>
    </div>
  );
}
