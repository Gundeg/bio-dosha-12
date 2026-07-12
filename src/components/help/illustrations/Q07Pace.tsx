import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[7];

const CSS = phaseCss(
  "q7",
  `.q7-root .q7-fig{animation:q7-bob 1.4s ease-in-out infinite}
@keyframes q7-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
.q7-root .q7-lines{animation:q7-drift 1s linear infinite}
@keyframes q7-drift{0%{transform:translateX(0);opacity:1}100%{transform:translateX(-7px);opacity:.35}}
.q7-root .q7-slow{animation:q7-fade 2.6s ease-in-out infinite}
@keyframes q7-fade{0%,100%{opacity:.9}50%{opacity:.4}}`
);

/** Хурдны сорил: алхаа, ярианы хэмнэл — хурдан / шийдэмгий / тайван. */
export function Q07Pace({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q7"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: газар ба алхаж буй хүн */}
      <path d="M20 124 H220" stroke="currentColor" strokeWidth={2} opacity={0.4} strokeLinecap="round" />
      <g
        className="q7-fig q7-anim"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={138} cy={52} r={9} />
        <path d="M138 61 L132 92" />
        <path d="M136 68 L120 80 M136 68 L152 78" />
        <path d="M132 92 L114 122 M132 92 L148 120" />
      </g>

      {/* Х: олон хурдны зураас + олон үгтэй ярианы бөмбөлөг */}
      <g className="q7-ph q7-ph-h">
        <g className="q7-lines q7-anim" stroke={ACCENT.H} strokeWidth={2.5} strokeLinecap="round">
          <path d="M58 60 h26 M48 78 h30 M58 96 h24" />
        </g>
        <ellipse cx={70} cy={34} rx={22} ry={13} stroke={ACCENT.H} strokeWidth={2.2} />
        <path d="M84 44 l7 8" stroke={ACCENT.H} strokeWidth={2.2} strokeLinecap="round" />
        <g fill={ACCENT.H}>
          <circle cx={61} cy={34} r={2.2} />
          <circle cx={70} cy={34} r={2.2} />
          <circle cx={79} cy={34} r={2.2} />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: зорилготой шулуун сум */}
      <g className="q7-ph q7-ph-s">
        <g stroke={ACCENT.S} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M52 84 h44 m0 0 l-8 -5 m8 5 l-8 5" />
          <g className="q7-lines q7-anim">
            <path d="M60 66 h22 M60 102 h22" strokeWidth={2} />
          </g>
        </g>
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: нэг богино зураас + цөөн үгтэй бөмбөлөг */}
      <g className="q7-ph q7-ph-b">
        <g className="q7-slow q7-anim" stroke={ACCENT.B} strokeWidth={2.5} strokeLinecap="round">
          <path d="M66 84 h14" />
        </g>
        <ellipse cx={72} cy={40} rx={13} ry={9} stroke={ACCENT.B} strokeWidth={2.2} />
        <path d="M81 47 l5 6" stroke={ACCENT.B} strokeWidth={2} strokeLinecap="round" />
        <circle cx={72} cy={40} r={2} fill={ACCENT.B} />
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
