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
      {/* Суурь: дээлтэй хүн — толгой, хүзүү, ханцуйтай их бие, хөл */}
      <ellipse cx={122} cy={124} rx={28} ry={3.5} fill="currentColor" opacity={0.07} />
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={122} cy={34} r={11} />
        <path d="M118 45 L117 50 M126 45 L127 50" strokeWidth={2} />
        {/* дээлийн силуэт: мөр → ханцуй → бугуйвч → суга → хормой */}
        <path
          d="M112 50 C106 50.5 100 51.8 94.5 60 L74 90 Q71 94 75 96 L84 98 Q88 99 89 95 L104 72 L99 106 L145 106 L140 72 L155 95 Q156 99 160 98 L169 96 Q173 94 170 90 L149.5 60 C144 51.8 138 50.5 132 50"
          fill="currentColor"
          fillOpacity={0.05}
        />
        {/* энгэрийн зах + бүс */}
        <path d="M122 56 V80 M103 84 H141" strokeWidth={2} opacity={0.5} />
        {/* хөл, ул */}
        <path d="M112 106 V121 H104 M132 106 V121 H140" />
      </g>

      {/* Х: 6 салаат цасан ширхэг + ороолт + чичрэх */}
      <g className="q4-ph q4-ph-h">
        <g className="q4-spin q4-anim" stroke={ACCENT.H} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {[0, 60, 120].map((a) => (
            <g key={a} transform={`rotate(${a} 54 42)`}>
              <path d="M54 22 V62" />
              <path d="M49 24 L54 29 L59 24 M49 60 L54 55 L59 60" />
            </g>
          ))}
        </g>
        <g stroke={ACCENT.H} strokeWidth={2.5} strokeLinecap="round" fill="none">
          <path d="M108 52 Q122 61 136 52" />
          <path d="M129 57 Q133 64 129 71" />
        </g>
        <g className="q4-shiver q4-anim" stroke={ACCENT.H} strokeWidth={2} strokeLinecap="round" fill="none">
          <path d="M76 58 q-8 10 0 20" />
          <path d="M67 64 q-6 7 0 14" />
          <path d="M168 58 q8 10 0 20" />
          <path d="M177 64 q6 7 0 14" />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: нар (8 цацрагтай) + толгойноос үсрэх хөлс */}
      <g className="q4-ph q4-ph-s">
        <circle cx={186} cy={38} r={13} stroke={ACCENT.S} strokeWidth={2.5} fill={ACCENT.S} fillOpacity={0.1} />
        <g className="q4-rays q4-anim" stroke={ACCENT.S} strokeWidth={2.5} strokeLinecap="round">
          <path d="M186 21 v-8 M186 55 v8 M169 38 h-8 M203 38 h8 M174 26 l-6 -6 M198 26 l6 -6 M174 50 l-6 6 M198 50 l6 6" />
        </g>
        <g
          className="q4-rain q4-anim"
          stroke={ACCENT.S}
          strokeWidth={1.8}
          strokeLinejoin="round"
          fill={ACCENT.S}
          fillOpacity={0.12}
        >
          <path d="M141 26 c2.4 3.5 3.8 5.6 3.4 7.7 a3.5 3.5 0 1 1 -6.8 0 c-.5 -2.1 .9 -4.2 3.4 -7.7 z" />
          <path d="M151 39 c2.4 3.5 3.8 5.6 3.4 7.7 a3.5 3.5 0 1 1 -6.8 0 c-.5 -2.1 .9 -4.2 3.4 -7.7 z" />
          <path d="M100 33 c2.4 3.5 3.8 5.6 3.4 7.7 a3.5 3.5 0 1 1 -6.8 0 c-.5 -2.1 .9 -4.2 3.4 -7.7 z" />
        </g>
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: борооны үүл + бороо + хөл доорх шалбааг */}
      <g className="q4-ph q4-ph-b">
        <path
          d="M30 56 C26 44 38 36 48 40 C52 28 70 26 76 36 C88 32 96 44 88 56 Z"
          stroke={ACCENT.B}
          strokeWidth={2.5}
          strokeLinejoin="round"
          fill={ACCENT.B}
          fillOpacity={0.1}
        />
        <g className="q4-rain q4-anim" stroke={ACCENT.B} strokeWidth={2} strokeLinecap="round">
          <path d="M40 64 l-3 9 M54 64 l-3 9 M68 64 l-3 9 M82 64 l-3 9" />
        </g>
        <ellipse cx={122} cy={124} rx={26} ry={3.5} stroke={ACCENT.B} strokeWidth={2} fill={ACCENT.B} fillOpacity={0.12} />
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
