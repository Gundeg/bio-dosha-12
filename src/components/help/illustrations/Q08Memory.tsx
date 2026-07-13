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

const HELP = QUESTION_HELP[8];

// Орон нутгийн палитр: номын хавтас, цайвар хуудас, тархи, заалтын суурь.
const COVER = "#c76b52";
const COVER_SHADE = "#a8503b";
const PAGE = "#f4efe2";
const PAGE_LINE = "#a89a86";
const BRAIN = "#f2a7b3";
const BRAIN_FOLD = "#d98594";
const TRACK = "#efe7d5";

const CSS = phaseCss(
  "q8",
  `.q8-root .q8-fill{transform-box:fill-box;transform-origin:left center}
.q8-root .q8-fh{animation:q8-fillh 9s linear infinite}
.q8-root .q8-fb{animation:q8-fillb 9s linear infinite}
@keyframes q8-fillh{0%{transform:scaleX(.12)}8%{transform:scaleX(1)}16%{transform:scaleX(1)}28%,100%{transform:scaleX(.12)}}
@keyframes q8-fillb{0%,66%{transform:scaleX(.15)}92%,100%{transform:scaleX(1)}}
.q8-root[data-variant="H"] .q8-fh{animation:none;transform:scaleX(.3)}
.q8-root[data-variant="B"] .q8-fb{animation:none;transform:scaleX(1)}
.q8-root .q8-dash{animation:q8-dsh 1.4s linear infinite}
@keyframes q8-dsh{to{stroke-dashoffset:-16}}
.q8-root .q8-esc{animation:q8-up 2.1s linear infinite}
@keyframes q8-up{0%{transform:translateY(0);opacity:.85}100%{transform:translateY(-8px);opacity:0}}
@media (prefers-reduced-motion: reduce){.q8-root .q8-fh{transform:scaleX(.3)}.q8-root .q8-fb{transform:scaleX(1)}}`
);

