import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[9];

const CSS = phaseCss(
  "q9",
  `.q9-root .q9-wig{animation:q9-wg 1s ease-in-out infinite}
@keyframes q9-wg{0%,100%{transform:translateX(0)}50%{transform:translateX(2px)}}
.q9-root .q9-flick{animation:q9-fl .8s ease-in-out infinite}
@keyframes q9-fl{0%,100%{opacity:1}50%{opacity:.4}}
.q9-root .q9-calm{animation:q9-cm 3s ease-in-out infinite}
@keyframes q9-cm{0%,100%{opacity:.9}50%{opacity:.5}}`
);

/** Сэтгэл хөдлөлийн сорил: гэнэтийн бэрхшээлд үзүүлэх эхний хариу үйлдэл. */
export function Q09Stress({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q9"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: царай + гэнэтийн бэрхшээлийн тэмдэг (аянга) */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={120} cy={82} r={30} />
        <path d="M64 22 L52 42 h8 L54 58 L70 38 h-8 L68 22 z" strokeWidth={2.2} />
      </g>

      {/* Х: түгшсэн царай — долгион ам, эргэлзээ */}
      <g className="q9-ph q9-ph-h">
        <g stroke={ACCENT.H} strokeWidth={2.2} strokeLinecap="round" fill="none">
          <path d="M103 70 q6 -5 12 -2 M137 70 q-6 -5 -12 -2" />
          <g className="q9-wig q9-anim">
            <path d="M107 98 q5 5 10 0 q5 -5 10 0" />
          </g>
        </g>
        <circle cx={110} cy={80} r={2.2} fill={ACCENT.H} />
        <circle cx={130} cy={80} r={2.2} fill={ACCENT.H} />
        <text
          className="q9-flick q9-anim"
          x={166}
          y={46}
          fontSize={17}
          fontWeight={700}
          fill={ACCENT.H}
          fontFamily="inherit"
        >
          ?
        </text>
        <path
          d="M182 56 a8 8 0 1 1 -6 -12"
          stroke={ACCENT.H}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: хурц шийдэмгий царай — дөл, урагш сум */}
      <g className="q9-ph q9-ph-s">
        <g stroke={ACCENT.S} strokeWidth={2.2} strokeLinecap="round">
          <path d="M102 68 l16 6 M138 68 l-16 6" />
          <path d="M108 98 h24" />
        </g>
        <circle cx={110} cy={81} r={2.2} fill={ACCENT.S} />
        <circle cx={130} cy={81} r={2.2} fill={ACCENT.S} />
        <g className="q9-flick q9-anim">
          <path
            d="M166 44 c4 5 6 8 5 12 a7 7 0 0 1 -13 1 c-1 -5 2 -7 4 -9 c1 2 2 3 4 4 c0 -3 0 -5 0 -8 z"
            stroke={ACCENT.S}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </g>
        <path
          d="M162 74 h28 m0 0 l-7 -4 m7 4 l-7 4"
          stroke={ACCENT.S}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: тайван царай — анисан нүд, инээмсэглэл, навч */}
      <g className="q9-ph q9-ph-b">
        <g stroke={ACCENT.B} strokeWidth={2.2} strokeLinecap="round" fill="none">
          <path d="M103 68 q6 -3 12 0 M125 68 q6 -3 12 0" />
          <path d="M104 79 q6 5 12 0 M124 79 q6 5 12 0" />
          <path d="M106 95 q14 10 28 0" />
        </g>
        <g className="q9-calm q9-anim">
          <path
            d="M168 44 q11 4 9 16 q-11 -2 -9 -16 z"
            stroke={ACCENT.B}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <path d="M172 62 q1 6 4 10" stroke={ACCENT.B} strokeWidth={2} strokeLinecap="round" />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
