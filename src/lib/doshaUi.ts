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

/** Fill utility per constitution, matching DOSHA_COLOR (dots, progress bars). */
export const DOSHA_FILL: Record<DominantType, string> = {
  H: "bg-primary",
  S: "bg-secondary",
  B: "bg-tertiary",
};

export const DOSHA_LETTER: Record<DominantType, string> = {
  H: "Х",
  S: "Ш",
  B: "Б",
};
