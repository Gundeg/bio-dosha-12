import { QUESTION_HELP } from "@/lib/questionHelp";
import {
  ACCENT,
  HelpIllustrationProps,
  INK,
  IllustrationRoot,
  PhaseBadge,
  SKIN,
  SkinDefs,
  phaseCss,
} from "./shared";

const HELP = QUESTION_HELP[3];

/**
 * Хореограф: фаз бүрийн эхэнд инсет доторх нугалаа доороосоо өргөгдөж
 * (scaleY .55→1), тогтсоны дараа л арьсны онцлогийн тэмдгүүд (хагарал /
 * улайлт / гялбаа) тодорно. Эцсийн байрлал нь атрибутад.
 */
const CSS = phaseCss(
  "q3",
  `.q3-root .q3-pinch{animation:q3-squeeze 2s ease-in-out infinite}
@keyframes q3-squeeze{0%,100%{transform:translateY(0)}50%{transform:translateY(2px)}}
.q3-root .q3-fold-h{animation:q3-fh 9s linear infinite}
.q3-root .q3-fold-s{animation:q3-fs 9s linear infinite}
.q3-root .q3-fold-b{animation:q3-fb 9s linear infinite}
.q3-root .q3-fold-h,.q3-root .q3-fold-s,.q3-root .q3-fold-b{transform-box:fill-box;transform-origin:50% 100%}
@keyframes q3-fh{0%{transform:scaleY(.55)}4%,30%{transform:scaleY(1)}34%,100%{transform:scaleY(.55)}}
@keyframes q3-fs{0%,33%{transform:scaleY(.55)}37%,63%{transform:scaleY(1)}67%,100%{transform:scaleY(.55)}}
@keyframes q3-fb{0%,66%{transform:scaleY(.55)}70%,96%{transform:scaleY(1)}100%{transform:scaleY(.55)}}
.q3-root .q3-cue-h{animation:q3-cueh 9s linear infinite}
.q3-root .q3-cue-s{animation:q3-cues 9s linear infinite}
.q3-root .q3-cue-b{animation:q3-cueb 9s linear infinite}
@keyframes q3-cueh{0%,6%{opacity:0}9%,30%{opacity:1}34%,100%{opacity:0}}
@keyframes q3-cues{0%,39%{opacity:0}42%,63%{opacity:1}67%,100%{opacity:0}}
@keyframes q3-cueb{0%,72%{opacity:0}75%,96%{opacity:1}100%{opacity:0}}`
);

/** Инсет доторх томруулсан арьсны нугалаа — өргөгдсөн атираа (crescent ribbon). */
const FOLD_RIDGE =
  "M146.5 88 Q162 86 170 70 Q182 44 194 70 Q202 86 217.5 88 Q198 90 182 72 Q166 90 146.5 88 Z";
/** Атирааны оройн гэрлийн зураас. */
const FOLD_CREST = "M170 68 Q182 46 194 68";

