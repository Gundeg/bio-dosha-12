import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[3];

const CSS = phaseCss(
  "q3",
  `.q3-root .q3-pinch{animation:q3-squeeze 2s ease-in-out infinite}
@keyframes q3-squeeze{0%,100%{transform:translateY(0)}50%{transform:translateY(2px)}}
.q3-root .q3-cue{animation:q3-pulse 1.6s ease-in-out infinite}
@keyframes q3-pulse{0%,100%{opacity:1}50%{opacity:.35}}`
);

/** Арьсны сорил: шууны арьсыг чимхэхэд хуурай / улайсан / чийглэг. */
export function Q03SkinPinch({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q3"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: шуу, чимхсэн арьсны нугалаа, чимхэж буй хоёр хуруу */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 122 L150 74" />
        <path d="M30 140 L166 90" />
        <path d="M88 100 Q104 74 122 88" />
        <g className="q3-pinch q3-anim">
          <path d="M128 46 L110 78 M146 60 L120 84" />
          <circle cx={110} cy={78} r={2.5} fill="currentColor" stroke="none" />
          <circle cx={120} cy={84} r={2.5} fill="currentColor" stroke="none" />
        </g>
      </g>

      {/* Х: хуурай — гуужсан ширхэг, хуурайшлын зураас */}
      <g className="q3-ph q3-ph-h">
        <g className="q3-cue q3-anim" stroke={ACCENT.H} strokeWidth={2} strokeLinecap="round">
          <path d="M140 62 l4 4 M150 72 l4 4 M144 84 l4 4" />
          <path d="M52 68 l6 -6 l6 6 l6 -6" />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: дулаан — халуун туяа, улайлт */}
      <g className="q3-ph q3-ph-s">
        <ellipse cx={105} cy={92} rx={20} ry={6} fill={ACCENT.S} opacity={0.18} />
        <g className="q3-cue q3-anim" stroke={ACCENT.S} strokeWidth={2} strokeLinecap="round">
          <path d="M92 60 l-5 -9 M108 55 l0 -10 M124 60 l5 -9" />
        </g>
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: чийглэг — дусал, гөлгөр гялбаа */}
      <g className="q3-ph q3-ph-b">
        <g className="q3-cue q3-anim">
          <path
            d="M144 48 q7 10 0 16 q-7 -6 0 -16 z"
            stroke={ACCENT.B}
            strokeWidth={2}
            fill={ACCENT.B}
            fillOpacity={0.2}
            strokeLinejoin="round"
          />
        </g>
        <path
          d="M58 106 Q90 90 118 98"
          stroke={ACCENT.B}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.55}
        />
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
