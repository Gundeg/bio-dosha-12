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

const HELP = QUESTION_HELP[5];

/** Орны дотоод палитра (материал тул theme-ээр эргэлддэггүй). */
const WOOD = "#d9b38a";
const WOOD_SH = "#bf9468";
const BLANKET = "#8fb4c4";
const BLANKET_SH = "#6f97a8";
const PILLOW = "#f2ece0";
const PILLOW_SH = "#ded3bf";
const MOON = "#f6e6b8";
const STAR = "#e8c979";
const HAIR = "#43362b";

const CSS = phaseCss(
  "q5",
  `.q5-root .q5-blink{animation:q5-blk 1.1s ease-in-out infinite}
@keyframes q5-blk{0%,100%{opacity:1}50%{opacity:.2}}
.q5-root .q5-float{animation:q5-flt 2.4s ease-in-out infinite}
@keyframes q5-flt{0%,100%{transform:translateY(0);opacity:.9}50%{transform:translateY(-4px);opacity:1}}
.q5-root .q5-tw{animation:q5-twk 2.2s ease-in-out infinite}
@keyframes q5-twk{0%,100%{opacity:.3}50%{opacity:1}}`
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
      <SkinDefs p="q5" />

      {/* газрын зөөлөн сүүдэр — орны доор */}
      <ellipse cx={121} cy={115.5} rx={86} ry={2.2} fill={INK} opacity={0.06} />

      {/* хавирган сар + одод */}
      <path
        d="M30 12 a11 11 0 1 0 8 19 a8.5 8.5 0 1 1 -8 -19 z"
        fill={MOON}
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx={26} cy={16} r={1.8} fill="#fffdf3" opacity={0.5} />
      <path className="q5-tw q5-anim" d="M54 14 v8 M50 18 h8" stroke={STAR} strokeWidth={2} strokeLinecap="round" />
      <path
        className="q5-tw q5-anim"
        style={{ animationDelay: "-1.1s" }}
        d="M98 14 v6 M95 17 h6"
        stroke={STAR}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* орны толгойвч ба хөлийн багана (модон) */}
      <rect x={37.5} y={46} width={5} height={68} rx={2.5} fill={WOOD} stroke={INK} strokeWidth={2} />
      <circle cx={40} cy={43} r={4.5} fill={WOOD} stroke={INK} strokeWidth={2} />
      <rect x={199.5} y={68.5} width={5} height={45.5} rx={2.5} fill={WOOD} stroke={INK} strokeWidth={2} />
      <circle cx={202} cy={66} r={4.5} fill={WOOD} stroke={INK} strokeWidth={2} />

      {/* шал */}
      <path d="M28 114 H214" stroke={INK} strokeWidth={2} opacity={0.3} strokeLinecap="round" />

      {/* гудас/хүрээ */}
      <rect x={44} y={88} width={154} height={18} rx={6} fill={WOOD} stroke={INK} strokeWidth={2.5} />
      <rect x={47} y={98} width={148} height={6} rx={3} fill={WOOD_SH} opacity={0.7} />

      {/* дэр — намхан дов */}
      <path d="M48 88 Q47 76 59 75 L77 75 Q89 76 89 88 Z" fill={PILLOW} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M51 87 Q50 79 58 77" stroke={PILLOW_SH} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.8} />

      {/* толгой дэрэн дээр (арьс) + үс */}
      <circle cx={68} cy={66} r={9} fill="url(#q5-skin)" stroke={INK} strokeWidth={2.5} />
      <path
        d="M61 61 C60 55 64 52 68 52 C73 52 77 55 77 62 C75 58 72 57 69 57 C66 57 63 58 61 61 Z"
        fill={HAIR}
        stroke={INK}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <ellipse cx={63} cy={64} rx={2} ry={2.6} fill={SKIN.light} opacity={0.6} />

      {/* хөнжил — цээж, өвдөгний товгортой, хөлийн тавцан хүртэл */}
      <path
        d="M79 71 C88 63 99 61 108 64.5 C117 68 125 70.5 133 71 C142 71.5 151 69.5 158 72.5 C171 78 183 84 195 87.5 L195 88 L79 88 Z"
        fill={BLANKET}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* хөлийн зүг гүнзгийрэх сүүдэр */}
      <path d="M120 71 C133 71 151 70 158 72.5 C171 78 183 84 195 87.5 L195 88 L120 88 Z" fill={BLANKET_SH} opacity={0.5} />
      {/* өвдөгний нугалаа */}
      <path d="M105 66 q5 9 2 16" stroke={BLANKET_SH} strokeWidth={2} strokeLinecap="round" fill="none" />
      {/* дээд ирмэгийн гэрэлт нуруу */}
      <path d="M80 72 C90 65 100 63 108 66" stroke="#a6c6d3" strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.7} />

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
        <g>
          <text
            className="q5-float q5-anim"
            x={84}
            y={52}
            fontSize={14}
            fontWeight={700}
            fill={ACCENT.B}
            fontFamily="inherit"
          >
            Z
          </text>
          <text
            className="q5-float q5-anim"
            style={{ animationDelay: "-.45s" }}
            x={97}
            y={43}
            fontSize={11}
            fontWeight={700}
            fill={ACCENT.B}
            fontFamily="inherit"
          >
            z
          </text>
          <text
            className="q5-float q5-anim"
            style={{ animationDelay: "-.9s" }}
            x={107}
            y={35}
            fontSize={8.5}
            fontWeight={700}
            fill={ACCENT.B}
            fontFamily="inherit"
          >
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
