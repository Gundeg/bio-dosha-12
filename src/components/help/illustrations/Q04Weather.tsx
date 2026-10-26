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

const HELP = QUESTION_HELP[4];

/** Дээлийн дотоод палитра (материал тул theme-ээр эргэлддэггүй). */
const COAT = "#6f97a8";
const COAT_SH = "#557a8a";
const BELT = "#3f5b66";
const BOOT = "#5f4b39";
const BOOT_SH = "#463628";
const HAIR = "#43362b";

const CSS = phaseCss(
  "q4",
  `.q4-root .q4-spin{transform-box:fill-box;transform-origin:center;animation:q4-rot 10s linear infinite}
@keyframes q4-rot{to{transform:rotate(360deg)}}
.q4-root .q4-shiver{animation:q4-shv .7s ease-in-out infinite}
@keyframes q4-shv{0%,100%{opacity:1}50%{opacity:.3}}
.q4-root .q4-rays{animation:q4-glow 2s ease-in-out infinite}
@keyframes q4-glow{0%,100%{opacity:1}50%{opacity:.45}}
.q4-root .q4-raywrap{transform-box:fill-box;transform-origin:center;animation:q4-rayrot 14s linear infinite}
@keyframes q4-rayrot{to{transform:rotate(360deg)}}
.q4-root .q4-rain{animation:q4-drop 1.2s linear infinite}
@keyframes q4-drop{0%{transform:translateY(0);opacity:1}80%{opacity:.9}100%{transform:translateY(12px);opacity:0}}
.q4-root .q4-scarf{animation:q4-scv 1.8s ease-in-out infinite}
@keyframes q4-scv{0%,42%,100%{transform:translateX(0)}10%,32%{transform:translateX(.7px)}21%{transform:translateX(-.7px)}}`
);

