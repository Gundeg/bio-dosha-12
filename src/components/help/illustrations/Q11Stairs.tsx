import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[11];

const CSS = phaseCss(
  "q11",
  `.q11-root .q11-blink{animation:q11-bl 1s ease-in-out infinite}
@keyframes q11-bl{0%,100%{opacity:.9}50%{opacity:.25}}
.q11-root .q11-puff{animation:q11-pf 1.6s linear infinite}
@keyframes q11-pf{0%{transform:translateY(0);opacity:.9}100%{transform:translateY(-8px);opacity:0}}`
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
      {/* Суурь: 5 гишгүүрт шат, дундаа өгсөж буй хүн, баруун дээд буланд батерей */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {/* шат — зүүнээс баруун тийш өгсөнө */}
        <path d="M18 126 h26 v-16 h26 v-16 h26 v-16 h26 v-16 h26 v-16 h28" />
        {/* өгсөж буй хүн: толгой, урагш налсан их бие */}
        <circle cx={117} cy={25} r={8} />
        <path d="M111 33 C106.5 40 102.5 47 100.5 55" />
        {/* сэлгүүцэх гар: урд, ард */}
        <path d="M110 36 L121 46 L129 39" strokeWidth={2.4} />
        <path d="M110 36 L99.5 45 L91 51" strokeWidth={2.4} />
        {/* урд хөл — дараагийн гишгүүр дээр нугалсан */}
        <path d="M100.5 55 L113 62 L108.5 77" />
        <path d="M108.5 77 L116 77.5" strokeWidth={2.4} />
        {/* хойд хөл — доод гишгүүр дээр */}
        <path d="M100.5 55 L95.5 74 L87 92.5" />
        <path d="M87 92.5 L94.5 93.5" strokeWidth={2.4} />
        {/* батерей: их бие, толгойн товруу, 3 хэсгийн үүр */}
        <rect x={192} y={24} width={22} height={42} rx={3.5} strokeWidth={2.2} />
        <path d="M198 24 v-5 h10 v5" strokeWidth={2.2} />
        <rect x={196} y={29} width={14} height={9} rx={1.5} strokeWidth={1.6} opacity={0.4} />
        <rect x={196} y={41} width={14} height={9} rx={1.5} strokeWidth={1.6} opacity={0.4} />
        <rect x={196} y={53} width={14} height={9} rx={1.5} strokeWidth={1.6} opacity={0.4} />
      </g>

      {/* Х: тэнхээ хурдан дуусна — 1 хэсэг анивчина, амьсгаадалт, хөлс */}
      <g className="q11-ph q11-ph-h">
        <rect className="q11-blink q11-anim" x={196} y={53} width={14} height={9} rx={1.5} fill={ACCENT.H} />
        <g className="q11-puff q11-anim" stroke={ACCENT.H} strokeWidth={2} fill="none">
          <circle cx={132} cy={24} r={3.4} />
          <circle cx={139} cy={17} r={2.5} />
        </g>
        <path
          d="M146 28 q5 7.5 0 12 q-5 -4.5 0 -12 z"
          stroke={ACCENT.H}
          strokeWidth={1.8}
          fill={ACCENT.H}
          fillOpacity={0.25}
        />
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: дундаж — 2 хэсэг тогтвортой */}
      <g className="q11-ph q11-ph-s">
        <rect x={196} y={53} width={14} height={9} rx={1.5} fill={ACCENT.S} />
        <rect x={196} y={41} width={14} height={9} rx={1.5} fill={ACCENT.S} opacity={0.85} />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: өндөр тэсвэр — 3 хэсэг дүүрэн + тэмдэг */}
      <g className="q11-ph q11-ph-b">
        <rect x={196} y={53} width={14} height={9} rx={1.5} fill={ACCENT.B} />
        <rect x={196} y={41} width={14} height={9} rx={1.5} fill={ACCENT.B} opacity={0.85} />
        <rect x={196} y={29} width={14} height={9} rx={1.5} fill={ACCENT.B} opacity={0.7} />
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
