import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-slate-800">Bio-Dosha-12</span>
            <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">Тб оточ</span>
          </div>
          <div className="flex gap-3">
            <ButtonLink variant="outline" href="/login">Нэвтрэх</ButtonLink>
            <ButtonLink href="/register">Бүртгүүлэх</ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Монгол уламжлалт анагаах ухаан × Математик алгоритм
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
          Биеийн тэнцвэрийг
          <br />
          <span className="text-blue-600">тооцоолох систем</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Bio-Dosha-12 нь таны биеийн дотоод тэнцвэрийн хазайлтыг (Δ) нас, хүйс,
          улирал, махбодийн коэффицентийг ашиглан тооцоолж, алтан ерөндөгийг санал болгодог.
        </p>
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <ButtonLink size="lg" href="/register">Үнэгүй эхлэх →</ButtonLink>
          <ButtonLink size="lg" variant="outline" href="/login">Нэвтрэх</ButtonLink>
        </div>
      </section>

      {/* Formula */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <Card className="border-2 border-blue-100">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">Үндсэн томьёо (The Algorithm)</p>
            <div className="text-xl font-mono font-bold text-slate-800">
              BEDI = (Жин × Хүйс × Улирал) / (Өндөр × Нас × Kt)
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <strong className="text-slate-700">Kt</strong>
                <br />0.7 – 1.5
                <br />12 махбодийн коэффициент
              </div>
              <div>
                <strong className="text-slate-700">Улирал</strong>
                <br />1.0 – 2.0
                <br />Галын илчийн хэлбэлзэл
              </div>
              <div>
                <strong className="text-slate-700">Хүйс</strong>
                <br />Эрэгтэй 1.1
                <br />Эмэгтэй 1.0
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Steps */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-center mb-10">Хэрхэн ажилладаг вэ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "12 Асуултын Үнэлгээ",
              desc: "Ясны бүтэц, нойр, хоол боловсруулалт гэх мэт 12 асуулт — таны Kt коэффицентийг тогтооно.",
              color: "bg-blue-50 border-blue-200",
              textColor: "text-blue-600",
            },
            {
              step: "02",
              title: "BEDI Тооцоолол",
              desc: "Жин, улирал, нас, хүйс, Kt ашиглан тооцоолж хазайлт (Δ) тодорхойлно.",
              color: "bg-green-50 border-green-200",
              textColor: "text-green-600",
            },
            {
              step: "03",
              title: "Алтан Ерөндөг",
              desc: "Хий, Шар, Бадган хазайлтад тулгуурлан хоол тэжээлийн болон амьдралын хэв маягийн зөвлөмж гарна.",
              color: "bg-amber-50 border-amber-200",
              textColor: "text-amber-600",
            },
          ].map(({ step, title, desc, color, textColor }) => (
            <Card key={step} className={`border-2 ${color}`}>
              <CardContent className="pt-6 pb-6 space-y-3">
                <div className={`text-4xl font-bold ${textColor}`}>{step}</div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Dosha types */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-center mb-10">10 Махбодийн Төрөл</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: "Хий", kt: "0.70", desc: "Хөнгөн, Хүйтэн" },
            { label: "Хий-Шар", kt: "0.80", desc: "Хөнгөн, Хурц" },
            { label: "Хий-Бадган", kt: "0.85", desc: "Хүйтэн, Тогтворгүй" },
            { label: "Шар-Хий", kt: "0.90", desc: "Халуун, Хөдөлгөөнтэй" },
            { label: "Шар", kt: "1.00", desc: "Халуун, Хурц" },
            { label: "Тэнцвэртэй", kt: "1.00", desc: "Тэнцвэр" },
            { label: "Шар-Бадган", kt: "1.10", desc: "Халуун, Тослог" },
            { label: "Бадган-Хий", kt: "1.25", desc: "Хүнд, Хүйтэн" },
            { label: "Бадган-Шар", kt: "1.35", desc: "Хүнд, Халуун" },
            { label: "Бадган", kt: "1.50", desc: "Хүнд, Мохоо" },
          ].map(({ label, kt, desc }) => (
            <div
              key={label}
              className="border rounded-xl p-3 text-center bg-white hover:border-primary transition-colors"
            >
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">Kt = {kt}</p>
              <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Target users */}
      <section className="bg-white border-y py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Хэнд зориулагдсан вэ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                emoji: "👤",
                title: "Хувь хүн",
                features: [
                  "Өөрийн BEDI хяналт",
                  "Гэр бүлийн гишүүд нэмэх",
                  "Улирлын ерөндөг авах",
                  "BEDI хандлагын график",
                ],
              },
              {
                emoji: "🏥",
                title: "Тб оточ (Эмч)",
                features: [
                  "Олон өвчтөн удирдах",
                  "Клиникийн тэмдэглэл",
                  "PDF тайлан хэвлэх",
                  "Нарийн үнэлгээний систем",
                ],
              },
            ].map(({ emoji, title, features }) => (
              <Card key={title} className="border-2">
                <CardContent className="pt-6 space-y-3">
                  <div className="text-4xl">{emoji}</div>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <ul className="space-y-1">
                    {features.map((f) => (
                      <li key={f} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-green-500">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Биеийн тэнцвэрийг хянаж эхлэ</h2>
        <p className="text-muted-foreground mb-8">
          Бүртгэл үнэгүй. Үнэлгээ болон тооцоолол шууд эхэлнэ.
        </p>
        <ButtonLink size="lg" href="/register">Одоо эхлэх →</ButtonLink>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>Bio-Dosha-12 © 2026 • Тб оточ • Монгол уламжлалт анагаах ухаан</p>
      </footer>
    </div>
  );
}
