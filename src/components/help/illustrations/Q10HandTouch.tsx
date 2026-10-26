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

const HELP = QUESTION_HELP[10];

/** Үсний дулаахан бор өнгө. */
const HAIR = "#6b4a2f";
const HAIR_HI = "#8a6642";

const CSS = phaseCss(
  "q10",
  `.q10-root .q10-spin{transform-box:fill-box;transform-origin:center;animation:q10-rot 10s linear infinite}
@keyframes q10-rot{to{transform:rotate(360deg)}}
.q10-root .q10-rise{animation:q10-up 1.8s linear infinite}
@keyframes q10-up{0%{transform:translateY(0);opacity:.9}100%{transform:translateY(-9px);opacity:0}}
.q10-root .q10-bob{animation:q10-bb 2.4s ease-in-out infinite}
@keyframes q10-bb{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}
.q10-root .q10-mist{animation:q10-fd 2.8s ease-in-out infinite}
@keyframes q10-fd{0%,100%{opacity:1}50%{opacity:.45}}`
);

/** Гар, хөлийн сорил: алгаа хацартаа тавьж дулааныг нь мэдрэх. */
export function Q10HandTouch({ variant, className, ariaLabel }: HelpIllustrationProps) {
  return (
    <IllustrationRoot
      p="q10"
      css={CSS}
      variant={variant}
      className={className}
      ariaLabel={ariaLabel ?? HELP.ariaLabel}
    >
      <SkinDefs p="q10" />

      {/* Суурь: баруун тийш харсан профиль царай + хацарт тавьсан алга */}

      {/* толгой + хүзүүний дүүргэлт (нэг битүү профиль хэлбэр) */}
      <path
        d="M105 18 C121 17.5 133 26.5 138.5 41.5 C139.6 45 139.8 49.5 141 53 C143 57.5 147.5 61.5 150 65.5 C151.3 68 148.8 70.2 145.6 70.2 C143.9 71.3 143.9 75 146.2 76.8 C147.3 77.6 146.6 79.2 144.8 79.2 C147.2 79.8 147.9 82.8 146.5 85 C145.3 86.8 144.7 87.6 144.9 89 C147.4 90.2 148.3 93.6 146.2 97 C142.8 100.6 135.5 103.4 127 104 C129 105 130 106 131 107 C135 114.5 141 120 148 124 C120 126 80 126 51 121 C57 110 60 97 59 84 L59 80 C61 70 58 57 62 42 C67 24 85 14 105 18 Z"
        fill="url(#q10-skin)"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* үс — духны шугамаас ар тал, орой руу бор эзэлхүүн */}
      <path
        d="M105 18 C85 14 67 24 62 42 C58 57 61 70 59 80 C63 73 67 68 71 64 C74 50 76 34 87 25 C93 21 100 19 105 18 Z"
        fill={HAIR}
        stroke={INK}
        strokeWidth={2.3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M66 44 C72 34 80 27 90 24" stroke={HAIR_HI} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.7} />

      {/* чих — алганы ард хагас харагдана */}
      <path
        d="M79 60 C88 57 92 66 88 74 C85 80 79 80 77 74 C76 68 75 62 79 60 Z"
        fill="url(#q10-skin)"
        stroke={INK}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <path d="M83 64 C86 66 86 71 83 73" stroke={SKIN.deep} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.7} />

      {/* духны гэрэлтэл */}
      <ellipse cx={124} cy={30} rx={7} ry={9} fill={SKIN.light} opacity={0.4} />

      {/* нүүрний тодотгол: хөмсөг + аниастай нүд + уруулын шугам */}
      <g stroke={INK} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M125 45 q6.5 -3.5 12 -1" strokeWidth={2} opacity={0.75} />
        <path d="M126 54 q5.5 4 10.5 1.5" strokeWidth={2} />
        <path d="M143.4 80.4 q2.6 1 3.4 -0.4" strokeWidth={1.6} opacity={0.6} />
      </g>

      {/* бугуй + шуу (алганы ард доошоо) */}
      <path
        d="M95.5 104 C95 113 95 119 95.8 125 L115 125 C115.5 119 115.2 113 114.5 105 C108 107.5 101.5 107.5 95.5 104 Z"
        fill="url(#q10-skin)"
        stroke={INK}
        strokeWidth={2.3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* хацар дээрх алга (хамгийн ойрх гадаргуу → SKIN.shade), 4 шовх хуруу */}
      <path
        d="M90 103 L90.5 77 C90.6 72 90.8 67.5 91.1 63.8 C91.6 60 96.8 60 97.3 63.8 C97.6 67.5 97.8 71.5 98 75.2 C98.3 70 98.6 61.5 98.9 57.3 C99.4 53.4 104.6 53.4 105.1 57.3 C105.4 61.5 105.6 70 105.8 74.8 C106.1 69.5 106.4 60 106.7 55.8 C107.2 51.9 112.4 51.9 112.9 55.8 C113.2 60 113.4 69.5 113.6 74.6 C113.9 69.5 114.2 63 114.5 59.3 C115 55.4 120.2 55.4 120.7 59.3 C121 63.5 121.2 70 121.4 76.5 L121.6 82 C125.4 83.4 129.4 86.4 131.8 90.2 C133.4 93.6 130.6 96.6 127.2 95.4 C124 94.2 121.4 92 119.6 89.6 C120 94.4 119 99.8 116.8 103 C109.5 107.6 96.5 107.6 90 103 Z"
        fill={SKIN.shade}
        stroke={INK}
        strokeWidth={2.3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* алганы гадаргуугийн тодрол + хумсны туяа */}
      <ellipse cx={102} cy={88} rx={6} ry={13} fill={SKIN.light} opacity={0.3} />
      <g fill={SKIN.light} opacity={0.75}>
        <ellipse cx={94} cy={62} rx={1.8} ry={2.6} />
        <ellipse cx={102} cy={55.5} rx={1.8} ry={2.6} />
        <ellipse cx={109.8} cy={54} rx={1.8} ry={2.6} />
        <ellipse cx={117.6} cy={57} rx={1.8} ry={2.6} />
      </g>

      {/* Х: хүйтэн — 6 салаат цасан ширхэг эргэлдэнэ + хуурай зураас */}
      <g className="q10-ph q10-ph-h">
        <g
          className="q10-spin q10-anim"
          stroke={ACCENT.H}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <path d="M196 32 V60 M183.9 39 L208.1 53 M208.1 39 L183.9 53" />
          <path
            d="M193.8 32.7 L196 36.5 L198.2 32.7 M193.8 59.3 L196 55.5 L198.2 59.3 M206.4 37.4 L204.2 41.3 L208.6 41.3 M185.6 54.6 L187.8 50.8 L183.4 50.8 M185.6 37.4 L187.8 41.3 L183.4 41.3 M206.4 54.6 L204.2 50.8 L208.6 50.8"
            strokeWidth={1.8}
          />
        </g>
        <path d="M167 74 l7 7 M176 88 l7 7" stroke={ACCENT.H} strokeWidth={2} strokeLinecap="round" />
        <PhaseBadge d="H" label={HELP.outcomes.H.label} />
      </g>

      {/* Ш: халуун — гар орчмоос өгсөх илчний долгион + хөлсний дусал */}
      <g className="q10-ph q10-ph-s">
        <g className="q10-rise q10-anim" stroke={ACCENT.S} strokeWidth={2.2} strokeLinecap="round" fill="none">
          <path d="M156 50 q4 -6 0 -12 q-4 -6 0 -12" />
          <path d="M170 48 q4 -6 0 -12 q-4 -6 0 -12" />
          <path d="M184 50 q4 -6 0 -12 q-4 -6 0 -12" />
        </g>
        <path
          d="M200 58 q5.5 8 0 13 q-5.5 -5 0 -13 z"
          stroke={ACCENT.S}
          strokeWidth={1.8}
          fill={ACCENT.S}
          fillOpacity={0.25}
        />
        <PhaseBadge d="S" label={HELP.outcomes.S.label} />
      </g>

      {/* Б: сэрүүн чийглэг — дусал + зөөлөн долгион */}
      <g className="q10-ph q10-ph-b">
        <g className="q10-bob q10-anim">
          <path
            d="M192 30 q7 10 0 16 q-7 -6 0 -16 z"
            stroke={ACCENT.B}
            strokeWidth={2}
            fill={ACCENT.B}
            fillOpacity={0.2}
          />
        </g>
        <g stroke={ACCENT.B} strokeWidth={2} strokeLinecap="round" fill="none">
          <path className="q10-mist q10-anim" d="M176 62 q6 4 12 0 q6 -4 12 0 q6 4 12 0" />
          <path
            className="q10-mist q10-anim"
            style={{ animationDelay: "-1.4s" }}
            d="M182 74 q6 4 12 0 q6 -4 12 0"
          />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
