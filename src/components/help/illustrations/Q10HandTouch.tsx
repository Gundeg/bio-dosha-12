import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[10];

const CSS = phaseCss(
  "q10",
  `.q10-root .q10-spin{transform-box:fill-box;transform-origin:center;animation:q10-rot 10s linear infinite}
@keyframes q10-rot{to{transform:rotate(360deg)}}
.q10-root .q10-rise{animation:q10-up 1.8s linear infinite}
@keyframes q10-up{0%{transform:translateY(0);opacity:.9}100%{transform:translateY(-9px);opacity:0}}
.q10-root .q10-bob{animation:q10-bb 2.4s ease-in-out infinite}
@keyframes q10-bb{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}`
);

/** Гар, хөлийн сорил: алгаа хацартаа тавьж дулааныг нь мэдрэх. */
export function Q10HandTouch({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q10"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: царай + хацарт хүрсэн алга */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={78} cy={78} r={26} />
        <circle cx={70} cy={72} r={2.2} fill="currentColor" stroke="none" />
        <circle cx={87} cy={72} r={2.2} fill="currentColor" stroke="none" />
        <path d="M70 88 q8 6 16 0" strokeWidth={2} />
        <rect x={112} y={56} width={42} height={52} rx={16} transform="rotate(-8 133 82)" />
        <path d="M112 94 q-9 -7 -4 -17" strokeWidth={2.2} />
        <path d="M124 56 v13 M134 55 v13 M144 56 v12" strokeWidth={2} opacity={0.6} />
      </g>

      {/* Х: хүйтэн — цасан ширхэг, хуурай зураас */}
      <g className="q10-ph q10-ph-h">
        <g className="q10-spin q10-anim" stroke={ACCENT.H} strokeWidth={2} strokeLinecap="round">
          <path d="M192 32 V56 M182 37 L202 51 M202 37 L182 51" />
        </g>
        <path
          d="M166 76 l5 5 M176 86 l5 5"
          stroke={ACCENT.H}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: халуун — дээш өгсөх илчний долгион + хөлс */}
      <g className="q10-ph q10-ph-s">
        <g className="q10-rise q10-anim" stroke={ACCENT.S} strokeWidth={2.2} strokeLinecap="round" fill="none">
          <path d="M152 44 q4 -6 0 -12 q-4 -6 0 -12" />
          <path d="M168 46 q4 -6 0 -12 q-4 -6 0 -12" />
          <path d="M184 44 q4 -6 0 -12 q-4 -6 0 -12" />
        </g>
        <path
          d="M204 54 q5.5 8 0 13 q-5.5 -5 0 -13 z"
          stroke={ACCENT.S}
          strokeWidth={1.8}
          fill={ACCENT.S}
          fillOpacity={0.25}
        />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: сэрүүн чийглэг — дусал + зөөлөн долгион */}
      <g className="q10-ph q10-ph-b">
        <g className="q10-bob q10-anim">
          <path
            d="M188 34 q7 10 0 16 q-7 -6 0 -16 z"
            stroke={ACCENT.B}
            strokeWidth={2}
            fill={ACCENT.B}
            fillOpacity={0.2}
          />
        </g>
        <g stroke={ACCENT.B} strokeWidth={2} strokeLinecap="round" fill="none">
          <path d="M172 62 q6 4 12 0 q6 -4 12 0" />
          <path d="M176 72 q6 4 12 0" />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
