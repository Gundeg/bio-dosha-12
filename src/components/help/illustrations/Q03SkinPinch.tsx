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
        <path d="M123 101 q8 3 7 11" strokeWidth={2} opacity={0.5} />
        {/* чимхэж буй гар: сарвууны ар + хоёр хуруу (хумсны нумтай) */}
        <g className="q3-pinch q3-anim">
          <path d="M31 34 C28 18 40 9 55 10 C72 11 85 18 89 32" />
          <path d="M31 34 C36 52 43 68 47.5 79 C46.5 83.5 49 87 52 87 C55 87 57.5 83.5 56.5 79 C53 67 47 48 44 31" />
          <path d="M48.5 78 C49.5 81 54.5 81 55.5 78" strokeWidth={1.8} opacity={0.7} />
          <path d="M89 32 C84 49 75 66 70.5 78 C71.5 83 69 86 66 86 C63 86 60.5 83 61.5 78 C65 66 71 47 74 30" />
          <path d="M62.5 77 C63.5 80 68.5 80 69.5 77" strokeWidth={1.8} opacity={0.7} />
        </g>
      </g>

      {/* томруулагч: нугалаанаас инсет рүү */}
      <g stroke="currentColor" strokeWidth={2} fill="none" opacity={0.55}>
        <circle cx={59} cy={90} r={14} strokeDasharray="3 4" />
        <path d="M73 82 C98 52 122 38 148 37" strokeDasharray="3 4" />
      </g>
      <circle cx={182} cy={66} r={42} stroke="currentColor" strokeWidth={2.5} fill="none" />

      {/* Х: хуурай — хагарсан зигзаг зураас, гуужсан ширхэг */}
      <g className="q3-ph q3-ph-h">
        <g stroke={ACCENT.H} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d={FOLD_D} />
          <g strokeWidth={2}>
            <path d="M172 68 l4 -3 -3 -4 4 -3" />
            <path d="M192 68 l-4 -3 3 -4 -4 -3" />
            <path d="M171 39 l4 -4 M194 37 l4 -4" />
          </g>
        </g>
        <g fill={ACCENT.H}>
          <circle cx={164} cy={46} r={1.7} />
          <circle cx={200} cy={44} r={1.7} />
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
          <path d="M173 67 Q182 54 191 67" strokeWidth={2} opacity={0.6} />
          <path d="M203 45 q6.5 9.5 0 15 q-6.5 -5.5 0 -15 z" strokeWidth={2} fill={ACCENT.B} fillOpacity={0.2} />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
