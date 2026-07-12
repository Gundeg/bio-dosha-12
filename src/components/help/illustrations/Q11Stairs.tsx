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
      {/* Суурь: шат, өгсөж буй хүн, тэнхээний батерей */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M28 128 h28 v-18 h28 v-18 h28 v-18 h28 v-18 h28" />
        <circle cx={121} cy={58} r={8} />
        <path d="M121 66 L117 81" />
        <path d="M119 70 L129 77 M119 70 L109 76" strokeWidth={2.2} />
        <path d="M117 81 L108 92 M117 81 L125 90" strokeWidth={2.2} />
        <rect x={192} y={26} width={20} height={36} rx={3} strokeWidth={2.2} />
        <path d="M198 26 v-4 h8 v4" strokeWidth={2.2} />
      </g>

      {/* Х: тэнхээ хурдан дуусна — 1 хэсэг анивчина, амьсгаадалт */}
      <g className="q11-ph q11-ph-h">
        <rect className="q11-blink q11-anim" x={195} y={51} width={14} height={8} rx={2} fill={ACCENT.H} />
        <g className="q11-puff q11-anim" stroke={ACCENT.H} strokeWidth={2} fill="none">
          <circle cx={136} cy={50} r={3.2} />
          <circle cx={143} cy={43} r={2.4} />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: дундаж — 2 хэсэг тогтвортой */}
      <g className="q11-ph q11-ph-s">
        <rect x={195} y={51} width={14} height={8} rx={2} fill={ACCENT.S} />
        <rect x={195} y={41} width={14} height={8} rx={2} fill={ACCENT.S} opacity={0.8} />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: өндөр тэсвэр — 3 хэсэг дүүрэн + тэмдэг */}
      <g className="q11-ph q11-ph-b">
        <rect x={195} y={51} width={14} height={8} rx={2} fill={ACCENT.B} />
        <rect x={195} y={41} width={14} height={8} rx={2} fill={ACCENT.B} opacity={0.85} />
        <rect x={195} y={31} width={14} height={8} rx={2} fill={ACCENT.B} opacity={0.7} />
        <path
          d="M192 72 l5 5 9 -9"
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
