import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[3];

const CSS = phaseCss(
  "q3",
  `.q3-root .q3-pinch{animation:q3-squeeze 2s ease-in-out infinite}
@keyframes q3-squeeze{0%,100%{transform:translateY(0)}50%{transform:translateY(2px)}}`
);

/** Инсет доторх томруулсан арьсны нугалаа (майхан хэлбэрийн атираа). */
const FOLD_D = "M148 88 Q162 86 170 70 Q182 44 194 70 Q202 86 216 88";

/** Арьсны сорил: шууны арьсыг чимхээд томруулж харна — хуурай / улайсан / чийглэг. */
export function Q03SkinPinch({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q3"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: хэвтээ шуу + сул атгасан сарвуу, дээрээс чимхэж буй эрхий/долоовор хуруу */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {/* шуу */}
        <path d="M6 97 H42 M76 97 H106 M6 122 H104" />
        {/* чимхээд өргөгдсөн арьсны нугалаа */}
        <path d="M42 97 Q59 78 76 97" />
        {/* шууны үзүүрийн сул атгасан сарвуу */}
        <path d="M106 97 C118 92 132 95 137 104 C141 111 138 118 131 121 C121 125 111 124 104 122" />
        <path d="M106 99 q-2 6 -1 11" strokeWidth={2} opacity={0.4} />
        <path d="M113 102 q8 3 7 11 M123 101 q8 3 7 11" strokeWidth={2} opacity={0.5} />
        {/* чимхэж буй гар: долоовор + эрхий хуруу, ард нь атгасан хуруунууд, бугуй дээшээ */}
        <g className="q3-pinch q3-anim">
          <path d="M66 24 C56 40 49 62 47 76 C46 81 49 85 52.5 85 C56 85 58.5 81 57.5 76.5 C59 64 68 47 79 34" />
          <path d="M48.5 77 C49.5 80 54.5 80 55.5 77" strokeWidth={1.8} opacity={0.7} />
          <path d="M96 58 C88 64 78 72 71 77 C72.5 82 70 86 66.5 86 C63 86 60.5 82 62 77.5 C68 70 78 60 90 46" />
          <path d="M62.5 77 C63.5 80 68.5 80 69.5 77" strokeWidth={1.8} opacity={0.7} />
          <path d="M79 34 C88 27 99 29 103 37 C107 45 104 54 96 58" />
          <path d="M88 39 q7 2 5 10" strokeWidth={2} opacity={0.5} />
          <path d="M66 24 C74 12 84 6 96 4" />
          <path d="M103 40 C110 34 116 26 119 16" />
        </g>
      </g>

      {/* томруулагч: нугалаанаас инсет рүү */}
      <g stroke="currentColor" strokeWidth={2} fill="none" opacity={0.55}>
        <circle cx={59} cy={90} r={14} strokeDasharray="3 4" />
        <path d="M74 86 C102 64 126 50 146 44" strokeDasharray="3 4" />
      </g>
      <circle cx={182} cy={66} r={42} stroke="currentColor" strokeWidth={2.5} fill="none" />

      {/* Х: хуурай — хагарсан зигзаг зураас, гуужсан ширхэг */}
      <g className="q3-ph q3-ph-h">
        <g stroke={ACCENT.H} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M148 88 Q162 86 170 70 L174 60 L178 65 L182 55 L186 64 L190 59 L194 70 Q202 86 216 88" />
          <path d="M168 42 l4 -4 M196 40 l4 -4" strokeWidth={2} />
        </g>
        <g fill={ACCENT.H}>
          <circle cx={162} cy={50} r={1.7} />
          <circle cx={202} cy={48} r={1.7} />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: дулаан — улайлтын толбо + халууны туяа */}
      <g className="q3-ph q3-ph-s">
        <ellipse cx={182} cy={76} rx={24} ry={10} fill={ACCENT.S} fillOpacity={0.18} />
        <g stroke={ACCENT.S} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d={FOLD_D} />
          <path d="M166 46 l-5 -9 M182 42 v-10 M198 46 l5 -9" strokeWidth={2} />
        </g>
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: чийглэг — усны дусал + гөлгөр гялбааны нум */}
      <g className="q3-ph q3-ph-b">
        <g stroke={ACCENT.B} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d={FOLD_D} />
          <path d="M174 63 Q178 55 184 55" strokeWidth={2} opacity={0.6} />
          <path d="M197 50 q6.5 9.5 0 15 q-6.5 -5.5 0 -15 z" strokeWidth={2} fill={ACCENT.B} fillOpacity={0.2} />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
