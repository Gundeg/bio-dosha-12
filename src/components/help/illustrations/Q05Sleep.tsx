import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[5];

const CSS = phaseCss(
  "q5",
  `.q5-root .q5-blink{animation:q5-blk 1.1s ease-in-out infinite}
@keyframes q5-blk{0%,100%{opacity:1}50%{opacity:.2}}
.q5-root .q5-float{animation:q5-flt 2.4s ease-in-out infinite}
@keyframes q5-flt{0%,100%{transform:translateY(0);opacity:.9}50%{transform:translateY(-4px);opacity:1}}`
);

/** Нойрны сорил: унтсан цагийн урт + шөнийн сэрэлт. */
export function Q05Sleep({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q5"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      {/* газрын зөөлөн сүүдэр — орны доор */}
      <ellipse cx={121} cy={115.5} rx={86} ry={2.2} fill="currentColor" opacity={0.07} />

      {/* Суурь: сар + одод, хажуугаас харсан ор — толгойвч, гудас, дэр, хүн, хөнжил */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {/* хавирган сар + одод */}
        <path d="M30 12 a11 11 0 1 0 8 19 a8.5 8.5 0 1 1 -8 -19 z" />
        <path d="M54 14 v8 M50 18 h8 M98 14 v6 M95 17 h6" strokeWidth={1.8} opacity={0.5} />
        {/* орны толгойвч ба хөлийн багана (бөмбөлөгтэй) */}
        <path d="M40 114 V48" />
        <circle cx={40} cy={43} r={4.5} />
        <path d="M202 114 V70.5" />
        <circle cx={202} cy={66} r={4.5} />
        {/* гудас/хүрээ */}
        <rect x={44} y={88} width={154} height={18} rx={6} fill="currentColor" fillOpacity={0.05} />
        {/* шал */}
        <path d="M28 114 H214" strokeWidth={2} opacity={0.4} />
        {/* дэр — намхан дов, дээр нь толгой */}
        <path d="M48 88 Q47 76 59 75 L77 75 Q89 76 89 88" />
        {/* толгой дэрэн дээр */}
        <circle cx={68} cy={66} r={9} />
        {/* хөнжил — цээж, өвдөгний товгортой, хөлийн тавцан хүртэл */}
        <path d="M79 71 C88 63 99 61 108 64.5 C117 68 125 70.5 133 71 C142 71.5 151 69.5 158 72.5 C171 78 183 84 195 87.5" />
        <path d="M105 66 q5 9 2 16" strokeWidth={2} opacity={0.5} />
      </g>

      {/* Х: нүд нээлттэй + сэрээх «!» анивчина */}
      <g className="q5-ph q5-ph-h">
        <circle cx={65} cy={64.5} r={1.8} fill={ACCENT.H} />
        <g className="q5-blink q5-anim">
          <text x={68} y={47} fontSize={15} fontWeight={700} fill={ACCENT.H} textAnchor="middle" fontFamily="inherit">
            !
          </text>
          <path d="M59 41 l-6 -4 M77 41 l6 -4" stroke={ACCENT.H} strokeWidth={2} strokeLinecap="round" />
        </g>
        <text x={210} y={32} fontSize={11.5} fontWeight={700} fill={ACCENT.H} textAnchor="end" fontFamily="inherit">
          5–6ц
        </text>
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: нүд аниастай, тайван + тэмдэг */}
      <g className="q5-ph q5-ph-s">
        <path d="M61.5 64.5 q3.5 3 7 0" stroke={ACCENT.S} strokeWidth={2} strokeLinecap="round" fill="none" />
        <path
          d="M142 34 l6 6 12 -12"
          stroke={ACCENT.S}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <text x={210} y={32} fontSize={11.5} fontWeight={700} fill={ACCENT.S} textAnchor="end" fontFamily="inherit">
          7–8ц
        </text>
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: гүн нойр — Z z z хөвнө, хөнжил гүнзгий нугалаастай */}
      <g className="q5-ph q5-ph-b">
        <path d="M61.5 64.5 q3.5 3 7 0" stroke={ACCENT.B} strokeWidth={2} strokeLinecap="round" fill="none" />
        <path d="M119 70 q6 9 3 15" stroke={ACCENT.B} strokeWidth={2} strokeLinecap="round" fill="none" />
        <g className="q5-float q5-anim">
          <text x={84} y={52} fontSize={14} fontWeight={700} fill={ACCENT.B} fontFamily="inherit">
            Z
          </text>
          <text x={97} y={43} fontSize={11} fontWeight={700} fill={ACCENT.B} fontFamily="inherit">
            z
          </text>
          <text x={107} y={35} fontSize={8.5} fontWeight={700} fill={ACCENT.B} fontFamily="inherit">
            z
          </text>
        </g>
        <text x={210} y={32} fontSize={11.5} fontWeight={700} fill={ACCENT.B} textAnchor="end" fontFamily="inherit">
          9+ц
        </text>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
