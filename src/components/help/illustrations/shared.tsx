import type { ComponentType, ReactNode } from "react";
import { DominantType } from "@/lib/questionnaireEngine";
import { DOSHA_LETTER } from "@/lib/doshaUi";

export interface HelpIllustrationProps {
  /** Заасан үед тухайн хариултын төлөвт царцаана; үгүй бол Х→Ш→Б гэж эргэлдэнэ */
  variant?: DominantType;
  className?: string;
  ariaLabel?: string;
}

export type HelpIllustrationComponent = ComponentType<HelpIllustrationProps>;

/**
 * Махбод тус бүрийн онцлох өнгө. CSS хувьсагч + hex fallback: апп дотор
 * globals.css-ийн токенийг дагана, бие даасан HTML хуудсанд fallback-аараа
 * ижил харагдана (artifact зөөвөрлөлтийн гэрээ).
 */
export const ACCENT: Record<DominantType, string> = {
  H: "var(--primary, #00626b)",
  S: "var(--secondary-container, #fe932c)",
  B: "var(--tertiary, #4b596e)",
};

/**
 * Арьс, бэхэн зураасны тогтмол өнгө. Эдгээр нь материал (өнгө өөрчлөгдвөл
 * гар нь гар байхаа болино) тул theme-ээр эргэлддэггүй — dark горимд
 * фонын өнгө нь панелийн туяагаар өөрчлөгдөнө, зураасны өнгө тогтмол.
 */
export const SKIN = {
  base: "#f4cda6",
  shade: "#e0ad81",
  deep: "#c98f61",
  light: "#fce4cb",
  nail: "#f7dcc4",
} as const;

/** Дүрсийн тогтмол бараан бэхэн зураас (theme-ээр эргэлддэггүй). */
export const INK = "#3b2a20";

/** Тодотгол өнгийг зөөлрүүлж дүүргэлтэд ашиглах (accent wash). */
export const ACCENT_SOFT: Record<DominantType, string> = {
  H: "var(--primary-container, #127c87)",
  S: "var(--secondary-container, #fe932c)",
  B: "var(--tertiary-container, #637187)",
};

/**
 * Том органик хэлбэрийн (гар, шуу, царай) эзлэхүүнд зориулсан gradient defs.
 * Бүх id нь `p`-ээр угтвартай тул нэг баримт дотор ижил хэд хэдэн панел
 * зэрэгцэн орсон ч зөрчилдөхгүй (ижил тодорхойлолт → эхнийхээр шийдэгдэнэ).
 */
export function SkinDefs({ p }: { p: string }) {
  return (
    <defs>
      <linearGradient id={`${p}-skin`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={SKIN.light} />
        <stop offset="0.55" stopColor={SKIN.base} />
        <stop offset="1" stopColor={SKIN.shade} />
      </linearGradient>
      <linearGradient id={`${p}-skin2`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={SKIN.base} />
        <stop offset="1" stopColor={SKIN.shade} />
      </linearGradient>
    </defs>
  );
}

/**
 * 9 секундын Х→Ш→Б мөчлөгийн CSS. Бүх class/keyframe нэр `p`-ээр
 * угтвартай тул нэг хуудсан дээр хэд хэдэн зураг зэрэг байж болно.
 * Микро хөдөлгөөнтэй элемент бүр `${p}-anim` class авбал
 * prefers-reduced-motion үед бүгд зогсоно.
 */
export function phaseCss(p: string, extra = ""): string {
  return `
.${p}-root .${p}-ph{opacity:0}
.${p}-root .${p}-ph-h{animation:${p}-ph1 9s linear infinite}
.${p}-root .${p}-ph-s{animation:${p}-ph2 9s linear infinite}
.${p}-root .${p}-ph-b{animation:${p}-ph3 9s linear infinite}
@keyframes ${p}-ph1{0%,30%{opacity:1;transform:translateY(0)}36%,94%{opacity:0;transform:translateY(4px)}100%{opacity:1;transform:translateY(0)}}
@keyframes ${p}-ph2{0%,27%{opacity:0;transform:translateY(4px)}33%,63%{opacity:1;transform:translateY(0)}69%,100%{opacity:0;transform:translateY(4px)}}
@keyframes ${p}-ph3{0%,60%{opacity:0;transform:translateY(4px)}66%,96%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(4px)}}
.${p}-root[data-variant="H"] .${p}-ph,.${p}-root[data-variant="S"] .${p}-ph,.${p}-root[data-variant="B"] .${p}-ph{animation:none;opacity:0}
.${p}-root[data-variant="H"] .${p}-ph-h,.${p}-root[data-variant="S"] .${p}-ph-s,.${p}-root[data-variant="B"] .${p}-ph-b{opacity:1}
.${p}-root[data-variant="H"] .${p}-anim,.${p}-root[data-variant="S"] .${p}-anim,.${p}-root[data-variant="B"] .${p}-anim{animation:none!important}
${extra}
@media (prefers-reduced-motion: reduce){
.${p}-root .${p}-ph,.${p}-root .${p}-anim{animation:none!important}
.${p}-root[data-variant="cycle"] .${p}-ph{opacity:0}
.${p}-root[data-variant="cycle"] .${p}-ph-h{opacity:1}
}
`;
}

/**
 * Зургийн суурь SVG. Tailwind class зөвхөн үндсэн svg элемент дээр —
 * доторх бүх зүйл цэвэр SVG + өөрийн <style> тул markup-ийг шууд
 * хуулж бие даасан HTML хуудсанд ажиллуулж болно.
 */
export function IllustrationRoot({
  p,
  css,
  variant,
  className,
  ariaLabel,
  children,
}: HelpIllustrationProps & { p: string; css: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${p}-root${className ? ` ${className}` : ""}`}
      data-variant={variant ?? "cycle"}
      role="img"
      aria-label={ariaLabel}
    >
      <style>{css}</style>
      {children}
    </svg>
  );
}

/** Фазын тэмдэг: доод зүүн буланд махбодын үсэг + хариултын богино нэр. */
export function PhaseBadge({ d, label }: { d: DominantType; label: string }) {
  return (
    <g>
      <circle cx={22} cy={142} r={10} fill={ACCENT[d]} />
      <text
        x={22}
        y={146}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill="#fff"
        fontFamily="inherit"
      >
        {DOSHA_LETTER[d]}
      </text>
      <text x={38} y={146} fontSize={10.5} fill={INK} opacity={0.72} fontFamily="inherit">
        {label}
      </text>
    </g>
  );
}
