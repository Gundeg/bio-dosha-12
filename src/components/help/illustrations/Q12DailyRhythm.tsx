import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[12];

const DAY_X = [36, 64, 92, 120, 148, 176, 204];

const CSS = phaseCss(
  "q12",
  `.q12-root .q12-blink{animation:q12-bl 1.2s ease-in-out infinite}
@keyframes q12-bl{0%,100%{opacity:.9}50%{opacity:.3}}
.q12-root .q12-wave{animation:q12-wv 2.1s ease-in-out infinite}
@keyframes q12-wv{0%,100%{opacity:.85}50%{opacity:.4}}`
);

/** Хэвлийн сорил: 7 хоногийн хэвшил — тогтмол бус / тогтмол / удаан их. */
export function Q12DailyRhythm({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q12"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: 7 хоногийн дугуйнууд */}
      <text x={28} y={38} fontSize={10.5} fill="currentColor" opacity={0.6} fontFamily="inherit">
        7 хоног
      </text>
      <g stroke="currentColor" strokeWidth={2.2}>
        {DAY_X.map((x) => (
          <circle key={x} cx={x} cy={84} r={9} />
        ))}
      </g>

      {/* Х: тогтмол бус — заримдаа болдог, заримдаа огт үгүй */}
      <g className="q12-ph q12-ph-h">
        <circle cx={36} cy={84} r={6} fill={ACCENT.H} opacity={0.75} />
        <circle cx={64} cy={84} r={6} fill={ACCENT.H} opacity={0.75} />
        <g
          className="q12-blink q12-anim"
          stroke={ACCENT.H}
          strokeWidth={2.2}
          strokeLinecap="round"
        >
          <path d="M88 80 l8 8 m0 -8 l-8 8" />
          <path d="M116 80 l8 8 m0 -8 l-8 8" />
        </g>
        <circle cx={148} cy={84} r={6} fill={ACCENT.H} opacity={0.75} />
        <g
          className="q12-blink q12-anim"
          stroke={ACCENT.H}
          strokeWidth={2.2}
          strokeLinecap="round"
        >
          <path d="M172 80 l8 8 m0 -8 l-8 8" />
        </g>
        <circle cx={204} cy={84} r={6} fill={ACCENT.H} opacity={0.75} />
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: өдөр бүр тогтмол */}
      <g className="q12-ph q12-ph-s">
        {DAY_X.map((x, i) => (
          <circle
            key={x}
            className="q12-wave q12-anim"
            style={{ animationDelay: `${i * 0.15}s` }}
            cx={x}
            cy={84}
            r={6}
            fill={ACCENT.S}
            opacity={0.75}
          />
        ))}
        <path
          d="M108 112 l6 6 10 -10"
          stroke={ACCENT.S}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: хоёр өдөрт нэг, гэхдээ их хэмжээтэй */}
      <g className="q12-ph q12-ph-b">
        {[36, 92, 148, 204].map((x) => (
          <circle key={x} cx={x} cy={84} r={8} fill={ACCENT.B} opacity={0.7} />
        ))}
        <g className="q12-wave q12-anim" stroke={ACCENT.B} strokeWidth={2} strokeLinecap="round" fill="none">
          <path d="M96 114 q8 5 16 0 q8 -5 16 0" />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
