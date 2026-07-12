import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[12];

/** 7 хоногийн нүдний төв цэгүүд (x). */
const DAY_CX = [52.5, 75, 97.5, 120, 142.5, 165, 187.5];
const DAY_CY = 73;

const check = (c: number) => `M${c - 5.5} ${DAY_CY} l4.5 5 7.5 -9`;
const cross = (c: number) => `M${c - 4.5} ${DAY_CY - 4.5} l9 9 m0 -9 l-9 9`;
const boldCheck = (c: number) => `M${c - 6.5} ${DAY_CY} l5 5.5 8.5 -10`;

/**
 * Хореограф: фаз бүрийн эхэнд 7 хоногийн тэмдгүүд зүүнээс баруун тийш ээлжлэн
 * гарч ирж (pop + negative delay stagger), долоо хоног дүүрсний дараа өтгөний
 * дүрс + тайлбар тодорно; Ш-ийн том тэмдэг хамгийн сүүлд гарна. Х-ийн ×
 * тэмдгүүд гарч ирснийхээ дараа үргэлжлэн анивчина. Эцсийн байрлал нь атрибутад.
 */
const CSS = phaseCss(
  "q12",
  `.q12-root .q12-blink{animation:q12-bl 1.2s ease-in-out infinite}
@keyframes q12-bl{0%,100%{opacity:.9}50%{opacity:.3}}
.q12-root .q12-mk-h{animation:q12-mkh 9s linear infinite}
.q12-root .q12-mk-s{animation:q12-mks 9s linear infinite}
.q12-root .q12-mk-b{animation:q12-mkb 9s linear infinite}
.q12-root .q12-mk-h,.q12-root .q12-mk-s,.q12-root .q12-mk-b{transform-box:fill-box;transform-origin:center}
@keyframes q12-mkh{0%{opacity:0;transform:scale(.3)}1.3%{opacity:1;transform:scale(1.25)}2.2%,30%{opacity:1;transform:scale(1)}34%,100%{opacity:0;transform:scale(.3)}}
@keyframes q12-mks{0%,33%{opacity:0;transform:scale(.3)}34.3%{opacity:1;transform:scale(1.25)}35.2%,63%{opacity:1;transform:scale(1)}67%,100%{opacity:0;transform:scale(.3)}}
@keyframes q12-mkb{0%,66%{opacity:0;transform:scale(.3)}67.3%{opacity:1;transform:scale(1.25)}68.2%,96%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.3)}}
.q12-root .q12-st-h{animation:q12-sth 9s linear infinite}
.q12-root .q12-st-s{animation:q12-sts 9s linear infinite}
.q12-root .q12-st-b{animation:q12-stb 9s linear infinite}
@keyframes q12-sth{0%,14%{opacity:0}17%,30%{opacity:1}34%,100%{opacity:0}}
@keyframes q12-sts{0%,46%{opacity:0}49%,63%{opacity:1}67%,100%{opacity:0}}
@keyframes q12-stb{0%,77%{opacity:0}80%,96%{opacity:1}100%{opacity:0}}
.q12-root .q12-big-s{animation:q12-bigs 9s linear infinite}
@keyframes q12-bigs{0%,51%{opacity:0}54%,63%{opacity:1}67%,100%{opacity:0}}`
);

/** i дэх өдрийн тэмдэг 0.15·i секундын дараа гарч ирнэ (сөрөг delay = эерэг шилжилт). */
const dayDelay = (i: number, step = 0.15) => ({ animationDelay: `${(i * step - 9).toFixed(2)}s` });

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
            <path key={i} className="q12-mk-h q12-anim" style={dayDelay(i)} d={check(DAY_CX[i])} />
          ))}
        </g>
        <g className="q12-blink q12-anim" stroke={ACCENT.H} strokeWidth={2.5} strokeLinecap="round">
          {[2, 3, 5].map((i) => (
            <path key={i} className="q12-mk-h q12-anim" style={dayDelay(i)} d={cross(DAY_CX[i])} />
          ))}
        </g>
        {/* өтгөний хэлбэр: хатуу, цэцэрхэй бөөгнөрөл — долоо хоног дүүрсний дараа */}
        <g className="q12-st-h q12-anim">
          <text x={196} y={131} textAnchor="middle" fontSize={8.5} fill={ACCENT.H} opacity={0.85} fontFamily="inherit">
            өтгөн
          </text>
          <g stroke={ACCENT.H} strokeWidth={2.2} fill="none">
            <circle cx={186} cy={113} r={4.5} />
            <circle cx={197} cy={109} r={4} />
            <circle cx={206} cy={115} r={4.5} />
          </g>
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: өдөр бүр тогтмол — нүд бүрт тэмдэг + доор нь том тэмдэг */}
      <g className="q12-ph q12-ph-s">
        {DAY_CX.map((c, i) => (
          <path
            key={c}
            className="q12-mk-s q12-anim"
            style={dayDelay(i)}
            d={check(c)}
            stroke={ACCENT.S}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        <path
          className="q12-big-s q12-anim"
          d="M104 110 l7 7 13 -13"
          stroke={ACCENT.S}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* өтгөний хэлбэр: зөөлөн, гөлгөр хэвийн — долоо хоног дүүрсний дараа */}
        <g className="q12-st-s q12-anim">
          <text x={196} y={131} textAnchor="middle" fontSize={8.5} fill={ACCENT.S} opacity={0.85} fontFamily="inherit">
            өтгөн
          </text>
          <g stroke={ACCENT.S} strokeWidth={2.2} fill="none" strokeLinecap="round">
            <rect x={178} y={107} width={36} height={11} rx={5.5} />
            <path d="M190 107 q1.5 5.5 0 11 M202 107 q1.5 5.5 0 11" strokeWidth={1.8} opacity={0.6} />
          </g>
        </g>
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: хоёр өдөрт нэг, гэхдээ бүрэн — 1,3,5,7-д том тод тэмдэг */}
      <g className="q12-ph q12-ph-b">
        <g stroke={ACCENT.B} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {[0, 2, 4, 6].map((i, j) => (
            <path key={i} className="q12-mk-b q12-anim" style={dayDelay(j, 0.2)} d={boldCheck(DAY_CX[i])} />
          ))}
        </g>
        {/* өтгөний хэлбэр: зузаан, их хэмжээтэй — долоо хоног дүүрсний дараа */}
        <g className="q12-st-b q12-anim">
          <text x={195} y={131} textAnchor="middle" fontSize={8.5} fill={ACCENT.B} opacity={0.85} fontFamily="inherit">
            өтгөн
          </text>
          <g stroke={ACCENT.B} strokeWidth={2.6} fill="none" strokeLinecap="round">
            <rect x={172} y={104} width={46} height={16} rx={8} />
            <path d="M188 104 q2 8 0 16 M204 104 q2 8 0 16" strokeWidth={2} opacity={0.6} />
          </g>
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