/** Санах ойн сорил: ном → толгой руу мэдлэг орж, ой санамжийн заалт хэр удаан хадгалагдахыг харуулна. */
export function Q08Memory({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q8"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      <SkinDefs p="q8" />

      {/* Суурь: нээлттэй ном (зүүн доор) → хажуу толгой (баруун), доор нь санах ойн заалт */}
      {/* номын сүүдэр */}
      <ellipse cx={58} cy={124} rx={40} ry={3} fill={INK} opacity={0.06} />

      {/* номын хавтасны зузаан */}
      <path
        d="M18 118 C36 113 51 115 58 122 C65 115 80 113 96 118 L96 114 C80 109 66 111 58 117 C50 111 36 109 20 114 Z"
        fill={COVER}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path d="M58 122 C51 115 36 113 18 118 L20 114 C36 109 50 111 58 117 Z" fill={COVER_SHADE} opacity={0.5} />

      {/* нээлттэй ном: хоёр хуудас цайвар өнгөөр */}
      <path
        d="M58 86 C50 80 36 78 20 83 L20 114 C36 109 50 111 58 117 Z"
        fill={PAGE}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path
        d="M58 86 C66 80 80 78 96 83 L96 114 C80 109 66 111 58 117 Z"
        fill={PAGE}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* голын нугалаас */}
      <path d="M58 86 L58 117" stroke={INK} strokeWidth={2} strokeLinecap="round" opacity={0.55} />
      {/* хуудасны текст мөрүүд */}
      <g stroke={PAGE_LINE} strokeWidth={2} strokeLinecap="round" fill="none">
        <path d="M27 91 C36 88.5 44 88 51 89.5" />
        <path d="M27 98 C36 95.5 44 95 51 96.5" />
        <path d="M27 105 C33 103.3 38 103 44 104" />
        <path d="M89 91 C80 88.5 72 88 65 89.5" />
        <path d="M89 98 C80 95.5 72 95 65 96.5" />
        <path d="M89 105 C83 103.3 78 103 72 104" />
      </g>

      {/* хажуу толгой: арьсаар дүүргэсэн профиль */}
      <path
        d="M202 92 C203 85 204 79 203 73 C212 63 215 47 207 36 C199 25 183 21 171 26 C162 29.5 156 37 154.5 45 C154 48.5 154.5 51.5 156 54 L149 62.5 Q147.8 64.6 150.6 65 L157 65.8 C154 67.3 153.8 69.6 156.4 70.6 C153.6 72.2 153.6 74.8 157 75.8 C154.6 77.6 155 80.6 159 82 C165 84.2 173 85.6 180 85.4 C181.4 87.6 181.8 90 181.4 93 Z"
        fill="url(#q8-skin)"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* эрүүний доод сүүдэр */}
      <path d="M181 93 C182 88 181 86 180 85.4 C173 85.6 165 84.2 159 82 C168 89 178 91 190 91 Z" fill={SKIN.shade} opacity={0.4} />
      {/* духны гэрэл */}
      <ellipse cx={196} cy={50} rx={6} ry={11} fill={SKIN.light} opacity={0.35} />

      {/* гавлын доторх тархи — зөөлөн ягаан */}
      <path
        d="M172 50 C166 46 168 38 175 37 C177 31 186 29.5 190 34 C196 30.5 203 36 200 42 C204 46 200 52 195 51.5 C191 55 184 55 181.5 51.5 C178 54 172.5 53.5 172 50 Z"
        fill={BRAIN}
        stroke={BRAIN_FOLD}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <g stroke={BRAIN_FOLD} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.8}>
        <path d="M187 33 C185 38 187 44 184 49" />
        <path d="M178 40 q3 3 0 7" />
        <path d="M193 38 q3 3 0 7" />
      </g>
      {/* тархины гэрэл */}
      <ellipse cx={183} cy={40} rx={5} ry={4} fill={SKIN.light} opacity={0.35} />

      {/* чих — арьс */}
      <path
        d="M181 53 C188 49 193 54 190 61 C188 65.5 184 68 181 67 C182 62 182 57 181 53 Z"
        fill="url(#q8-skin2)"
        stroke={INK}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <path d="M184 56 C188 55 189 59 187 62" stroke={INK} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.5} />

      {/* нүд + хөмсөг */}
      <circle cx={164} cy={49} r={2.1} fill={INK} />
      <path d="M159 44 q4 -2 8 0.5" stroke={INK} strokeWidth={2} strokeLinecap="round" fill="none" />

      {/* санах ойн заалтын суурь хүрээ */}
      <rect x={150} y={104} width={62} height={13} rx={6.5} fill={TRACK} stroke={INK} strokeWidth={2} />

      {/* урсгалын сумны үзүүр */}
      <path
        d="M143.8 49.4 L147 43 L139.8 42.4"
        stroke={INK}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.45}
      />
      {/* номоос толгой руу — мэдлэгийн урсгал */}
      <path
        className="q8-dash q8-anim"
        d="M97 84 Q124 56 147 43"
        stroke={INK}
        strokeWidth={2}
        strokeDasharray="4 4"
        strokeLinecap="round"
        opacity={0.4}
      />

      {/* Х: хурдан дүүрч, хурдан хоосорно — толгойноос гоожих цэгүүд */}
      <g className="q8-ph q8-ph-h">
        <rect
          className="q8-fill q8-fh q8-anim"
          x={153}
          y={107}
          width={56}
          height={7}
          rx={3.5}
          fill={ACCENT.H}
          opacity={0.85}
        />
        <g fill={ACCENT.H}>
          <circle className="q8-esc q8-anim" cx={217} cy={38} r={2.4} opacity={0.9} />
          <circle
            className="q8-esc q8-anim"
            style={{ animationDelay: "-.7s" }}
            cx={223}
            cy={29}
            r={2}
            opacity={0.55}
          />
          <circle
            className="q8-esc q8-anim"
            style={{ animationDelay: "-1.4s" }}
            cx={228}
            cy={20}
            r={1.6}
            opacity={0.3}
          />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: хурдан дүүрч, дүүрэн хэвээр */}
      <g className="q8-ph q8-ph-s">
        <rect x={153} y={107} width={50} height={7} rx={3.5} fill={ACCENT.S} opacity={0.85} />
        <path
          d="M218 108 l4 4 8 -8"
          stroke={ACCENT.S}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: удаан дүүрдэг ч хэзээ ч буурдаггүй */}
      <g className="q8-ph q8-ph-b">
        <rect
          className="q8-fill q8-fb q8-anim"
          x={153}
          y={107}
          width={56}
          height={7}
          rx={3.5}
          fill={ACCENT.B}
          opacity={0.85}
        />
        <text x={217} y={115} fontSize={14} fontWeight={700} fill={ACCENT.B} fontFamily="inherit">
          ∞
        </text>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
