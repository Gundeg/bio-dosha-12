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
import { QUESTION_HELP } from "@/lib/questionHelp";

const HELP = QUESTION_HELP[7];

// Орон нутгийн палитр: цамц, өмд, гутал, үс.
const SHIRT = "#4e9a68";
const SHIRT_SHADE = "#3c7d52";
const PANTS = "#3f5170";
const SHOE = "#3a2c22";
const HAIR = "#6b4a34";

const CSS = phaseCss(
  "q7",
  `.q7-root .q7-fig{animation:q7-bob .45s ease-in-out infinite}
@keyframes q7-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
.q7-root .q7-legf{transform-box:view-box;transform-origin:138px 90px;animation:q7-lf .9s ease-in-out infinite}
.q7-root .q7-legb{transform-box:view-box;transform-origin:138px 90px;animation:q7-lb .9s ease-in-out infinite}
.q7-root .q7-armf{transform-box:view-box;transform-origin:146px 61px;animation:q7-af .9s ease-in-out infinite}
.q7-root .q7-armb{transform-box:view-box;transform-origin:146px 61px;animation:q7-ab .9s ease-in-out infinite}
@keyframes q7-lf{0%,100%{transform:rotate(0)}50%{transform:rotate(-22deg)}}
@keyframes q7-lb{0%,100%{transform:rotate(0)}50%{transform:rotate(22deg)}}
@keyframes q7-af{0%,100%{transform:rotate(0)}50%{transform:rotate(24deg)}}
@keyframes q7-ab{0%,100%{transform:rotate(0)}50%{transform:rotate(-24deg)}}
.q7-root .q7-lines{animation:q7-drift 1s linear infinite}
@keyframes q7-drift{0%{transform:translateX(0);opacity:1}100%{transform:translateX(-7px);opacity:.35}}
.q7-root .q7-slow{animation:q7-fade 2.6s ease-in-out infinite}
@keyframes q7-fade{0%,100%{opacity:.9}50%{opacity:.4}}`
);

