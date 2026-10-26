import { QUESTION_HELP } from "@/lib/questionHelp";
import {
  ACCENT,
  HelpIllustrationProps,
  INK,
  IllustrationRoot,
  PhaseBadge,
  SKIN,
  SkinDefs,
  phaseCss,
} from "./shared";

const HELP = QUESTION_HELP[9];

// Орон нутгийн палитр: үс (дулаан бор), аянга (дулаан шар).
const HAIR = "#6b4a34";
const HAIR_SHADE = "#523726";
const BOLT = "#f6c948";
const BOLT_SHADE = "#e0a92e";

const CSS = phaseCss(
  "q9",
  `.q9-root .q9-wig{animation:q9-wg 1s ease-in-out infinite}
@keyframes q9-wg{0%,100%{transform:translateX(0)}50%{transform:translateX(2px)}}
.q9-root .q9-flick{animation:q9-fl .8s ease-in-out infinite}
@keyframes q9-fl{0%,100%{opacity:1}50%{opacity:.4}}
.q9-root .q9-drop{animation:q9-dp 2.4s ease-in infinite}
@keyframes q9-dp{0%{transform:translateY(0);opacity:1}70%{opacity:1}100%{transform:translateY(12px);opacity:0}}
.q9-root .q9-calm{transform-box:fill-box;transform-origin:center;animation:q9-cm 3.5s ease-in-out infinite}
@keyframes q9-cm{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
.q9-root .q9-bolt{animation:q9-bf 1.6s ease-in-out infinite}
@keyframes q9-bf{0%,100%{opacity:1}50%{opacity:.55}}
.q9-root .q9-bob{animation:q9-qb 2.6s ease-in-out infinite}
@keyframes q9-qb{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}`
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
      <SkinDefs p="q9" />

      {/* Суурь: том царай (баруун) + аянга — гэнэтийн бэрхшээл (зүүн дээр) */}
      {/* чих — арьсаар дүүргэсэн */}
      <g fill="url(#q9-skin2)" stroke={INK} strokeWidth={2.3} strokeLinejoin="round" strokeLinecap="round">
        <path d="M116.5 71 C110 72 109 82 116 84 C118.5 82 118.5 74 116.5 71 Z" />
        <path d="M183.5 71 C190 72 191 82 184 84 C181.5 82 181.5 74 183.5 71 Z" />
      </g>

      {/* нүүр — том, арьсны gradient-ээр эзлэхүүнтэй */}
      <circle cx={150} cy={78} r={34} fill="url(#q9-skin)" stroke={INK} strokeWidth={2.5} />
      {/* эрүүний доод сүүдэр */}
      <path
        d="M120 92 C128 108 172 108 180 92 C176 105 164 112 150 112 C136 112 124 105 120 92 Z"
        fill={SKIN.shade}
        opacity={0.45}
      />
      {/* хацрын гэрэл */}
      <ellipse cx={134} cy={74} rx={7} ry={9.5} fill={SKIN.light} opacity={0.5} />
      {/* хамар */}
      <path
        d="M150 80 C149 84 147.5 87 149 89 C150 90 152 89.5 153 89"
        fill="none"
        stroke={SKIN.deep}
        strokeWidth={1.8}
        strokeLinecap="round"
        opacity={0.55}
      />
      {/* чихний дотор */}
      <g stroke={INK} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.4}>
        <path d="M114 75 q1.5 2.5 0 4.5" />
        <path d="M186 75 q-1.5 2.5 0 4.5" />
      </g>

      {/* үс — дулаан бор малгай */}
      <path
        d="M124 65 C128 50 138 44 150 44 C162 44 172 50 176 65 C179 56 178 43 171 36 C162 29 138 29 129 36 C122 43 121 56 124 65 Z"
        fill={HAIR}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* үсний ширхэг */}
      <g stroke={HAIR_SHADE} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.7}>
        <path d="M138 47.5 q-2 4 -3 8 M150 44 q0 4 0 8 M162 47.5 q2 4 3 8" />
      </g>

      {/* аянга — дулаан шар, гэнэтийн бэрхшээл */}
      <g className="q9-bolt q9-anim">
        <path
          d="M66 12 L38 52 L54 52 L44 84 L78 42 L61 42 L72 12 Z"
          fill={BOLT}
          stroke={INK}
          strokeWidth={2.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* аянгын доод талын сүүдэр */}
        <path d="M44 84 L78 42 L61 42 Z" fill={BOLT_SHADE} opacity={0.55} />
        {/* гэрлийн зураас */}
        <path d="M62 20 L48 42" stroke={SKIN.light} strokeWidth={2} strokeLinecap="round" opacity={0.55} />
      </g>
      {/* аянгын цацраг */}
      <g stroke={BOLT_SHADE} strokeWidth={2.2} strokeLinecap="round" fill="none">
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
          fillOpacity={0.25}
        />
        <text className="q9-bob q9-anim" x={193} y={44} fontSize={19} fontWeight={700} fill={ACCENT.H} fontFamily="inherit">
          ?
        </text>
        <text
          className="q9-bob q9-anim"
          style={{ animationDelay: "-1.3s" }}
          x={210}
          y={62}
          fontSize={13}
          fontWeight={700}
          fill={ACCENT.H}
          opacity={0.6}
          fontFamily="inherit"
        >
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
          fillOpacity={0.25}
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
            fillOpacity={0.2}
          />
          <path d="M199 53 q4 7 6 13" stroke={ACCENT.B} strokeWidth={1.8} strokeLinecap="round" opacity={0.6} />
          <path d="M205 70 q1 5 4 8" stroke={ACCENT.B} strokeWidth={2} strokeLinecap="round" />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
