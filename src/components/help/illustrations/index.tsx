import { useTranslations } from "next-intl";
import type { HelpIllustrationComponent, HelpIllustrationProps } from "./shared";
import { Q01BoneWrist } from "./Q01BoneWrist";
import { Q02WeightScale } from "./Q02WeightScale";
import { Q03SkinPinch } from "./Q03SkinPinch";
import { Q04Weather } from "./Q04Weather";
import { Q05Sleep } from "./Q05Sleep";
import { Q06MealSkip } from "./Q06MealSkip";
import { Q07Pace } from "./Q07Pace";
import { Q08Memory } from "./Q08Memory";
import { Q09Stress } from "./Q09Stress";
import { Q10HandTouch } from "./Q10HandTouch";
import { Q11Stairs } from "./Q11Stairs";
import { Q12DailyRhythm } from "./Q12DailyRhythm";

export const HELP_ILLUSTRATIONS: Record<number, HelpIllustrationComponent> = {
  1: Q01BoneWrist,
  2: Q02WeightScale,
  3: Q03SkinPinch,
  4: Q04Weather,
  5: Q05Sleep,
  6: Q06MealSkip,
  7: Q07Pace,
  8: Q08Memory,
  9: Q09Stress,
  10: Q10HandTouch,
  11: Q11Stairs,
  12: Q12DailyRhythm,
};

export function HelpIllustration({
  questionId,
  ...props
}: HelpIllustrationProps & { questionId: number }) {
  const t = useTranslations("questionHelp");
  const Illustration = HELP_ILLUSTRATIONS[questionId];
  if (!Illustration) return null;
  const labelKey = `q${questionId}.ariaLabel`;
  return (
    <Illustration ariaLabel={t.has(labelKey) ? t(labelKey) : undefined} {...props} />
  );
}
