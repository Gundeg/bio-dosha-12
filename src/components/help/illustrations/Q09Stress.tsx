import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[9];

const CSS = phaseCss(
  "q9",
  `.q9-root .q9-wig{animation:q9-wg 1s ease-in-out infinite}
@keyframes q9-wg{0%,100%{transform:translateX(0)}50%{transform:translateX(2px)}}
.q9-root .q9-flick{animation:q9-fl .8s ease-in-out infinite}
@keyframes q9-fl{0%,100%{opacity:1}50%{opacity:.4}}
.q9-root .q9-drop{animation:q9-dp 2.4s ease-in infinite}
@keyframes q9-dp{0%{transform:translateY(0);opacity:1}70%{opacity:1}100%{transform:translateY(12px);opacity:0}}
.q9-root .q9-calm{transform-box:fill-box;transform-origin:center;animation:q9-cm 3.5s ease-in-out infinite}
@keyframes q9-cm{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}`
);

/** Стрессийн сорил: аянга шиг гэнэтийн бэрхшээлд царай ямар хувирахыг харуулна. */
export function Q09Stress({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q9"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: том царай (баруун) + аянга — гэнэтийн бэрхшээл (зүүн дээр) */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={150} cy={78} r={34} fill="currentColor" fillOpacity={0.05} />
        {/* үсний ирмэг */}
        <path d="M124 65 C128 50 138 44 150 44 C162 44 172 50 176 65" />
        {/* чих — хоёр талдаа тэгш хэмтэй */}
        <path d="M116.5 71 C110 72 109 82 116 84" />
        <path d="M183.5 71 C190 72 191 82 184 84" />
        {/* аянга */}
        <path d="M66 12 L38 52 L54 52 L44 84 L78 42 L61 42 L72 12 Z" fill="currentColor" fillOpacity={0.05} />
      </g>
      <g stroke="currentColor" strokeWidth={2} strokeLinecap="round" opacity={0.5}>
        {/* үсний ширхэг */}
        <path d="M138 47.5 q-2 4 -3 8 M150 44 q0 4 0 8 M162 47.5 q2 4 3 8" />
        {/* аянгын цацраг */}
        <path d="M30 26 l-8 -7 M28 58 l-10 3 M78 20 l8 -7" />
      </g>

      {/* Х: түгшсэн — дээш налуу хөмсөг, долгион ам, хөлс дусал, «?» */}
      <g className="q9-ph q9-ph-h">
        <g stroke={ACCENT.H} strokeWidth={2.5} strokeLinecap="round" fill="none">
          <path d="M130 68 Q137 62 143 63 M170 68 Q163 62 157 63" />
          <g className="q9-wig q9-anim">
            <path d="M138 94 q4 5 8 0 q4 -5 8 0 q4 5 8 0" />
          </g>
        </g>
        <circle cx={139} cy={77} r={2.6} fill={ACCENT.H} />
        <circle cx={161} cy={77} r={2.6} fill={ACCENT.H} />
        <path
          className="q9-drop q9-anim"
          d="M184 50 c3.5 5 5.5 8 4.8 11 a5 5 0 1 1 -9.6 0 c-.7 -3 1.3 -6 4.8 -11 z"
          stroke={ACCENT.H}
          strokeWidth={2}
          strokeLinejoin="round"
          fill={ACCENT.H}
          fillOpacity={0.1}
        />
        <text x={193} y={44} fontSize={19} fontWeight={700} fill={ACCENT.H} fontFamily="inherit">
          ?
        </text>
        <text x={210} y={62} fontSize={13} fontWeight={700} fill={ACCENT.H} opacity={0.6} fontFamily="inherit">
          ?
        </text>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: хурц — уруу налуу хөмсөг, шулуун ам, дөл, урагш сум */}
      <g className="q9-ph q9-ph-s">
        <g stroke={ACCENT.S} strokeWidth={2.5} strokeLinecap="round">
          <path d="M131 63 L144 70 M169 63 L156 70" />
          <path d="M141 95 L159 95" />
        </g>
        <circle cx={139} cy={78} r={2.4} fill={ACCENT.S} />
        <circle cx={161} cy={78} r={2.4} fill={ACCENT.S} />
        <path
          className="q9-flick q9-anim"
          d="M186 42 c4 5.5 6.5 9 5.5 12.5 a6.5 6.5 0 0 1 -12.6 1.5 c-.8 -4.5 1.8 -7.5 3.6 -10 c.8 1.8 1.8 3 3.3 4 c.4 -2.6 .3 -5 .2 -8 z"
          stroke={ACCENT.S}
          strokeWidth={2}
          strokeLinejoin="round"
          fill={ACCENT.S}
          fillOpacity={0.1}
        />
        <path
          d="M196 82 H228 m0 0 l-8 -5 m8 5 l-8 5"
          stroke={ACCENT.S}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: тайван — анисан нүд, зөөлөн инээмсэглэл, навч */}
      <g className="q9-ph q9-ph-b">
        <g stroke={ACCENT.B} strokeWidth={2.5} strokeLinecap="round" fill="none">
          <path d="M131 67 q6.5 -2 13 0 M156 67 q6.5 -2 13 0" />
          <path d="M133 78 q6 5 12 0 M155 78 q6 5 12 0" />
          <path d="M139 92 q11 8 22 0" />
        </g>
        <g className="q9-calm q9-anim">
          <path
            d="M196 48 q15 4 12 21 q-16 -2 -12 -21 z"
            stroke={ACCENT.B}
            strokeWidth={2}
            strokeLinejoin="round"
            fill={ACCENT.B}
            fillOpacity={0.1}
          />
          <path d="M199 53 q4 7 6 13" stroke={ACCENT.B} strokeWidth={1.8} strokeLinecap="round" opacity={0.6} />
          <path d="M205 70 q1 5 4 8" stroke={ACCENT.B} strokeWidth={2} strokeLinecap="round" />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
