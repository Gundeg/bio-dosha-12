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

const HELP = QUESTION_HELP[11];

/** Дүрсийн жижиг палитр. */
const STONE = "#d8dde4";
const STONE_SH = "#aeb8c4";
const SHIRT = "#5f93a8";
const SHIRT_SH = "#4a7a8d";
const TROUSER = "#3d5166";
const SHOE = "#2c3846";
const HAIR = "#6b4a2f";
const SHELL = "#e7ebf0";
const SHELL_SH = "#cbd3dc";
const CELL = "#f4f6f9";

const CSS = phaseCss(
  "q11",
  `.q11-root .q11-blink{animation:q11-bl 1s ease-in-out infinite}
@keyframes q11-bl{0%,100%{opacity:.9}50%{opacity:.25}}
.q11-root .q11-puff{animation:q11-pf 1.6s linear infinite}
@keyframes q11-pf{0%{transform:translateY(0);opacity:.9}100%{transform:translateY(-8px);opacity:0}}
.q11-root .q11-climb{animation:q11-cl 1.2s ease-in-out infinite}
@keyframes q11-cl{0%,100%{transform:translate(-7px,4.5px)}55%{transform:translate(6px,-3.5px)}}`
);

/** Тэсвэрийн сорил: шатаар өгсөхөд тэнхээ (батерей) хэр хурдан буурах вэ. */
export function Q11Stairs({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q11"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      <SkinDefs p="q11" />
      <defs>
        <linearGradient id="q11-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6eaef" />
          <stop offset="1" stopColor="#bcc4ce" />
        </linearGradient>
      </defs>

      {/* газрын сүүдэр */}
      <ellipse cx={96} cy={127.5} rx={86} ry={3.2} fill={INK} opacity={0.06} />

      {/* шат — нэг битүү чулуун бие; гишгүүр 26, өндөр 16 */}
      <path
        d="M18 126 h26 v-16 h26 v-16 h26 v-16 h26 v-16 h26 v-16 h26 V126 Z"
        fill="url(#q11-stone)"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* гишгүүр бүрийн босоо нүүрний сүүдэр (эзэлхүүн) */}
      <g fill={STONE_SH} opacity={0.55}>
        <rect x={44} y={110} width={5} height={16} />
        <rect x={70} y={94} width={5} height={16} />
        <rect x={96} y={78} width={5} height={16} />
        <rect x={122} y={62} width={5} height={16} />
        <rect x={148} y={46} width={5} height={16} />
      </g>
      {/* гишгүүрийн ирмэгийн гэрэлтэл */}
      <g stroke="#ffffff" strokeWidth={1.8} opacity={0.5} strokeLinecap="round">
        <path d="M46 110.4 h22 M72 94.4 h22 M98 78.4 h22 M124 62.4 h22 M150 46.4 h22" />
      </g>

      {/* ── Өгсөж буй хүн (гишгүүр дагуу хэмнэлтэй) ── */}
      <g className="q11-climb q11-anim">
        {/* хойд гар (биеийн ард) + сарвуу */}
        <path d="M110 36 L99.5 45 L91 51" fill="none" stroke={INK} strokeWidth={7.4} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M110 36 L99.5 45 L91 51" fill="none" stroke={SHIRT_SH} strokeWidth={4.8} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={90} cy={51.5} r={3.1} fill={SKIN.base} stroke={INK} strokeWidth={2} />
        {/* хойд хөл + гутал */}
        <path d="M100.5 55 L95.5 74 L87 92.5" fill="none" stroke={INK} strokeWidth={8.6} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M100.5 55 L95.5 74 L87 92.5" fill="none" stroke={TROUSER} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx={91} cy={93} rx={5.2} ry={2.9} fill={SHOE} stroke={INK} strokeWidth={2} />

        {/* их бие (цамц) */}
        <path
          d="M119 34 C121 41 117 49 108 56 C104 59 98.5 58 97.5 53.5 C99 46 103 39 107 33 C110 30 116 30.5 119 34 Z"
          fill={SHIRT}
          stroke={INK}
          strokeWidth={2.3}
          strokeLinejoin="round"
        />
        <path
          d="M117.5 37 C118.5 44 114.5 51 107 56.5 C110 50 112.5 43 113.5 36 C115 34.5 116.5 35 117.5 37 Z"
          fill={SHIRT_SH}
          opacity={0.55}
        />

        {/* урд хөл + гутал */}
        <path d="M100.5 55 L113 62 L108.5 77" fill="none" stroke={INK} strokeWidth={8.6} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M100.5 55 L113 62 L108.5 77" fill="none" stroke={TROUSER} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx={112.3} cy={78} rx={5.2} ry={2.9} fill={SHOE} stroke={INK} strokeWidth={2} />

        {/* урд гар (биеийн урд) + сарвуу */}
        <path d="M110 36 L121 46 L129 39" fill="none" stroke={INK} strokeWidth={7.4} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M110 36 L121 46 L129 39" fill="none" stroke={SHIRT} strokeWidth={4.8} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={130} cy={38.5} r={3.1} fill={SKIN.base} stroke={INK} strokeWidth={2} />

        {/* толгой + үс */}
        <circle cx={117} cy={25} r={8} fill="url(#q11-skin)" stroke={INK} strokeWidth={2.3} />
        <path
          d="M109 24 C108 16 118 12 125 17 C127 20 126 24 125 26 C123 20 115 19 110 24 C109.7 24.6 109.3 24.6 109 24 Z"
          fill={HAIR}
          stroke={INK}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </g>

      {/* ── Батерей ── */}
      <rect x={198} y={18.5} width={10} height={6} rx={1.5} fill={SHELL_SH} stroke={INK} strokeWidth={2.3} />
      <rect x={192} y={24} width={22} height={42} rx={3.5} fill={SHELL} stroke={INK} strokeWidth={2.5} />
      <rect x={194.5} y={27} width={2.6} height={36} rx={1.3} fill="#ffffff" opacity={0.5} />
      <g fill={CELL} stroke={INK} strokeWidth={1.6}>
        <rect x={196} y={28.5} width={14} height={9} rx={1.5} />
        <rect x={196} y={40.5} width={14} height={9} rx={1.5} />
        <rect x={196} y={52.5} width={14} height={9} rx={1.5} />
      </g>

      {/* Х: тэнхээ хурдан дуусна — 1 хэсэг анивчина, амьсгаадалт, хөлс */}
      <g className="q11-ph q11-ph-h">
        <rect className="q11-blink q11-anim" x={196} y={52.5} width={14} height={9} rx={1.5} fill={ACCENT.H} />
        <g className="q11-puff q11-anim" stroke={ACCENT.H} strokeWidth={2} fill="none">
          <circle cx={132} cy={24} r={3.4} />
          <circle cx={139} cy={17} r={2.5} />
        </g>
        <path
          d="M146 27 c2.4 3.5 3.8 5.6 3.4 7.7 a3.5 3.5 0 1 1 -6.8 0 c-.5 -2.1 .9 -4.2 3.4 -7.7 z"
          stroke={ACCENT.H}
          strokeWidth={1.8}
          strokeLinejoin="round"
          fill={ACCENT.H}
          fillOpacity={0.12}
        />
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: дундаж — 2 хэсэг тогтвортой */}
      <g className="q11-ph q11-ph-s">
        <rect x={196} y={52.5} width={14} height={9} rx={1.5} fill={ACCENT.S} />
        <rect x={196} y={40.5} width={14} height={9} rx={1.5} fill={ACCENT.S} opacity={0.85} />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: өндөр тэсвэр — 3 хэсэг дүүрэн + тэмдэг */}
      <g className="q11-ph q11-ph-b">
        <rect x={196} y={52.5} width={14} height={9} rx={1.5} fill={ACCENT.B} />
        <rect x={196} y={40.5} width={14} height={9} rx={1.5} fill={ACCENT.B} opacity={0.85} />
        <rect x={196} y={28.5} width={14} height={9} rx={1.5} fill={ACCENT.B} opacity={0.7} />
        <path
          d="M195 76 l6 6 11 -11"
          stroke={ACCENT.B}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
