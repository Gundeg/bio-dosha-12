import Image from "next/image";
import { useTranslations } from "next-intl";
import type { DominantType } from "@/lib/questionnaireEngine";
import { cn } from "@/lib/utils";
import { getHelpFrames } from "./frames";

export interface HelpIllustrationProps {
  questionId: number;
  /** Заасан үед тухайн хариултын төлөвт царцаана; үгүй бол Х→Ш→Б гэж эргэлдэнэ. */
  variant?: DominantType;
  className?: string;
  ariaLabel?: string;
  /** next/image `sizes`; the default covers the dialog panels and the side panel. */
  sizes?: string;
}

const CYCLE: DominantType[] = ["H", "S", "B"];

/**
 * One question's help picture: three owner-approved frames that crossfade
 * (CSS in globals.css, `.help-frames`), or one frozen frame when `variant` is
 * set. The frames carry no text; the label chip is shown only while cycling,
 * and the махбод letters are never shown to the person answering.
 */
export function HelpIllustration({
  questionId,
  variant,
  className,
  ariaLabel,
  sizes = "(min-width: 640px) 320px, 100vw",
}: HelpIllustrationProps) {
  const t = useTranslations("questionHelp");
  const frames = getHelpFrames(questionId);
  if (!frames) return null;

  const labelKey = `q${questionId}.ariaLabel`;
  const label = ariaLabel ?? (t.has(labelKey) ? t(labelKey) : undefined);
  const states = variant ? [variant] : CYCLE;

  return (
    // Keyed by question so a question switch remounts the frames: the cycle
    // restarts at Х and the previous question's picture never shows under the new label.
    <div
      key={questionId}
      role="img"
      aria-label={label}
      data-variant={variant ?? "cycle"}
      className={cn("help-frames relative aspect-[3/2] w-full overflow-hidden", className)}
    >
      {states.map((state) => (
        <div key={state} className="help-frame absolute inset-0">
          <Image src={frames[state]} alt="" fill sizes={sizes} className="object-cover" />
          {!variant && (
            <span className="absolute bottom-2 left-2 max-w-[80%] truncate rounded-md bg-surface-container-lowest/85 px-2 py-0.5 text-xs font-medium text-on-surface">
              {t(`q${questionId}.outcomes.${state}.label`)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
