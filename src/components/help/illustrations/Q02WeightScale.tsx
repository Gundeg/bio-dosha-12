import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[2];

const CSS = phaseCss(
  "q2",
  `.q2-root .q2-needle{transform-box:view-box;transform-origin:120px 104px;animation:q2-wob 1.8s ease-in-out infinite}
@keyframes q2-wob{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}`
);

/** Жингийн сорил: идсэн хэмжээ (таваг) ба жингийн зүүний хөдөлгөөн. */
export function Q02WeightScale({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q2"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: жин, заалтын хуваарь, хоолны таваг */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x={78} y={104} width={84} height={26} rx={9} />
        <path d="M86 104 A34 34 0 0 1 154 104" />
        <path d="M94 82 L98 85.5 M120 70 V75 M146 82 L142 85.5" strokeWidth={2} />
        <ellipse cx={38} cy={64} rx={16} ry={5} />
        <path d="M26 62 Q38 48 50 62" strokeWidth={2} />
      </g>

      {/* Х: их идсэн ч зүү зүүн талдаа — жин нэмэгддэггүй */}
      <g className="q2-ph q2-ph-h">
        <g className="q2-needle q2-anim" stroke={ACCENT.H} strokeWidth={3} strokeLinecap="round">
          <path d="M120 104 L96 86" />
        </g>
        <circle cx={120} cy={104} r={3.2} fill={ACCENT.H} />
        <g fill={ACCENT.H}>
          <circle cx={32} cy={57} r={2.2} />
          <circle cx={38} cy={53} r={2.2} />
          <circle cx={44} cy={57} r={2.2} />
        </g>
        <path
          d="M182 82 v16 m0 0 l-4.5 -5.5 m4.5 5.5 l4.5 -5.5"
          stroke={ACCENT.H}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: зүү голдоо тогтвортой */}
      <g className="q2-ph q2-ph-s">
        <g className="q2-needle q2-anim" stroke={ACCENT.S} strokeWidth={3} strokeLinecap="round">
          <path d="M120 104 L120 74" />
        </g>
        <circle cx={120} cy={104} r={3.2} fill={ACCENT.S} />
        <g fill={ACCENT.S}>
          <circle cx={34} cy={56} r={2.2} />
          <circle cx={42} cy={56} r={2.2} />
        </g>
        <path
          d="M176 86 h12 M176 92 h12"
          stroke={ACCENT.S}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: бага идсэн ч зүү баруун тийш — жин буурдаггүй */}
      <g className="q2-ph q2-ph-b">
        <g className="q2-needle q2-anim" stroke={ACCENT.B} strokeWidth={3} strokeLinecap="round">
          <path d="M120 104 L144 86" />
        </g>
        <circle cx={120} cy={104} r={3.2} fill={ACCENT.B} />
        <circle cx={38} cy={56} r={2.2} fill={ACCENT.B} />
        <path
          d="M182 98 v-16 m0 0 l-4.5 5.5 m4.5 -5.5 l4.5 5.5"
          stroke={ACCENT.B}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
