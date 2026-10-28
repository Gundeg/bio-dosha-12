import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button-link";
import type { DoshaKey } from "@/lib/ktMapping";

const DOSHA_TYPES: { key: DoshaKey; kt: string; color: string; dot: string }[] = [
  { key: "Khii",         kt: "0.70", color: "border-blue-200 bg-blue-50",      dot: "bg-blue-400" },
  { key: "Khii_Shar",    kt: "0.80", color: "border-sky-200 bg-sky-50",         dot: "bg-sky-400" },
  { key: "Khii_Badgan",  kt: "0.85", color: "border-cyan-200 bg-cyan-50",       dot: "bg-cyan-400" },
  { key: "Shar_Khii",    kt: "0.90", color: "border-orange-200 bg-orange-50",   dot: "bg-orange-400" },
  { key: "Shar",         kt: "1.00", color: "border-amber-200 bg-amber-50",     dot: "bg-amber-400" },
  { key: "Tentsveertei", kt: "1.00", color: "border-emerald-200 bg-emerald-50", dot: "bg-emerald-400" },
  { key: "Shar_Badgan",  kt: "1.10", color: "border-yellow-200 bg-yellow-50",   dot: "bg-yellow-400" },
  { key: "Badgan_Khii",  kt: "1.25", color: "border-slate-200 bg-slate-50",     dot: "bg-slate-400" },
  { key: "Badgan_Shar",  kt: "1.35", color: "border-stone-200 bg-stone-50",     dot: "bg-stone-400" },
  { key: "Badgan",       kt: "1.50", color: "border-violet-200 bg-violet-50",   dot: "bg-violet-400" },
];

const STEPS = [
  {
    id: "s1",
    num: "01",
    icon: "🌀",
    accent: "border-blue-200 bg-blue-50",
    num_color: "text-blue-700",
  },
  {
    id: "s2",
    num: "02",
    icon: "⚖",
    accent: "border-amber-200 bg-amber-50",
    num_color: "text-amber-700",
  },
  {
    id: "s3",
    num: "03",
    icon: "✦",
    accent: "border-emerald-200 bg-emerald-50",
    num_color: "text-emerald-700",
  },
] as const;

const STATS = [
  { value: "10", key: "constitutionTypes" },
  { value: "12", key: "questions" },
  { value: "4", key: "seasonFactors" },
  { value: "Δ", key: "deviation" },
] as const;

const AUDIENCES = [
  {
    id: "individual",
    icon: "👤",
    color: "border-blue-200",
    badge: "bg-blue-50 text-blue-700",
  },
  {
    id: "practitioner",
    icon: "🏥",
    color: "border-violet-200",
    badge: "bg-violet-50 text-violet-700",
  },
] as const;

export default async function LandingPage() {
  const tLegal = await getTranslations("legal");
  const t = await getTranslations("landing");
  const tDosha = await getTranslations("dosha");
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              aria-hidden="true"
              className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center"
            >
              <span className="text-white text-xs font-black">BD</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-slate-800 tracking-tight">Bio-Dosha-12</span>
              <span className="text-[10px] text-slate-600 hidden sm:block">{t("header.brandSubtitle")}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <ButtonLink variant="outline" href="/login" size="sm">{t("header.login")}</ButtonLink>
            <ButtonLink href="/register" size="sm">{t("header.register")}</ButtonLink>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              {t("hero.badge")}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
              {t("hero.titleLine1")}
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-violet-600">
                {t("hero.titleLine2")}
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
              {t("hero.lead")}
            </p>
            <div className="mt-10 flex gap-3 justify-center flex-wrap">
              <ButtonLink size="lg" href="/register">
                {t("hero.ctaStart")} <span aria-hidden="true">→</span>
              </ButtonLink>
              <ButtonLink size="lg" variant="outline" href="/login">{t("hero.ctaLogin")}</ButtonLink>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-y border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, key }) => (
              <div key={key}>
                <p className="text-3xl font-black text-slate-800">{value}</p>
                <p className="text-sm text-slate-600 mt-1">{t(`stats.${key}`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-800">{t("steps.title")}</h2>
            <p className="text-slate-600 text-sm mt-2">{t("steps.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map(({ id, num, icon, accent, num_color }) => (
              <div key={num} className={`rounded-2xl border-2 ${accent} p-6 space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-3xl font-black ${num_color}`}>{num}</span>
                    <span aria-hidden="true" className="text-2xl">{icon}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-white/70 border border-white rounded-full px-2.5 py-1">
                    {t(`steps.${id}.tag`)}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-800">{t(`steps.${id}.title`)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(`steps.${id}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dosha types */}
        <section className="bg-white border-y border-slate-100 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-slate-800">{t("types.title")}</h2>
              <p className="text-sm text-slate-600 mt-2">
                {t("types.subtitle")}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {DOSHA_TYPES.map(({ key, kt, color, dot }) => (
                <div
                  key={key}
                  className={`border rounded-xl p-4 text-center ${color} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <span aria-hidden="true" className={`w-2 h-2 rounded-full ${dot}`} />
                    <p className="font-bold text-sm text-slate-800">{tDosha(`${key}.label`)}</p>
                  </div>
                  <p className="text-xs text-slate-600 font-mono font-semibold">Kt = {kt}</p>
                  <p className="text-xs text-slate-600 mt-1">{t(`types.desc.${key}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Target users */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-800">{t("audience.title")}</h2>
            <p className="text-slate-600 text-sm mt-2">{t("audience.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {AUDIENCES.map(({ id, icon, color, badge }) => (
              <div key={id} className={`bg-white rounded-2xl border-2 ${color} p-7 shadow-sm space-y-5`}>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span aria-hidden="true" className="text-3xl">{icon}</span>
                    <h3 className="text-xl font-bold text-slate-800">{t(`audience.${id}.title`)}</h3>
                  </div>
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${badge}`}>
                    {t(`audience.${id}.subtitle`)}
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {(t.raw(`audience.${id}.features`) as string[]).map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <span
                        aria-hidden="true"
                        className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0"
                      >
                        ✓
                      </span>
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
            <h2 className="text-3xl font-bold text-white mb-3">{t("cta.title")}</h2>
            <p className="text-blue-50 mb-8 text-lg">{t("cta.body")}</p>
            <ButtonLink size="lg" href="/register" className="bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-lg">
              {t("cta.button")} <span aria-hidden="true">→</span>
            </ButtonLink>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white px-4 py-8 text-center text-sm text-slate-600 space-y-3">
        <p className="mx-auto max-w-2xl text-xs leading-relaxed text-slate-600">{tLegal("disclaimer")}</p>
        <p>
          {t("footer.credit")}{" "}
          <Link href="/privacy" className="font-medium text-blue-700 hover:underline">
            {tLegal("privacyLink")}
          </Link>
        </p>
      </footer>
    </div>
  );
}
