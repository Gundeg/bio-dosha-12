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

/** Ходоодны дүрс: улаан хоолой дээрээс орж, том биетэй, нарийн гэдэс рүү эргэсэн. */
const STOMACH_D =
  "M176 36 L176 44 C176 47 175.4 50 174.2 52.6 C170 44 165 41.5 160 42 C153 42.8 148.8 48.5 148 56 C146.8 69 148.5 83 155 93 C162 103 175 108 185.5 104.5 C194.5 101.5 201 96 204.5 89 C211 91 215.5 96.5 214 101.5 C213 105.8 208 106.3 206.5 102 C205.5 98 203 93 199.5 88.5 C194.5 81 190 73 188.3 65 C186.7 58 186 50 186 44 L186 36";

function Stomach({ c }: { c: string }) {
  return (
    <path d={STOMACH_D} stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  );
}

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
      {/* тавган доорх зөөлөн сүүдэр — ширээний ирмэг дээр */}
      <ellipse cx={82} cy={122} rx={33} ry={2.2} fill="currentColor" opacity={0.07} />

      {/* Суурь: ханын цаг 12:00, ширээний ирмэг дээр хоосон таваг + сэрээ, хутга */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {/* ханын цаг — үдийн 12 */}
        <circle cx={82} cy={27} r={15} />
        <path d="M82 14 v4 M82 36 v4 M69 27 h4 M91 27 h4" strokeWidth={2} opacity={0.5} />
        <path d="M82 27 V16.5 M82 27 L84.5 19.5" strokeWidth={2.2} />
        {/* ширээний ирмэг */}
        <path d="M12 122 H148" />
        {/* хоосон таваг: хүрээ + ёроол */}
        <circle cx={82} cy={91} r={31} />
        <circle cx={82} cy={91} r={19} strokeWidth={2} opacity={0.55} />
        {/* сэрээ — 4 шүдтэй */}
        <path d="M28 64 V78 C28 84 31 87 36 87 C41 87 44 84 44 78 V64" />
        <path d="M33.3 64 V76 M38.7 64 V76" strokeWidth={2} opacity={0.55} />
        <path d="M36 87 V119" />
        {/* хутга — ир + бариул */}
        <path d="M121 63 C130 65 134.5 73 134.5 82 L134.5 90 L121 90 Z" />
        <path d="M128 90 V119" />
      </g>
      <circle cx={82} cy={27} r={1.6} fill="currentColor" />

      {/* Х: жижиг дөл тогтворгүй анивчина + "?" */}
      <g className="q6-ph q6-ph-h">
        <Stomach c={ACCENT.H} />
        <g className="q6-flick q6-anim">
          <path
            d="M176 71 c5 7 8 11 7 17 a9.5 9.5 0 0 1 -19 1 c-1 -7 3.5 -10 6.5 -14 c1 3.5 2.5 5.5 5.5 7.5 c1 -4 0 -7.5 0 -11.5 z"
            stroke={ACCENT.H}
            strokeWidth={2.2}
            strokeLinejoin="round"
            fill={ACCENT.H}
            fillOpacity={0.1}
          />
        </g>
        <text x={206} y={56} fontSize={17} fontWeight={700} fill={ACCENT.H} fontFamily="inherit">
          ?
        </text>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: ходоодыг дүүргэсэн том хүчтэй дөл + ууртай оч */}
      <g className="q6-ph q6-ph-s">
        <Stomach c={ACCENT.S} />
        <g className="q6-steady q6-anim">
          <path
            d="M172 62 c7 9 11.5 15 10 23 a12 12 0 0 1 -24 1 c-1.8 -9 4.5 -12.5 8 -17 c1 4.5 3 6.5 6.5 9.5 c1.8 -6 0 -10.5 -.5 -16.5 z"
            stroke={ACCENT.S}
            strokeWidth={2.4}
            strokeLinejoin="round"
            fill={ACCENT.S}
            fillOpacity={0.15}
          />
        </g>
        <path
          d="M212 52 l6 -10 M220 58 l9 -5"
          stroke={ACCENT.S}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: өчүүхэн цог + "…" — бараг мэдрэгдэхгүй */}
      <g className="q6-ph q6-ph-b">
        <Stomach c={ACCENT.B} />
        <g className="q6-steady q6-anim">
          <path
            d="M175 82 c3.5 4.5 5.5 7 4.5 11 a6.5 6.5 0 0 1 -12.5 .5 c-.5 -4.5 2 -6.5 4 -9 c.5 2 1.5 3.5 3 4.5 c.5 -2.5 .5 -4.5 1 -7 z"
            stroke={ACCENT.B}
            strokeWidth={2.2}
            strokeLinejoin="round"
            fill={ACCENT.B}
            fillOpacity={0.1}
          />
        </g>
        <g fill={ACCENT.B}>
          <circle cx={206} cy={116} r={2} />
          <circle cx={214} cy={116} r={2} />
          <circle cx={222} cy={116} r={2} />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
