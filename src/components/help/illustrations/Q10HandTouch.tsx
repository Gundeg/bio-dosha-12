import { QUESTION_HELP } from "@/lib/questionHelp";
import { ACCENT, HelpIllustrationProps, IllustrationRoot, PhaseBadge, phaseCss } from "./shared";

const HELP = QUESTION_HELP[10];

const CSS = phaseCss(
  "q10",
  `.q10-root .q10-spin{transform-box:fill-box;transform-origin:center;animation:q10-rot 10s linear infinite}
@keyframes q10-rot{to{transform:rotate(360deg)}}
.q10-root .q10-rise{animation:q10-up 1.8s linear infinite}
@keyframes q10-up{0%{transform:translateY(0);opacity:.9}100%{transform:translateY(-9px);opacity:0}}
.q10-root .q10-bob{animation:q10-bb 2.4s ease-in-out infinite}
@keyframes q10-bb{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}`
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
      {/* Суурь: баруун тийш харсан профиль царай + хацарт тавьсан алга */}
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {/* дух → хамар → уруул → эрүү → эрүүний шугам: нэг итгэлтэй шугам */}
        <path d="M105 18 C121 17.5 133 26.5 138.5 41.5 C139.6 45 139.8 49.5 141 53 C143 57.5 147.5 61.5 150 65.5 C151.3 68 148.8 70.2 145.6 70.2 C143.9 71.3 143.9 75 146.2 76.8 C147.3 77.6 146.6 79.2 144.8 79.2 C147.2 79.8 147.9 82.8 146.5 85 C145.3 86.8 144.7 87.6 144.9 89 C147.4 90.2 148.3 93.6 146.2 97 C142.8 100.6 135.5 103.4 127 104" />
        {/* толгойн ар тал, үс */}
        <path d="M105 18 C85 14 67 24 62 42 C58 57 61 70 59 80" />
        <path d="M104 19 C112 23 117 29 119 36" strokeWidth={2} opacity={0.5} />
        {/* хүзүү: ар, урд */}
        <path d="M59 84 C60 97 57 110 51 121" />
        <path d="M131 107 C135 114.5 141 120 148 124" />
        {/* чих — алганы ард хагас харагдана */}
        <path d="M78 61 C87 57.5 91 66 87 74 C84.5 79 79.5 79.5 78 74.5" strokeWidth={2.2} />
        {/* аниастай нүд + хөмсөг */}
        <path d="M126 54 q5.5 4 10.5 1.5" strokeWidth={2} />
        <path d="M125 45 q6.5 -3.5 12 -1" strokeWidth={2} opacity={0.7} />
        {/* хацар дээрх алга: 4 шовх хуруу дээшээ, эрхий эрүү дагуу */}
        <path d="M90 103 L90.5 77 C90.6 72 90.8 67.5 91.1 63.8 C91.6 60 96.8 60 97.3 63.8 C97.6 67.5 97.8 71.5 98 75.2 C98.3 70 98.6 61.5 98.9 57.3 C99.4 53.4 104.6 53.4 105.1 57.3 C105.4 61.5 105.6 70 105.8 74.8 C106.1 69.5 106.4 60 106.7 55.8 C107.2 51.9 112.4 51.9 112.9 55.8 C113.2 60 113.4 69.5 113.6 74.6 C113.9 69.5 114.2 63 114.5 59.3 C115 55.4 120.2 55.4 120.7 59.3 C121 63.5 121.2 70 121.4 76.5 L121.6 82 C125.4 83.4 129.4 86.4 131.8 90.2 C133.4 93.6 130.6 96.6 127.2 95.4 C124 94.2 121.4 92 119.6 89.6 C120 94.4 119 99.8 116.8 103 C109.5 107.6 96.5 107.6 90 103" />
        {/* бугуй, шуу доошоо */}
        <path d="M96 107.4 C95.2 113 95.2 119 96 124.5" />
        <path d="M114 106.8 C115 113 115.3 119 114.8 124.5" />
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
          <path d="M176 62 q6 4 12 0 q6 -4 12 0 q6 4 12 0" />
          <path d="M182 74 q6 4 12 0 q6 -4 12 0" />
        </g>
        <PhaseBadge d="B" label={HELP.outcomes.B.label} />
      </g>
    </IllustrationRoot>
  );
}
