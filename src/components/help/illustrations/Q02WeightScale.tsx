import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[2];

const CSS = phaseCss(
  "q2",
  `.q2-root .q2-blink{animation:q2-blink 1.6s ease-in-out infinite}
@keyframes q2-blink{0%,100%{opacity:1}50%{opacity:.25}}`
);

/** Дээрээс харсан хөл: сунасан ул + 4 хурууны тойрог (эрхий нь дотогшоо). */
function Foot({ x, flip = false }: { x: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} 86)${flip ? " scale(-1 1)" : ""} rotate(-6)`}>
      <path d="M-9 18 C-10 27 -5 31 0 31 C5 31 10 27 9 18 C8.3 9 9.8 -8 8.5 -16 C7.8 -21 4.5 -23.5 1 -23 C-4 -22.3 -7.5 -19 -8.6 -14 C-10.3 -4 -8.3 8 -9 18 Z" />
      <g strokeWidth={2}>
        <circle cx={5.5} cy={-27} r={3.2} />
        <circle cx={0} cy={-26.5} r={2.4} />
        <circle cx={-4.5} cy={-24.5} r={2.2} />
        <circle cx={-8.5} cy={-21.5} r={2} />
      </g>
    </g>
  );
}

/** Жингийн сорил: жин дээр зогссон хоёр хөл, хажууд нь идсэн таваг, дэлгэцийн заалт. */
export function Q02WeightScale({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q2"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: жингийн тавцан + дэлгэц + хоёр хөл, зүүн талд таваг + сэрээ + уур */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x={92} y={16} width={116} height={108} rx={16} />
        <rect x={129} y={24} width={42} height={18} rx={4} />
        <Foot x={127} />
        <Foot x={173} flip />
        {/* таваг */}
        <path d="M16 88 H72" />
        <path d="M20 88 C22 97 30 100 44 100 C58 100 66 97 68 88" />
        {/* сэрээ */}
        <path d="M82 98 V66" />
        <path d="M77 52 v8 q0 6 5 6 q5 0 5 -6 v-8 M82 52 v9" strokeWidth={2} />
        {/* уур */}
        <path d="M38 62 q-4 -6 0 -11 q4 -5 0 -11 M52 62 q-4 -6 0 -11 q4 -5 0 -11" strokeWidth={2} opacity={0.5} />
      </g>

      {/* Х: таваг дүүрэн идсэн ч заалт доошоо — жин нэмэгддэггүй */}
      <g className="q2-ph q2-ph-h">
        <path d="M24 88 Q44 58 64 88" stroke={ACCENT.H} strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <g fill={ACCENT.H}>
          <circle cx={36} cy={80} r={2.4} />
          <circle cx={44} cy={73} r={2.4} />
          <circle cx={52} cy={80} r={2.4} />
        </g>
        <path
          className="q2-blink q2-anim"
          d="M150 27 v12 m0 0 l-4.5 -5 m4.5 5 l4.5 -5"
          stroke={ACCENT.H}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: дунд зэрэг идээд заалт тэнцүү — тогтвортой */}
      <g className="q2-ph q2-ph-s">
        <path d="M28 88 Q44 68 60 88" stroke={ACCENT.S} strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <g fill={ACCENT.S}>
          <circle cx={38} cy={81} r={2.4} />
          <circle cx={50} cy={81} r={2.4} />
        </g>
        <path
          d="M144 30 h12 M144 36 h12"
          stroke={ACCENT.S}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: бага идсэн ч заалт дээшээ — жин буурдаггүй */}
      <g className="q2-ph q2-ph-b">
        <path d="M33 88 Q44 76 55 88" stroke={ACCENT.B} strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <circle cx={44} cy={83} r={2.4} fill={ACCENT.B} />
        <path
          className="q2-blink q2-anim"
          d="M150 39 V27 m0 0 l-4.5 5 m4.5 -5 l4.5 5"
          stroke={ACCENT.B}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
