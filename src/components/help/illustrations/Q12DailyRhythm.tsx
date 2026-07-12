import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[12];

/** 7 хоногийн нүдний төв цэгүүд (x). */
const DAY_CX = [52.5, 75, 97.5, 120, 142.5, 165, 187.5];
const DAY_CY = 73;

const check = (c: number) => `M${c - 5.5} ${DAY_CY} l4.5 5 7.5 -9`;
const cross = (c: number) => `M${c - 4.5} ${DAY_CY - 4.5} l9 9 m0 -9 l-9 9`;
const boldCheck = (c: number) => `M${c - 6.5} ${DAY_CY} l5 5.5 8.5 -10`;

const CSS = phaseCss(
  "q12",
  `.q12-root .q12-blink{animation:q12-bl 1.2s ease-in-out infinite}
@keyframes q12-bl{0%,100%{opacity:.9}50%{opacity:.3}}
.q12-root .q12-wave{animation:q12-wv 2.1s ease-in-out infinite}
@keyframes q12-wv{0%,100%{opacity:.85}50%{opacity:.4}}`
);

/** Хэвлийн сорил: ханын хуанли — 7 хоногийн хэвшил тогтмол бус / тогтмол / удаан их. */
export function Q12DailyRhythm({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q12"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: ханын хуанли — жааз, 2 үдээсний цагираг, толгойн зурвас, 7 нүд */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x={34} y={26} width={172} height={76} rx={8} />
        <path d="M34 48 H206" strokeWidth={2.2} />
        <path d="M71 26 v-7 a6 6 0 0 1 12 0 v7" strokeWidth={2.2} />
        <path d="M157 26 v-7 a6 6 0 0 1 12 0 v7" strokeWidth={2.2} />
      </g>
      <text
        x={120}
        y={41}
        textAnchor="middle"
        fontSize={10.5}
        fill="currentColor"
        opacity={0.65}
        fontFamily="inherit"
      >
        7 хоног
      </text>
      <g stroke="currentColor" strokeWidth={2} opacity={0.85}>
        {DAY_CX.map((c) => (
          <rect key={c} x={c - 10.5} y={60} width={21} height={26} rx={3} />
        ))}
      </g>

      {/* Х: тогтмол бус — 1,2,5,7-д тэмдэг, 3,4,6-д анивчих × */}
      <g className="q12-ph q12-ph-h">
        <g stroke={ACCENT.H} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {[0, 1, 4, 6].map((i) => (
            <path key={i} d={check(DAY_CX[i])} />
          ))}
        </g>
        <g className="q12-blink q12-anim" stroke={ACCENT.H} strokeWidth={2.5} strokeLinecap="round">
          {[2, 3, 5].map((i) => (
            <path key={i} d={cross(DAY_CX[i])} />
          ))}
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: өдөр бүр тогтмол — нүд бүрт тэмдэг + доор нь том тэмдэг */}
      <g className="q12-ph q12-ph-s">
        {DAY_CX.map((c, i) => (
          <path
            key={c}
            className="q12-wave q12-anim"
            style={{ animationDelay: `${i * 0.15}s` }}
            d={check(c)}
            stroke={ACCENT.S}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        <path
          d="M110 110 l7 7 13 -13"
          stroke={ACCENT.S}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: хоёр өдөрт нэг, гэхдээ бүрэн — 1,3,5,7-д том тод тэмдэг */}
      <g className="q12-ph q12-ph-b">
        <g
          className="q12-wave q12-anim"
          stroke={ACCENT.B}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {[0, 2, 4, 6].map((i) => (
            <path key={i} d={boldCheck(DAY_CX[i])} />
          ))}
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
