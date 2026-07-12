import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[6];

const CSS = phaseCss(
  "q6",
  `.q6-root .q6-flick{animation:q6-flk .9s ease-in-out infinite}
@keyframes q6-flk{0%,100%{opacity:1;transform:translateY(0)}40%{opacity:.45;transform:translateY(1px)}70%{opacity:.85}}
.q6-root .q6-steady{animation:q6-std 2s ease-in-out infinite}
@keyframes q6-std{0%,100%{opacity:1}50%{opacity:.75}}`
);

/** Хоол шингэлтийн сорил: хоол алгасахад өлсгөлөнгийн "дөл" ямар байх вэ. */
export function Q06MealSkip({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q6"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: цаг (үдийн 12), хоосон таваг */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={52} cy={44} r={16} />
        <path d="M52 44 L52 33 M52 44 L60 44" strokeWidth={2} />
        <circle cx={98} cy={94} r={24} />
        <circle cx={98} cy={94} r={14} strokeWidth={2} opacity={0.5} strokeDasharray="3 4" />
      </g>

      {/* Х: дөл тогтворгүй анивчина + "?" */}
      <g className="q6-ph q6-ph-h">
        <g className="q6-flick q6-anim">
          <path
            d="M172 78 c6 8 10 13 8 20 a11 11 0 0 1 -21 1 c-1 -8 4 -11 7 -15 c1 4 3 6 6 8 c1 -5 0 -9 0 -14 z"
            stroke={ACCENT.H}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
        </g>
        <text x={204} y={78} fontSize={17} fontWeight={700} fill={ACCENT.H} fontFamily="inherit">
          ?
        </text>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: том хүчтэй дөл — хурдан өлсөнө */}
      <g className="q6-ph q6-ph-s">
        <g className="q6-steady q6-anim">
          <path
            d="M170 64 c9 11 15 18 12 28 a15 15 0 0 1 -29 1 c-2 -11 5 -15 10 -21 c1 5 4 8 8 11 c2 -7 0 -12 -1 -19 z"
            stroke={ACCENT.S}
            strokeWidth={2.4}
            strokeLinejoin="round"
            fill={ACCENT.S}
            fillOpacity={0.15}
          />
        </g>
        <path
          d="M204 60 l6 -10 M210 62 l8 -6"
          stroke={ACCENT.S}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: өчүүхэн дөл — өлсөхгүй тайван */}
      <g className="q6-ph q6-ph-b">
        <g className="q6-steady q6-anim">
          <path
            d="M172 92 c4 5 6 8 5 12 a7 7 0 0 1 -13 1 c-1 -5 2 -7 4 -9 c1 2 2 3 4 4 c0 -3 0 -5 0 -8 z"
            stroke={ACCENT.B}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
        </g>
        <g fill={ACCENT.B}>
          <circle cx={198} cy={100} r={2} />
          <circle cx={206} cy={100} r={2} />
          <circle cx={214} cy={100} r={2} />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
