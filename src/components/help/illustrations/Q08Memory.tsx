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
@media (prefers-reduced-motion: reduce){.q8-root .q8-fh{transform:scaleX(.3)}.q8-root .q8-fb{transform:scaleX(1)}}`
);

/** Санах ойн сорил: сурсан зүйл ой санамжид хэр хурдан орж, хэр удаан үлдэх вэ. */
export function Q08Memory({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q8"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* Суурь: нээлттэй ном → толгой, санах ойн зурвас */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M28 112 q20 -12 40 0 q20 -12 40 0 v8 q-20 -10 -40 0 q-20 -10 -40 0 z" />
        <path d="M68 112 v8" strokeWidth={2} />
        <circle cx={178} cy={58} r={20} />
        <path d="M166 58 q6 -9 12 0 q6 9 12 0" strokeWidth={2} opacity={0.6} />
        <rect x={150} y={92} width={56} height={11} rx={5.5} />
      </g>
      <path
        className="q8-dash q8-anim"
        d="M114 100 Q130 74 150 64"
        stroke="currentColor"
        strokeWidth={2}
        strokeDasharray="4 4"
        strokeLinecap="round"
        opacity={0.55}
      />

      {/* Х: хурдан дүүрч, хурдан хоосорно */}
      <g className="q8-ph q8-ph-h">
        <rect
          className="q8-fill q8-fh q8-anim"
          x={153}
          y={94.5}
          width={50}
          height={6}
          rx={3}
          fill={ACCENT.H}
          opacity={0.6}
        />
        <g fill={ACCENT.H}>
          <circle cx={214} cy={92} r={2.4} opacity={0.9} />
          <circle cx={221} cy={84} r={2} opacity={0.55} />
          <circle cx={227} cy={76} r={1.6} opacity={0.3} />
        </g>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: хурдан дүүрч, дүүрэн хэвээр */}
      <g className="q8-ph q8-ph-s">
        <rect x={153} y={94.5} width={45} height={6} rx={3} fill={ACCENT.S} opacity={0.6} />
        <path
          d="M212 90 l4 4 8 -8"
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
          y={94.5}
          width={50}
          height={6}
          rx={3}
          fill={ACCENT.B}
          opacity={0.6}
        />
        <text x={212} y={98} fontSize={14} fontWeight={700} fill={ACCENT.B} fontFamily="inherit">
          ∞
        </text>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
