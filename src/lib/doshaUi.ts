import { DominantType } from "./questionnaireEngine";

export const DOSHA_COLOR: Record<DominantType, string> = {
  H: "text-primary",
  S: "text-secondary",
  B: "text-tertiary",
};

export const DOSHA_BG: Record<DominantType, string> = {
  H: "bg-primary/5",
  S: "bg-secondary/5",
  B: "bg-tertiary/5",
};

export const DOSHA_LETTER: Record<DominantType, string> = {
  H: "Х",
  S: "Ш",
  B: "Б",
};