/** Арьсны сорил: шууны арьсыг чимхээд томруулж харна — хуурай / улайсан / чийглэг. */
export function Q03SkinPinch({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q3"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      <SkinDefs p="q3" />

      {/* газрын зөөлөн сүүдэр */}
      <ellipse cx={56} cy={126} rx={58} ry={4} fill={INK} opacity={0.06} />

      {/* ── Хэвтээ шуу (арьсаар дүүргэсэн, зүүн тийш зурагнаас гарна) ── */}
      <path
        d="M-4 97 H42 Q59 78 76 97 H112 V122 H-4 Z"
        fill="url(#q3-skin)"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* шууны доод сүүдэр + чимхсэн нугалааны гэрэл */}
      <path d="M-4 118 H108" stroke={SKIN.shade} strokeWidth={4} opacity={0.4} strokeLinecap="round" />
      <path d="M45 94 Q59 80 73 94" stroke={SKIN.light} strokeWidth={2.5} fill="none" opacity={0.6} strokeLinecap="round" />

      {/* шууны үзүүрийн сул атгасан сарвуу */}
      <path
        d="M106 97 C118 92 132 95 137 104 C141 111 138 118 131 121 C121 125 111 124 104 122 Z"
        fill="url(#q3-skin2)"
        stroke={INK}
        strokeWidth={2.3}
        strokeLinejoin="round"
      />
      <path
        d="M113 102 q8 3 7 11 M123 101 q8 3 7 11"
        stroke={INK}
        strokeWidth={1.6}
        opacity={0.4}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx={121} cy={104} rx={7} ry={4} fill={SKIN.light} opacity={0.45} />

      {/* ── Чимхэж буй гар: сарвуу + долоовор, эрхий хоёр прон ── */}
      <g className="q3-pinch q3-anim">
        {/* сарвууны ар */}
        <path
          d="M58 34 C62 24 73 19 84 19 C95 19 104 26 103 36 C102 45 95 53 85 55 C77 57 67 55 60 50 C55 45 55 39 58 34 Z"
          fill="url(#q3-skin2)"
          stroke={INK}
          strokeWidth={2.3}
          strokeLinejoin="round"
        />
        <ellipse cx={84} cy={31} rx={9} ry={5.5} fill={SKIN.light} opacity={0.45} transform="rotate(-8 84 31)" />
        {/* үений доод сүүдэр — хуруунуудыг суулгах */}
        <path d="M60 49 C68 54 78 56 87 54" stroke={SKIN.shade} strokeWidth={3} opacity={0.4} fill="none" strokeLinecap="round" />
        {/* эрхий хуруу (баруун прон) */}
        <path
          d="M72 51 C70.5 61 68.5 71 68 78 C67.4 82.5 70 85.5 72.5 85.5 C75 85.5 77.6 82.5 77 78 C78 71 81 61 84 53 Z"
          fill="url(#q3-skin2)"
          stroke={INK}
          strokeWidth={2.3}
          strokeLinejoin="round"
        />
        {/* долоовор хуруу (зүүн прон) */}
        <path
          d="M61 47 C56.5 57 52 69 51 78 C50.4 83 53 86 55.5 86 C58 86 60.6 83 60 78 C61 69 64 57 67 49 Z"
          fill="url(#q3-skin2)"
          stroke={INK}
          strokeWidth={2.3}
          strokeLinejoin="round"
        />
        {/* хумсны гялбаа + үений зураас */}
        <ellipse cx={55} cy={80} rx={2.4} ry={3.2} fill={SKIN.light} opacity={0.6} />
        <ellipse cx={72.5} cy={80} rx={2.4} ry={3.2} fill={SKIN.light} opacity={0.6} />
        <path d="M50 77 C51 80 55.5 80 56.5 77 M67 77 C68 80 72.5 80 73.5 77" stroke={INK} strokeWidth={1.4} opacity={0.4} fill="none" />
      </g>

      {/* томруулагч: нугалаанаас инсет рүү */}
      <g stroke={INK} strokeWidth={1.6} fill="none" opacity={0.32}>
        <circle cx={63} cy={84} r={13} strokeDasharray="3 4" />
        <path d="M76 78 C100 70 124 58 144 48" strokeDasharray="3 4" />
      </g>

      {/* ── Инсет: томруулсан арьсны хэсэг ── */}
      <circle cx={182} cy={66} r={42} fill="url(#q3-skin)" stroke={INK} strokeWidth={2.5} />
      <ellipse cx={165} cy={50} rx={13} ry={7} fill={SKIN.light} opacity={0.4} transform="rotate(-28 165 50)" />

      {/* Х: хуурай — хагарсан зигзаг зураас, гуужсан ширхэг */}
      <g className="q3-ph q3-ph-h">
        <g className="q3-fold-h q3-anim">
          <path d={FOLD_RIDGE} fill="url(#q3-skin2)" stroke={SKIN.deep} strokeWidth={1.5} strokeLinejoin="round" />
          <path d={FOLD_CREST} stroke={SKIN.light} strokeWidth={2.5} fill="none" opacity={0.7} strokeLinecap="round" />
        </g>
        <g className="q3-cue-h q3-anim">
          <path
            d="M170 68 L174 59 L178 64 L182 53 L186 64 L190 59 L194 68"
            stroke={ACCENT.H}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path d="M166 44 l4 -4 M194 40 l4 4" stroke={ACCENT.H} strokeWidth={2} strokeLinecap="round" fill="none" />
          <g fill={ACCENT.H}>
            <circle cx={161} cy={50} r={1.8} />
            <circle cx={203} cy={50} r={1.8} />
          </g>
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: дулаан — улайлтын толбо + халууны туяа */}
      <g className="q3-ph q3-ph-s">
        <ellipse
          className="q3-cue-s q3-anim"
          cx={182}
          cy={78}
          rx={24}
          ry={10}
          fill={ACCENT.S}
          fillOpacity={0.2}
        />
        <g className="q3-fold-s q3-anim">
          <path d={FOLD_RIDGE} fill="url(#q3-skin2)" stroke={SKIN.deep} strokeWidth={1.5} strokeLinejoin="round" />
          <path d={FOLD_CREST} stroke={SKIN.light} strokeWidth={2.5} fill="none" opacity={0.7} strokeLinecap="round" />
        </g>
        <path
          className="q3-cue-s q3-anim"
          d="M166 46 l-5 -9 M182 42 v-10 M198 46 l5 -9"
          stroke={ACCENT.S}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: чийглэг — усны дусал + гөлгөр гялбааны нум */}
      <g className="q3-ph q3-ph-b">
        <g className="q3-fold-b q3-anim">
          <path d={FOLD_RIDGE} fill="url(#q3-skin2)" stroke={SKIN.deep} strokeWidth={1.5} strokeLinejoin="round" />
          <path d={FOLD_CREST} stroke={SKIN.light} strokeWidth={2.5} fill="none" opacity={0.7} strokeLinecap="round" />
        </g>
        <g className="q3-cue-b q3-anim">
          <path d="M173 63 Q177 55 183 55" stroke={ACCENT.B} strokeWidth={2} opacity={0.7} fill="none" strokeLinecap="round" />
          <path d="M199 49 q6.5 9.5 0 15 q-6.5 -5.5 0 -15 z" stroke={ACCENT.B} strokeWidth={2} fill={ACCENT.B} fillOpacity={0.28} strokeLinejoin="round" />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
