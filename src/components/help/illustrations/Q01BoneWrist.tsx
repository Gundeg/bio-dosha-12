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
import { DominantType } from "@/lib/questionnaireEngine";

const HELP = QUESTION_HELP[1];

const CSS = phaseCss(
  "q1",
  `.q1-root .q1-thumb-h,.q1-root .q1-thumb-s,.q1-root .q1-thumb-b{transform-box:view-box;transform-origin:118px 96px}
.q1-root .q1-thumb-h{animation:q1-th 9s ease-in-out infinite}
.q1-root .q1-thumb-s{animation:q1-ts 9s ease-in-out infinite}
.q1-root .q1-thumb-b{animation:q1-tb 9s ease-in-out infinite}
@keyframes q1-th{0%{transform:rotate(-9deg)}7%,30%{transform:rotate(0)}36%,100%{transform:rotate(-9deg)}}
@keyframes q1-ts{0%,33%{transform:rotate(-8deg)}40%,63%{transform:rotate(0)}69%,100%{transform:rotate(-8deg)}}
@keyframes q1-tb{0%,66%{transform:rotate(-7deg)}73%,96%{transform:rotate(0)}100%{transform:rotate(-7deg)}}`
);

/** Нэг үр дүнгийн эрхий+долоовор хурууны байрлал (давхарлах/хүрэх/зайтай). */
function Grip({ d, thumbTip, indexTip, thumbOver }: { d: DominantType; thumbTip: number; indexTip: number; thumbOver: boolean }) {
  // долоовор хуруу баруунаас зүүн тийш нумарч, үзүүр нь indexTip дээр
  const index = (
    <g>
      <path
        d={`M156 108 C160 98 158 90 149 88 C140 86 ${indexTip + 4} 85 ${indexTip} 88 C${indexTip - 4} 91 ${indexTip - 3} 96 ${indexTip + 2} 98 C${indexTip + 8} 100 148 100 152 104 Z`}
        fill="url(#q1-skin2)"
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <ellipse cx={indexTip + 1} cy={90} rx={2.6} ry={3.4} fill={SKIN.light} opacity={0.7} />
    </g>
  );
  // эрхий хуруу зүүнээс баруун тийш нумарч, үзүүр нь thumbTip дээр (бага зэрэг эргэлдэнэ)
  const thumb = (
    <g className={`q1-thumb-${d.toLowerCase()} q1-anim`}>
      <path
        d={`M90 112 C86 100 90 92 100 91 C110 90 ${thumbTip - 4} 91 ${thumbTip} 94 C${thumbTip + 4} 97 ${thumbTip + 3} 102 ${thumbTip - 2} 104 C${thumbTip - 8} 106 98 106 94 110 Z`}
        fill="url(#q1-skin2)"
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <ellipse cx={thumbTip - 1} cy={96} rx={2.6} ry={3.4} fill={SKIN.light} opacity={0.7} />
    </g>
  );
  return (
    <g>
      {thumbOver ? (
        <>
          {index}
          {thumb}
        </>
      ) : (
        <>
          {thumb}
          {index}
        </>
      )}
    </g>
  );
}

/** Бугуйн сорил: бугуйгаа атгаж, эрхий/долоовор хурууны нийлэлтийг харна. */
export function Q01BoneWrist({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q1"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      <SkinDefs p="q1" />

      {/* ── Суурь дүр зураг: доошоо шуу + дээшээ сарвуу ── */}
      {/* газрын сүүдэр */}
      <ellipse cx={120} cy={150} rx={40} ry={5} fill={INK} opacity={0.06} />

      {/* шуу (босоо багана) */}
      <path
        d="M103 158 L103 96 C103 82 111 74 120 74 C129 74 137 82 137 96 L137 158 Z"
        fill="url(#q1-skin)"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* дээд сарвуу — тайван, зөөлөн атиалсан хуруунууд */}
      <g fill="url(#q1-skin)" stroke={INK} strokeWidth={2.3} strokeLinejoin="round" strokeLinecap="round">
        {/* алга */}
        <path d="M104 76 C101 66 102 56 106 50 C114 44 126 44 134 50 C138 56 139 66 136 76 Z" />
        {/* 4 хуруу зөөлөн урагш атиалсан */}
        <path d="M106 52 C104 42 105 33 110 30 C114 28 117 31 116 36 C115 42 114 47 113 51" />
        <path d="M114 50 C113 39 114 29 119 27 C123 26 125 29 124 34 C123 41 122 46 121 50" />
        <path d="M122 50 C122 40 123 31 128 29 C132 28 134 32 132 37 C131 43 130 47 129 51" />
        <path d="M130 52 C131 44 133 37 137 36 C141 35 142 40 140 45 C138 50 136 53 134 56" />
        {/* эрхий — баруун доод талд */}
        <path d="M136 68 C142 64 147 67 146 73 C145 78 140 80 135 78" />
      </g>

      {/* атгаж буй гарын далдуур (бугуйн урд талд) */}
      <path
        d="M92 120 C86 107 92 92 108 91 L150 91 C164 92 167 106 161 118 C157 128 102 130 92 120 Z"
        fill={SKIN.shade}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* атгасан хурууны үений товгор дээд ирмэг дээр */}
      <g stroke={INK} strokeWidth={1.5} opacity={0.4} fill="none">
        <path d="M110 93 q4 5 8 0 M122 93 q4 5 8 0 M134 93 q4 5 8 0" />
      </g>

      {/* ── Фазууд: эрхий+долоовор хурууны уулзалт ── */}
      <g className="q1-ph q1-ph-h">
        <Grip d="H" thumbTip={128} indexTip={114} thumbOver />
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>
      <g className="q1-ph q1-ph-s">
        <Grip d="S" thumbTip={119} indexTip={121} thumbOver={false} />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>
      <g className="q1-ph q1-ph-b">
        <Grip d="B" thumbTip={110} indexTip={130} thumbOver={false} />
        {/* зайг тэмдэглэх сум */}
        <path d="M114 90 L126 90 M116 87 l-3 3 3 3 M124 87 l3 3 -3 3" stroke={ACCENT.B} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