/** Цаг агаарын сорил: хүйтэн / халуун / чийгний аль нь их зовоодог вэ. */
export function Q04Weather({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q4"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      <SkinDefs p="q4" />

      {/* Суурь: дээлтэй хүн — толгой, хүзүү, ханцуйтай их бие, гуталтай хөл */}
      {/* газрын сүүдэр */}
      <ellipse cx={122} cy={124} rx={28} ry={3.5} fill={INK} opacity={0.06} />

      {/* хөл + гутал (дээлийн хормойн ард) */}
      <g stroke={INK} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round">
        <path d="M109 103 H116 V116 H109 Z" fill={BOOT_SH} />
        <path d="M128 103 H135 V116 H128 Z" fill={BOOT_SH} />
        <path d="M108 114 C104 114 100 116 100 119 C100 121 102 122 105 122 L116 122 C118 122 118 116 116 114 Z" fill={BOOT} />
        <path d="M136 114 C140 114 144 116 144 119 C144 121 142 122 139 122 L128 122 C126 122 126 116 128 114 Z" fill={BOOT} />
      </g>

      {/* хүзүү (арьс, толгой ба захны ард) */}
      <path d="M117 43 H127 V52 H117 Z" fill="url(#q4-skin)" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />

      {/* дээлийн силуэт: мөр → ханцуй → бугуйвч → суга → хормой */}
      <path
        d="M112 50 C106 50.5 100 51.8 94.5 60 L74 90 Q71 94 75 96 L84 98 Q88 99 89 95 L104 72 L99 106 L145 106 L140 72 L155 95 Q156 99 160 98 L169 96 Q173 94 170 90 L149.5 60 C144 51.8 138 50.5 132 50 Z"
        fill={COAT}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* хормойн доод сүүдэр (эзлэхүүн) */}
      <path d="M101 90 L99 106 L145 106 L143 90 Z" fill={COAT_SH} />
      {/* цээжний баруун талын гэрэлт товойлт */}
      <ellipse cx={132} cy={69} rx={6} ry={12} fill="#88aebd" opacity={0.45} />
      {/* ханцуйны бугуйвч */}
      <path d="M74 90 Q71 94 75 96 L84 98 Q88 99 89 95 L86 91 Z" fill={COAT_SH} />
      <path d="M170 90 Q173 94 169 96 L160 98 Q156 99 155 95 L158 91 Z" fill={COAT_SH} />
      {/* энгэрийн зах (V) */}
      <path d="M116 51 L122 63 L128 51" stroke={COAT_SH} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M122 63 V82" stroke={COAT_SH} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      {/* бүс */}
      <path
        d="M102 82 L142 82 C143 82 144 83 144 84 L144 87 C144 88 143 89 142 89 L102 89 C101 89 100 88 100 87 L100 84 C100 83 101 82 102 82 Z"
        fill={BELT}
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* толгой (арьс) + үс */}
      <circle cx={122} cy={34} r={11} fill="url(#q4-skin)" stroke={INK} strokeWidth={2.5} />
      <path
        d="M111 32 C110 22 116 17 122 17 C128 17 134 22 133 32 C130 27 126 25 122 25 C118 25 114 27 111 32 Z"
        fill={HAIR}
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d="M114 40 C117 44 127 44 130 40" stroke={SKIN.shade} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.6} />
      <ellipse cx={118} cy={30} rx={2.6} ry={3.4} fill={SKIN.light} opacity={0.7} />

      {/* Х: 6 салаат цасан ширхэг + ороолт + чичрэх */}
      <g className="q4-ph q4-ph-h">
        <g className="q4-spin q4-anim" stroke={ACCENT.H} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {[0, 60, 120].map((a) => (
            <g key={a} transform={`rotate(${a} 54 42)`}>
              <path d="M54 22 V62" />
              <path d="M49 24 L54 29 L59 24 M49 60 L54 55 L59 60" />
            </g>
          ))}
        </g>
        <g className="q4-scarf q4-anim" stroke={ACCENT.H} strokeWidth={2.5} strokeLinecap="round" fill="none">
          <path d="M108 52 Q122 61 136 52" />
          <path d="M129 57 Q133 64 129 71" />
        </g>
        <g className="q4-shiver q4-anim" stroke={ACCENT.H} strokeWidth={2} strokeLinecap="round" fill="none">
          <path d="M76 58 q-8 10 0 20" />
          <path d="M67 64 q-6 7 0 14" />
          <path d="M168 58 q8 10 0 20" />
          <path d="M177 64 q6 7 0 14" />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: нар (8 цацрагтай) + толгойноос үсрэх хөлс */}
      <g className="q4-ph q4-ph-s">
        <circle cx={186} cy={38} r={13} stroke={ACCENT.S} strokeWidth={2.5} fill={ACCENT.S} fillOpacity={0.1} />
        <g className="q4-raywrap q4-anim">
          <g className="q4-rays q4-anim" stroke={ACCENT.S} strokeWidth={2.5} strokeLinecap="round">
            <path d="M186 21 v-8 M186 55 v8 M169 38 h-8 M203 38 h8 M174 26 l-6 -6 M198 26 l6 -6 M174 50 l-6 6 M198 50 l6 6" />
          </g>
        </g>
        <g
          className="q4-rain q4-anim"
          stroke={ACCENT.S}
          strokeWidth={1.8}
          strokeLinejoin="round"
          fill={ACCENT.S}
          fillOpacity={0.12}
        >
          <path d="M141 26 c2.4 3.5 3.8 5.6 3.4 7.7 a3.5 3.5 0 1 1 -6.8 0 c-.5 -2.1 .9 -4.2 3.4 -7.7 z" />
          <path d="M151 39 c2.4 3.5 3.8 5.6 3.4 7.7 a3.5 3.5 0 1 1 -6.8 0 c-.5 -2.1 .9 -4.2 3.4 -7.7 z" />
          <path d="M100 33 c2.4 3.5 3.8 5.6 3.4 7.7 a3.5 3.5 0 1 1 -6.8 0 c-.5 -2.1 .9 -4.2 3.4 -7.7 z" />
        </g>
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: борооны үүл + бороо + хөл доорх шалбааг */}
      <g className="q4-ph q4-ph-b">
        <path
          d="M30 56 C26 44 38 36 48 40 C52 28 70 26 76 36 C88 32 96 44 88 56 Z"
          stroke={ACCENT.B}
          strokeWidth={2.5}
          strokeLinejoin="round"
          fill={ACCENT.B}
          fillOpacity={0.1}
        />
        <g className="q4-rain q4-anim" stroke={ACCENT.B} strokeWidth={2} strokeLinecap="round">
          <path d="M40 64 l-3 9 M54 64 l-3 9 M68 64 l-3 9 M82 64 l-3 9" />
        </g>
        <ellipse cx={122} cy={124} rx={26} ry={3.5} stroke={ACCENT.B} strokeWidth={2} fill={ACCENT.B} fillOpacity={0.12} />
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
