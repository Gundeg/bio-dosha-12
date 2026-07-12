import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[4];

const CSS = phaseCss(
  "q4",
  `.q4-root .q4-spin{transform-box:fill-box;transform-origin:center;animation:q4-rot 10s linear infinite}
@keyframes q4-rot{to{transform:rotate(360deg)}}
.q4-root .q4-shiver{animation:q4-shv .7s ease-in-out infinite}
@keyframes q4-shv{0%,100%{opacity:1}50%{opacity:.3}}
.q4-root .q4-rays{animation:q4-glow 2s ease-in-out infinite}
@keyframes q4-glow{0%,100%{opacity:1}50%{opacity:.45}}
.q4-root .q4-rain{animation:q4-drop 1.2s linear infinite}
@keyframes q4-drop{0%{transform:translateY(0);opacity:1}80%{opacity:.9}100%{transform:translateY(12px);opacity:0}}`
);

/** Цаг агаарын сорил: хүйтэн / халуун / чийгний аль нь их зовоодог вэ. */
export function Q04Weather({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q4"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: хүн дүрс */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={120} cy={54} r={10} />
        <path d="M120 64 V98" />
        <path d="M120 72 L104 84 M120 72 L136 84" />
        <path d="M120 98 L108 122 M120 98 L132 122" />
      </g>

      {/* Х: цасан ширхэг + чичрэх */}
      <g className="q4-ph q4-ph-h">
        <g
          className="q4-spin q4-anim"
          stroke={ACCENT.H}
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M58 30 V56 M47 36 L69 50 M69 36 L47 50" />
        </g>
        <g
          className="q4-shiver q4-anim"
          stroke={ACCENT.H}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        >
          <path d="M96 76 q-6 9 0 18" />
          <path d="M144 76 q6 9 0 18" />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: нар + хөлс */}
      <g className="q4-ph q4-ph-s">
        <circle cx={182} cy={40} r={10} stroke={ACCENT.S} strokeWidth={2.5} />
        <g className="q4-rays q4-anim" stroke={ACCENT.S} strokeWidth={2} strokeLinecap="round">
          <path d="M182 24 v-6 M182 56 v6 M166 40 h-6 M198 40 h6 M170 28 l-4 -4 M194 28 l4 -4 M170 52 l-4 4 M194 52 l4 4" />
        </g>
        <g className="q4-rain q4-anim">
          <path
            d="M140 58 q4.5 6.5 0 11 q-4.5 -4.5 0 -11 z"
            stroke={ACCENT.S}
            strokeWidth={1.8}
            fill={ACCENT.S}
            fillOpacity={0.25}
          />
        </g>
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: борооны үүл + шалбааг */}
      <g className="q4-ph q4-ph-b">
        <path
          d="M56 46 a9 9 0 0 1 15 -7 a10 10 0 0 1 18 3 a8 8 0 0 1 5 12 h-36 a8 8 0 0 1 -2 -8 z"
          stroke={ACCENT.B}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
        <g className="q4-rain q4-anim" stroke={ACCENT.B} strokeWidth={2} strokeLinecap="round">
          <path d="M62 62 l-3 8 M76 62 l-3 8 M90 62 l-3 8" />
        </g>
        <ellipse cx={120} cy={127} rx={24} ry={4} stroke={ACCENT.B} strokeWidth={2} />
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
