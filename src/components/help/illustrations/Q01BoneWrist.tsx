import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";
import { DominantType } from "@/lib/questionnaireEngine";

const HELP = QUESTION_HELP[1];

const CSS = phaseCss(
  "q1",
  `.q1-root .q1-tip{animation:q1-nudge 2.2s ease-in-out infinite}
@keyframes q1-nudge{0%,100%{transform:translateY(0)}50%{transform:translateY(1.5px)}}`
);

/** Томруулсан дугуй доторх атгаж буй гарын хоёр хурууны үзүүр. */
function Fingers({ d, tipL, tipR }: { d: DominantType; tipL: [number, number]; tipR: [number, number] }) {
  const [lx, ly] = tipL;
  const [rx, ry] = tipR;
  return (
    <g stroke={ACCENT[d]} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* баруун хуруу эхэлж зурагдана — Х үед зүүн нь дээгүүр давж гарна */}
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

/** Бугуйн сорил: алга шуутай залгагдах хэсгийг атгаж, хурууны нийлэлтийг харна. */
export function Q01BoneWrist({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q1"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Хэмжигдэж буй гар: дэлгэсэн алга (5 хуруутай) + доошоо шуу */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M54 86 L53 64 C51 56 44 51 38 47 C33 43.5 35.5 37 41 39 C47 41.5 54 47 57 53 C57 44 57.5 34 58 27 C58.4 21.8 65 21.8 65.4 27 C65.8 33 66 41 66.2 47 C66.4 38 67 25 67.4 18 C67.8 12.8 74.4 12.8 74.8 18 C75.2 25 75.6 38 75.8 47 C76 36 76.5 27 77 22 C77.4 16.8 84 16.8 84.4 22 C84.8 28 85.2 38 85.4 48 C85.6 40 86.2 33 86.8 29 C87.2 24.4 93 24.4 93.2 29 C93.4 35 93 44 92 52 C92.5 64 92 76 90 86" />
        <path d="M54 86 C52 98 50 112 46 128" />
        <path d="M90 86 C92 98 95 112 99 128" />
        <path d="M60 62 Q72 70 86 60" strokeWidth={2} opacity={0.35} />
      </g>

      {/* Атгаж буй гар: бугуйн бүслүүр + нударга, хоёр хуруу нь зүүн тийш тойрно */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <ellipse cx={72} cy={90} rx={23} ry={8.5} />
        <path d="M95 84 C110 80 122 88 121 100 C120 112 106 118 96 112 C92 109.5 90.5 105 91 100" />
        <path d="M121 96 L138 100 M118 108 L134 114" strokeWidth={2.2} />
        <path d="M101 113 q6 3 11 -1" strokeWidth={2} opacity={0.5} />
        {/* эрхий (дээгүүр) ба долоовор (доогуур) хуруу — үзүүр нь бугуйн урд нийлнэ */}
        <path d="M95 84 C88 80 80 79 73 81" />
        <path d="M96 112 C86 112 76 106 70 97" />
      </g>

      {/* томруулагч: хурууны үзүүр нийлэх цэгээс инсет рүү */}
      <g stroke="currentColor" strokeWidth={2} fill="none" opacity={0.55}>
        <circle cx={71} cy={90} r={13} strokeDasharray="3 4" />
        <path d="M85 84 C104 66 118 60 133 62" strokeDasharray="3 4" />
      </g>
      <circle cx={176} cy={76} r={44} stroke="currentColor" strokeWidth={2.5} fill="none" />

      {/* Х: үзүүрүүд давж гарна — зүүн хуруу баруун дээгүүр давхарлана */}
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

      {/* Б: үзүүрүүд хүрэхгүй, зай үлдэнэ */}
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
