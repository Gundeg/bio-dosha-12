import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[2];

/**
 * Хореограф: фаз бүрийн эхэнд хоол тавган дээр ширхэг ширхэгээрээ гарч ирж
 * (pop + stagger), дараа нь л дэлгэцийн заалт асна. Эцсийн байрлал нь
 * атрибутад — царцаасан үед бүрэн төлөв шууд харагдана.
 */
const CSS = phaseCss(
  "q2",
  `.q2-root .q2-blink{animation:q2-blink 1.6s ease-in-out infinite}
@keyframes q2-blink{0%,100%{opacity:1}50%{opacity:.25}}
.q2-root .q2-food-h{animation:q2-fdh 9s linear infinite}
.q2-root .q2-food-s{animation:q2-fds 9s linear infinite}
.q2-root .q2-food-b{animation:q2-fdb 9s linear infinite}
.q2-root .q2-food-h,.q2-root .q2-food-s,.q2-root .q2-food-b{transform-box:fill-box;transform-origin:center}
@keyframes q2-fdh{0%{opacity:0;transform:scale(.4)}1.4%{opacity:1;transform:scale(1.15)}2.2%,30%{opacity:1;transform:scale(1)}34%,100%{opacity:0;transform:scale(.4)}}
@keyframes q2-fds{0%,33%{opacity:0;transform:scale(.4)}34.4%{opacity:1;transform:scale(1.15)}35.2%,63%{opacity:1;transform:scale(1)}67%,100%{opacity:0;transform:scale(.4)}}
@keyframes q2-fdb{0%,66%{opacity:0;transform:scale(.4)}67.4%{opacity:1;transform:scale(1.15)}68.2%,96%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.4)}}
.q2-root .q2-dsp-h{animation:q2-dsph 9s linear infinite}
.q2-root .q2-dsp-s{animation:q2-dsps 9s linear infinite}
.q2-root .q2-dsp-b{animation:q2-dspb 9s linear infinite}
@keyframes q2-dsph{0%,12%{opacity:0}15%,30%{opacity:1}34%,100%{opacity:0}}
@keyframes q2-dsps{0%,43%{opacity:0}46%,63%{opacity:1}67%,100%{opacity:0}}
@keyframes q2-dspb{0%,74%{opacity:0}77%,96%{opacity:1}100%{opacity:0}}`
);

/** Идсэн хоолны ээлж: i дэх элемент 0.25·i секундын дараа гарч ирнэ. */
const foodDelay = (i: number) => ({ animationDelay: `${(i * 0.25 - 9).toFixed(2)}s` });

/** Дээрээс харсан хөл: сунасан ул + 4 хурууны тойрог (эрхий нь дотогшоо). */
function Foot({ x, flip = false }: { x: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} 86)${flip ? " scale(-1 1)" : ""} rotate(-6)`}>
      <path d="M-9 18 C-10 27 -5 31 0 31 C5 31 10 27 9 18 C9.4 8 9.5 -6 8.5 -15 C7.9 -20.3 4.5 -23.4 1 -23 C-3.9 -22.4 -7.5 -19.5 -8.4 -14.5 C-9.4 -5 -9.4 8 -9 18 Z" />
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
      {/* газрын зөөлөн сүүдэр — жин ба тавган доор */}
      <ellipse cx={150} cy={126} rx={56} ry={2.4} fill="currentColor" opacity={0.07} />
      <ellipse cx={44} cy={102.5} rx={25} ry={2.2} fill="currentColor" opacity={0.07} />

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
        <path d="M38 62 q-4 -5.5 0 -11 q4 -5.5 0 -11 M52 62 q-4 -5.5 0 -11 q4 -5.5 0 -11" strokeWidth={2} opacity={0.5} />
      </g>

      {/* Х: таваг дүүрэн идсэн ч заалт доошоо — жин нэмэгддэггүй */}
      <g className="q2-ph q2-ph-h">
        <rect x={132} y={27} width={36} height={12} rx={2.5} fill={ACCENT.H} fillOpacity={0.1} />
        <path
          className="q2-food-h q2-anim"
          d="M24 88 Q44 58 64 88"
          stroke={ACCENT.H}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />
        <g fill={ACCENT.H}>
          <circle className="q2-food-h q2-anim" style={foodDelay(1)} cx={36} cy={80} r={2.4} />
          <circle className="q2-food-h q2-anim" style={foodDelay(2)} cx={44} cy={73} r={2.4} />
          <circle className="q2-food-h q2-anim" style={foodDelay(3)} cx={52} cy={80} r={2.4} />
        </g>
        <g className="q2-dsp-h q2-anim">
          <path
            className="q2-blink q2-anim"
            d="M150 27 v12 m0 0 l-4.5 -5 m4.5 5 l4.5 -5"
            stroke={ACCENT.H}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: дунд зэрэг идээд заалт тэнцүү — тогтвортой */}
      <g className="q2-ph q2-ph-s">
        <rect x={132} y={27} width={36} height={12} rx={2.5} fill={ACCENT.S} fillOpacity={0.1} />
        <path
          className="q2-food-s q2-anim"
          d="M28 88 Q44 68 60 88"
          stroke={ACCENT.S}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />
        <g fill={ACCENT.S}>
          <circle className="q2-food-s q2-anim" style={foodDelay(1)} cx={38} cy={81} r={2.4} />
          <circle className="q2-food-s q2-anim" style={foodDelay(2)} cx={50} cy={81} r={2.4} />
        </g>
        <path
          className="q2-dsp-s q2-anim"
          d="M144 30 h12 M144 36 h12"
          stroke={ACCENT.S}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: бага идсэн ч заалт дээшээ — жин буурдаггүй */}
      <g className="q2-ph q2-ph-b">
        <rect x={132} y={27} width={36} height={12} rx={2.5} fill={ACCENT.B} fillOpacity={0.1} />
        <path
          className="q2-food-b q2-anim"
          d="M33 88 Q44 76 55 88"
          stroke={ACCENT.B}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />
        <circle className="q2-food-b q2-anim" style={foodDelay(1)} cx={44} cy={83} r={2.4} fill={ACCENT.B} />
        <g className="q2-dsp-b q2-anim">
          <path
            className="q2-blink q2-anim"
            d="M150 39 V27 m0 0 l-4.5 5 m4.5 -5 l4.5 5"
            stroke={ACCENT.B}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
