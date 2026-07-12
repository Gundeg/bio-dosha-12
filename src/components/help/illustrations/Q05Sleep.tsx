import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[5];

const CSS = phaseCss(
  "q5",
  `.q5-root .q5-blink{animation:q5-blk 1.1s ease-in-out infinite}
@keyframes q5-blk{0%,100%{opacity:1}50%{opacity:.2}}
.q5-root .q5-float{animation:q5-flt 2.4s ease-in-out infinite}
@keyframes q5-flt{0%,100%{transform:translateY(0);opacity:.9}50%{transform:translateY(-4px);opacity:1}}`
);

/** Нойрны сорил: унтсан цагийн урт + шөнийн сэрэлт. */
export function Q05Sleep({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q5"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: сар, одод, нойрны хугацааны зурвас */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M46 24 a14 14 0 1 0 10 24 a11 11 0 1 1 -10 -24 z" />
        <path d="M76 30 v8 M72 34 h8 M92 46 v6 M89 49 h6" strokeWidth={1.8} opacity={0.5} />
        <rect x={40} y={104} width={160} height={14} rx={7} />
      </g>
      <text x={40} y={132} fontSize={9} fill="currentColor" opacity={0.55} fontFamily="inherit">
        0ц
      </text>
      <text
        x={200}
        y={132}
        fontSize={9}
        fill="currentColor"
        opacity={0.55}
        textAnchor="end"
        fontFamily="inherit"
      >
        12ц
      </text>

      {/* Х: богино нойр + сэрэлтүүд */}
      <g className="q5-ph q5-ph-h">
        <rect x={43} y={107} width={72} height={8} rx={4} fill={ACCENT.H} opacity={0.5} />
        <g className="q5-blink q5-anim" stroke={ACCENT.H} strokeWidth={2.2} strokeLinecap="round">
          <path d="M70 98 v-8 M70 86 v-1.5" />
          <path d="M96 98 v-8 M96 86 v-1.5" />
        </g>
        <text x={198} y={97} fontSize={11.5} fontWeight={700} fill={ACCENT.H} textAnchor="end" fontFamily="inherit">
          5–6ц
        </text>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: тогтмол 7–8 цаг */}
      <g className="q5-ph q5-ph-s">
        <rect x={43} y={107} width={104} height={8} rx={4} fill={ACCENT.S} opacity={0.5} />
        <path
          d="M156 94 l5 5 9 -9"
          stroke={ACCENT.S}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x={198} y={97} fontSize={11.5} fontWeight={700} fill={ACCENT.S} textAnchor="end" fontFamily="inherit">
          7–8ц
        </text>
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: гүн урт нойр */}
      <g className="q5-ph q5-ph-b">
        <rect x={43} y={107} width={140} height={8} rx={4} fill={ACCENT.B} opacity={0.5} />
        <g className="q5-float q5-anim">
          <text x={160} y={88} fontSize={14} fontWeight={700} fill={ACCENT.B} fontFamily="inherit">
            Z
          </text>
          <text x={172} y={80} fontSize={11} fontWeight={700} fill={ACCENT.B} fontFamily="inherit">
            z
          </text>
          <text x={181} y={73} fontSize={8.5} fontWeight={700} fill={ACCENT.B} fontFamily="inherit">
            z
          </text>
        </g>
        <text x={198} y={97} fontSize={11.5} fontWeight={700} fill={ACCENT.B} textAnchor="end" fontFamily="inherit">
          9+ц
        </text>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
