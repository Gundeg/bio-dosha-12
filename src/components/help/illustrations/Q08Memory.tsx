import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[8];

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
      {/* Суурь: нээлттэй ном (зүүн доор) → хажуу толгой (баруун), доор нь санах ойн заалт */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {/* нээлттэй ном: хоёр хуудас, голын нугалаас */}
        <path d="M58 86 C50 80 36 78 20 83 L20 114 C36 109 50 111 58 117 Z" />
        <path d="M58 86 C66 80 80 78 96 83 L96 114 C80 109 66 111 58 117 Z" />
        {/* хажуу толгой: дух, хамар, уруул, эрүү, хүзүү */}
        <path d="M202 92 C203 85 204 79 203 73 C212 63 215 47 207 36 C199 25 183 21 171 26 C162 29.5 156 37 154.5 45 C154 48.5 154.5 51.5 156 54 L149 62.5 Q147.8 64.6 150.6 65 L157 65.8 C154 67.3 153.8 69.6 156.4 70.6 C153.6 72.2 153.6 74.8 157 75.8 C154.6 77.6 155 80.6 159 82 C165 84.2 173 85.6 180 85.4 C181.4 87.6 181.8 90 181.4 93" />
        {/* чих */}
        <path d="M181 53 C188 49 193 54 190 61 C188 65.5 184 68 181 67" />
        {/* санах ойн заалтын хүрээ */}
        <rect x={150} y={104} width={62} height={13} rx={6.5} />
      </g>
      <g stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.5}>
        {/* хуудасны зузаан */}
        <path d="M20 114 L18 118 C36 113 51 115 58 122 C65 115 80 113 96 118 L96 114" />
        {/* хуудасны текст мөрүүд */}
        <path d="M27 91 C36 88.5 44 88 51 89.5" />
        <path d="M27 98 C36 95.5 44 95 51 96.5" />
        <path d="M27 105 C33 103.3 38 103 44 104" />
        <path d="M89 91 C80 88.5 72 88 65 89.5" />
        <path d="M89 98 C80 95.5 72 95 65 96.5" />
        <path d="M89 105 C83 103.3 78 103 72 104" />
        {/* гавлын доторх тархи */}
        <path d="M172 50 C166 46 168 38 175 37 C177 31 186 29.5 190 34 C196 30.5 203 36 200 42 C204 46 200 52 195 51.5 C191 55 184 55 181.5 51.5 C178 54 172.5 53.5 172 50" />
        <path d="M187 33 C185 38 187 44 184 49" />
      </g>
      {/* урсгалын сумны үзүүр */}
      <path
        d="M143.8 49.4 L147 43 L139.8 42.4"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
      />
      {/* номоос толгой руу — мэдлэгийн урсгал */}
      <path
        className="q8-dash q8-anim"
        d="M97 84 Q124 56 147 43"
        stroke="currentColor"
        strokeWidth={2}
        strokeDasharray="4 4"
        strokeLinecap="round"
        opacity={0.55}
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
          opacity={0.6}
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
        <rect x={153} y={107} width={50} height={7} rx={3.5} fill={ACCENT.S} opacity={0.6} />
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
          opacity={0.6}
        />
        <text x={217} y={115} fontSize={14} fontWeight={700} fill={ACCENT.B} fontFamily="inherit">
          ∞
        </text>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
