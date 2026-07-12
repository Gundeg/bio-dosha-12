import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[1];

const CSS = phaseCss(
  "q1",
  `.q1-root .q1-tip{animation:q1-nudge 2.2s ease-in-out infinite}
@keyframes q1-nudge{0%,100%{transform:translateY(0)}50%{transform:translateY(1.5px)}}`
);

/** Бугуйн сорил: эрхий, долоовор хуруу давхарлах / хүрэх / хүрэлцэхгүй. */
export function Q01BoneWrist({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q1"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: доороос дээш өргөгдсөн шуу + атгасан сарвуу, ороож буй гарын алга ба хуруунууд */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {/* шуу (band) */}
        <path d="M148 132 L128 62" />
        <path d="M182 132 L160 66" />
        {/* атгасан гарын толгой */}
        <path d="M128 62 C130 44 158 46 160 66" />
        {/* ороож буй гарын алга — бугуйн доогуур */}
        <path d="M118 86 C114 108 158 112 166 90" />
        {/* дунд хуруудын сүүдэр (ойлголт) */}
        <path d="M118 86 C112 68 122 56 136 52" strokeWidth={2} opacity={0.35} />
      </g>
      {/* долоовор хуруу (зүүнээс) ба эрхий хуруу (баруунаас) — их бие нь суурьт */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" fill="none">
        <path d="M118 86 C112 62 122 48 138 44" />
        <path d="M166 90 C174 66 164 50 150 45" />
      </g>

      {/* Х: хурууны үзүүрүүд давхарлан гарна */}
      <g className="q1-ph q1-ph-h">
        <g className="q1-tip q1-anim" stroke={ACCENT.H} strokeWidth={2.5} strokeLinecap="round">
          <path d="M138 44 C144 42 152 42 158 46" />
          <path d="M150 45 C144 42 136 41 130 44" />
          <circle cx={158} cy={46} r={2.2} fill={ACCENT.H} stroke="none" />
          <circle cx={130} cy={44} r={2.2} fill={ACCENT.H} stroke="none" />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: үзүүрүүд яг хүрнэ */}
      <g className="q1-ph q1-ph-s">
        <g className="q1-tip q1-anim" stroke={ACCENT.S} strokeWidth={2.5} strokeLinecap="round">
          <path d="M138 44 C140 43 142 42.5 143.5 42.5" />
          <path d="M150 45 C148 43.5 146 42.8 144.5 42.7" />
          <circle cx={144} cy={42.6} r={2.6} fill={ACCENT.S} stroke="none" />
          <path d="M144 35 v-5 M136 37 l-4 -3 M152 37 l4 -3" strokeWidth={2} />
        </g>
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: үзүүрүүд хүрэлцэхгүй, зай үлдэнэ */}
      <g className="q1-ph q1-ph-b">
        <g className="q1-tip q1-anim" stroke={ACCENT.B} strokeWidth={2.5} strokeLinecap="round">
          <circle cx={138} cy={44} r={2.2} fill={ACCENT.B} stroke="none" />
          <circle cx={150} cy={45} r={2.2} fill={ACCENT.B} stroke="none" />
          <path d="M140.5 41 L147.5 41.5" strokeWidth={2} strokeDasharray="2 3" />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
