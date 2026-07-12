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
      {/* Суурь: газар ба баруун тийш алхаж буй хүн (хажуугаас) */}
      <path d="M16 123 H224" stroke="currentColor" strokeWidth={2} opacity={0.4} strokeLinecap="round" />
      <g
        className="q7-fig q7-anim"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={150} cy={42} r={9.5} />
        {/* их бие — урагш бага зэрэг налсан */}
        <path d="M147 53 L138 90" />
        {/* гар: урд гар урагш, хойд гар хойш — хоёулаа тохойгоор нугарсан */}
        <path d="M145 61 L158 71 L172 64" />
        <path d="M145 61 L133 72 L120 66" />
        {/* урд хөл сунгаж, өсгийгөөр газардана; ул хуруу өргөгдсөн */}
        <path d="M138 90 L155 104 L166 121" />
        <path d="M166 121 L176 116" />
        {/* хойд хөл ардаа, хурууны үзүүрээр түлхэнэ */}
        <path d="M138 90 L130 106 L118 117" />
        <path d="M118 117 L110 122" />
      </g>

      {/* Х: ард нь 3 урт хурдны зураас + том ярианы бөмбөлөг + жижиг хоёр дахь бөмбөлөг */}
      <g className="q7-ph q7-ph-h">
        <g className="q7-lines q7-anim" stroke={ACCENT.H} strokeWidth={2.5} strokeLinecap="round">
          <path d="M56 60 h32 M46 78 h36 M56 96 h30" />
        </g>
        <g stroke={ACCENT.H} strokeWidth={2.2} fill="none">
          <ellipse cx={193} cy={28} rx={20} ry={12} />
          <ellipse cx={222} cy={49} rx={9} ry={6.5} />
        </g>
        <path d="M180 37 L167 49 L188 39 Z" fill={ACCENT.H} />
        <path d="M216 53 L210 61 L221 55 Z" fill={ACCENT.H} />
        <g fill={ACCENT.H}>
          <circle cx={185} cy={28} r={2.2} />
          <circle cx={193} cy={28} r={2.2} />
          <circle cx={201} cy={28} r={2.2} />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: урагш чиглэсэн ганц зорилготой сум + 2 хурдны зураас */}
      <g className="q7-ph q7-ph-s">
        <path
          d="M180 76 H214 M214 76 l-9 -5.5 M214 76 l-9 5.5"
          stroke={ACCENT.S}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g className="q7-lines q7-anim" stroke={ACCENT.S} strokeWidth={2.5} strokeLinecap="round">
          <path d="M58 68 h28 M62 90 h24" />
        </g>
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: нэг богино зураас + нэг цэгтэй жижиг бөмбөлөг — бүгд тайван */}
      <g className="q7-ph q7-ph-b">
        <g className="q7-slow q7-anim" stroke={ACCENT.B} strokeWidth={2.5} strokeLinecap="round">
          <path d="M70 84 h16" />
        </g>
        <ellipse cx={190} cy={32} rx={12} ry={8.5} stroke={ACCENT.B} strokeWidth={2.2} />
        <path d="M182 38 L173 47 L188 40 Z" fill={ACCENT.B} />
        <circle cx={190} cy={32} r={2} fill={ACCENT.B} />
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