/** Хурдны сорил: алхаа, ярианы хэмнэл — хурдан / шийдэмгий / тайван. */
export function Q07Pace({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q7"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      <SkinDefs p="q7" />

      {/* Суурь: газар ба баруун тийш алхаж буй хүн (хажуугаас) */}
      <path d="M16 123 H224" stroke={INK} strokeWidth={2} opacity={0.16} strokeLinecap="round" />
      <ellipse cx={143} cy={124} rx={34} ry={3} fill={INK} opacity={0.07} />

      <g className="q7-fig q7-anim">
        {/* хойд хөл (өмд + гутал) */}
        <g className="q7-legb q7-anim">
          <path d="M138 90 L130 106 L117.5 116.5" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M138 90 L130 106 L117.5 116.5" stroke={PANTS} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
          <path
            d="M121 114 L109 120 C106 121 107 125.5 110.5 124.5 L123 119.5 C126 118 125 113.5 121 114 Z"
            fill={SHOE}
            stroke={INK}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </g>

        {/* хойд гар (ханцуй + гар) */}
        <g className="q7-armb q7-anim">
          <path d="M146 61 L133 72 L121 66.5" stroke={INK} strokeWidth={7.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M146 61 L133 72 L121 66.5" stroke={SHIRT_SHADE} strokeWidth={4.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={119} cy={66} r={3.6} fill="url(#q7-skin2)" stroke={INK} strokeWidth={2} />
        </g>

        {/* хүзүү */}
        <path d="M149.5 50 L147.5 57" stroke="url(#q7-skin2)" strokeWidth={7} strokeLinecap="round" />

        {/* их бие — цамц */}
        <path
          d="M145 53 C151 53 155.5 57 154.5 63.5 L149.5 89 C148.5 93 129.5 93 127.5 89 L134 62.5 C135 56.5 139 53 145 53 Z"
          fill={SHIRT}
          stroke={INK}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <path d="M127.5 89 C129.5 93 148.5 93 149.5 89 L151 79 C143 83 135 83 130 79 Z" fill={SHIRT_SHADE} opacity={0.45} />
        {/* цамцны цээжний гэрэл */}
        <path d="M141 58 C144 56.5 147 57 148 61 L145.5 77 C143.5 75.5 141.5 75.5 139.5 77 Z" fill="#63b47e" opacity={0.4} />
        {/* захны зураас */}
        <path d="M142.5 55 q3.5 3 7 0.5" stroke={INK} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.5} />

        {/* толгой */}
        <circle cx={150} cy={43} r={9} fill="url(#q7-skin)" stroke={INK} strokeWidth={2.3} />
        {/* үс */}
        <path
          d="M141 41 C140.5 32 145 27.5 151 27.5 C158 27.5 162 32.5 160.5 40.5 C158.5 37 156 35 152.5 35 C147.5 34.5 143.5 37.5 141 41 Z"
          fill={HAIR}
          stroke={INK}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
        {/* хамар + нүд */}
        <path d="M158.5 43 q3 1.5 -0.5 4" stroke={INK} strokeWidth={1.8} strokeLinecap="round" fill="none" />
        <circle cx={155.5} cy={42.5} r={1.4} fill={INK} />

        {/* урд хөл (өмд + гутал) */}
        <g className="q7-legf q7-anim">
          <path d="M138 90 L155 104 L165 121" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M138 90 L155 104 L165 121" stroke={PANTS} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M162 119 L176 115 C179 115 180 119.5 177 121 L167 124.5 C162 124.5 160 121 162 119 Z"
            fill={SHOE}
            stroke={INK}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </g>

        {/* урд гар (ханцуй + гар) */}
        <g className="q7-armf q7-anim">
          <path d="M146 61 L158 71 L170 65" stroke={INK} strokeWidth={7.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M146 61 L158 71 L170 65" stroke={SHIRT} strokeWidth={4.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={172} cy={64} r={3.6} fill="url(#q7-skin2)" stroke={INK} strokeWidth={2} />
        </g>
      </g>

      {/* Х: ард нь 3 урт хурдны зураас + том ярианы бөмбөлөг + жижиг хоёр дахь бөмбөлөг */}
      <g className="q7-ph q7-ph-h">
        <g className="q7-lines q7-anim" stroke={ACCENT.H} strokeWidth={2.5} strokeLinecap="round">
          <path d="M56 60 h32 M46 78 h36 M56 96 h30" />
        </g>
        <g stroke={ACCENT.H} strokeWidth={2.5} fill={ACCENT.H} fillOpacity={0.12}>
          <ellipse cx={193} cy={28} rx={20} ry={12} />
          <ellipse cx={222} cy={49} rx={9} ry={6.5} />
        </g>
        <path d="M180 37 L167 49 L188 39 Z" fill={ACCENT.H} />
        <path d="M216 53 L210 61 L221 55 Z" fill={ACCENT.H} />
        <g fill={ACCENT.H}>
          <circle cx={185} cy={28} r={2.2} />
          <circle cx={193} cy={28} r={2.2} />
          <circle cx={201} cy={28} r={2.2} />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: урагш чиглэсэн ганц зорилготой сум + 2 хурдны зураас */}
      <g className="q7-ph q7-ph-s">
        <path
          d="M180 76 H214 M214 76 l-9 -5.5 M214 76 l-9 5.5"
          stroke={ACCENT.S}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g className="q7-lines q7-anim" stroke={ACCENT.S} strokeWidth={2.5} strokeLinecap="round">
          <path d="M58 68 h28 M62 90 h24" />
        </g>
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: нэг богино зураас + нэг цэгтэй жижиг бөмбөлөг — бүгд тайван */}
      <g className="q7-ph q7-ph-b">
        <g className="q7-slow q7-anim" stroke={ACCENT.B} strokeWidth={2.5} strokeLinecap="round">
          <path d="M70 84 h16" />
        </g>
        <ellipse cx={190} cy={32} rx={12} ry={8.5} stroke={ACCENT.B} strokeWidth={2.5} fill={ACCENT.B} fillOpacity={0.12} />
        <path d="M182 38 L173 47 L188 40 Z" fill={ACCENT.B} />
        <circle cx={190} cy={32} r={2} fill={ACCENT.B} />
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
