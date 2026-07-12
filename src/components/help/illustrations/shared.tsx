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
@keyframes ${p}-ph1{0%,30%{opacity:1}36%,94%{opacity:0}100%{opacity:1}}
@keyframes ${p}-ph2{0%,27%{opacity:0}33%,63%{opacity:1}69%,100%{opacity:0}}
@keyframes ${p}-ph3{0%,60%{opacity:0}66%,96%{opacity:1}100%{opacity:0}}
.${p}-root[data-variant="H"] .${p}-ph,.${p}-root[data-variant="S"] .${p}-ph,.${p}-root[data-variant="B"] .${p}-ph{animation:none;opacity:0}
.${p}-root[data-variant="H"] .${p}-ph-h,.${p}-root[data-variant="S"] .${p}-ph-s,.${p}-root[data-variant="B"] .${p}-ph-b{opacity:1}
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
      <text x={38} y={146} fontSize={10.5} fill="currentColor" opacity={0.75} fontFamily="inherit">
        {label}
      </text>
    </g>
  );
}
