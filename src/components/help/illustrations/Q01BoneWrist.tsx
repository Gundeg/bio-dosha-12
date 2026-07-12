import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";
import { DominantType } from "@/lib/questionnaireEngine";

const HELP = QUESTION_HELP[1];

const CSS = phaseCss(
  "q1",
  `.q1-root .q1-tip{animation:q1-nudge 2.2s ease-in-out infinite}
@keyframes q1-nudge{0%,100%{transform:translateY(0)}50%{transform:translateY(1.5px)}}`
);

/** Томруулсан дугуй доторх хоёр хурууны үзүүр (долоовор зүүнээс, эрхий баруунаас). */
function Fingers({ d, tipL, tipR }: { d: DominantType; tipL: [number, number]; tipR: [number, number] }) {
  const [lx, ly] = tipL;
  const [rx, ry] = tipR;
  return (
    <g stroke={ACCENT[d]} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* баруун хуруу эхэлж зурагдана — Х үед зүүн нь дээгүүр давхарлана */}
      <path
        d={`M204 112 C202 94 ${rx + 18} ${ry + 12} ${rx + 8} ${ry} C${rx + 5} ${ry - 4} ${rx - 1} ${ry - 4} ${rx - 3} ${ry} C${rx - 5} ${ry + 4} ${rx - 2} ${ry + 8} ${rx + 2} ${ry + 12} C${rx + 12} ${ry + 24} 192 100 194 114`}
      />
      <path d={`M${rx + 6} ${ry - 1} C${rx + 4} ${ry - 3} ${rx} ${ry - 3} ${rx - 2} ${ry - 1}`} strokeWidth={1.8} opacity={0.7} />
      <path
        d={`M148 112 C150 94 ${lx - 18} ${ly + 12} ${lx - 8} ${ly} C${lx - 5} ${ly - 4} ${lx + 1} ${ly - 4} ${lx + 3} ${ly} C${lx + 5} ${ly + 4} ${lx + 2} ${ly + 8} ${lx - 2} ${ly + 12} C${lx - 12} ${ly + 24} 160 100 158 114`}
      />
      <path d={`M${lx - 6} ${ly - 1} C${lx - 4} ${ly - 3} ${lx} ${ly - 3} ${lx + 2} ${ly - 1}`} strokeWidth={1.8} opacity={0.7} />
    </g>
  );
}

/** Бугуйн сорил: эрхий, долоовор хуруу давхарлах / хүрэх / хүрэлцэхгүй. */
export function Q01BoneWrist({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q1"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: шуу + сарвуу, бугуйг ороосон гар (бүслүүр + нударга) */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 96 L88 60" />
        <path d="M26 124 L100 88" />
        {/* хэмжигдэж буй гарын сарвуу */}
        <path d="M88 60 C102 53 116 55 120 64 C124 73 119 83 109 87 C106 88 103 88 100 88" />
        <path d="M104 62 C110 64 112 70 108 76" strokeWidth={2} opacity={0.5} />
        {/* ороож буй гар: бугуйн бүслүүр */}
        <ellipse cx={72} cy={92} rx={9} ry={23} transform="rotate(26 72 92)" />
        {/* атгасан нударга бүслүүрийн доод талд */}
        <path d="M64 108 C52 108 44 118 50 128 C56 137 72 135 76 125" />
        <path d="M56 116 q5 4 10 1 M54 124 q5 4 10 1" strokeWidth={2} opacity={0.5} />
      </g>
      {/* томруулагч: хурууны үзүүр уулзах цэгээс инсет рүү */}
      <g stroke="currentColor" strokeWidth={2} fill="none" opacity={0.55}>
        <circle cx={62} cy={70} r={11} strokeDasharray="3 4" />
        <path d="M72 63 C96 44 118 40 134 44" strokeDasharray="3 4" />
      </g>
      <circle cx={176} cy={76} r={44} stroke="currentColor" strokeWidth={2.5} fill="none" />

      {/* Х: үзүүрүүд давхарлана — зүүн хуруу баруун дээгүүр гарна */}
      <g className="q1-ph q1-ph-h">
        <g className="q1-tip q1-anim">
          <Fingers d="H" tipL={[188, 62]} tipR={[178, 70]} />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: үзүүрүүд яг хүрнэ */}
      <g className="q1-ph q1-ph-s">
        <g className="q1-tip q1-anim">
          <Fingers d="S" tipL={[172, 66]} tipR={[180, 66]} />
          <path d="M176 50 v-6 M166 53 l-4 -4 M186 53 l4 -4" stroke={ACCENT.S} strokeWidth={2} strokeLinecap="round" />
        </g>
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: үзүүрүүд хүрэлцэхгүй, зай үлдэнэ */}
      <g className="q1-ph q1-ph-b">
        <g className="q1-tip q1-anim">
          <Fingers d="B" tipL={[162, 72]} tipR={[190, 72]} />
          <path d="M167 62 L185 62" stroke={ACCENT.B} strokeWidth={2} strokeLinecap="round" strokeDasharray="2 3" />
          <path d="M170 58 l-3 4 3 4 M182 58 l3 4 -3 4" stroke={ACCENT.B} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
