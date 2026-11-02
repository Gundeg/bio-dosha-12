import type { StaticImageData } from "next/image";
import type { DominantType } from "@/lib/questionnaireEngine";

import q01h from "@/assets/help-illustrations/q01-h.webp";
import q01s from "@/assets/help-illustrations/q01-s.webp";
import q01b from "@/assets/help-illustrations/q01-b.webp";
import q02h from "@/assets/help-illustrations/q02-h.webp";
import q02s from "@/assets/help-illustrations/q02-s.webp";
import q02b from "@/assets/help-illustrations/q02-b.webp";
import q03h from "@/assets/help-illustrations/q03-h.webp";
import q03s from "@/assets/help-illustrations/q03-s.webp";
import q03b from "@/assets/help-illustrations/q03-b.webp";
import q04h from "@/assets/help-illustrations/q04-h.webp";
import q04s from "@/assets/help-illustrations/q04-s.webp";
import q04b from "@/assets/help-illustrations/q04-b.webp";
import q05h from "@/assets/help-illustrations/q05-h.webp";
import q05s from "@/assets/help-illustrations/q05-s.webp";
import q05b from "@/assets/help-illustrations/q05-b.webp";
import q06h from "@/assets/help-illustrations/q06-h.webp";
import q06s from "@/assets/help-illustrations/q06-s.webp";
import q06b from "@/assets/help-illustrations/q06-b.webp";
import q07h from "@/assets/help-illustrations/q07-h.webp";
import q07s from "@/assets/help-illustrations/q07-s.webp";
import q07b from "@/assets/help-illustrations/q07-b.webp";
import q08h from "@/assets/help-illustrations/q08-h.webp";
import q08s from "@/assets/help-illustrations/q08-s.webp";
import q08b from "@/assets/help-illustrations/q08-b.webp";
import q09h from "@/assets/help-illustrations/q09-h.webp";
import q09s from "@/assets/help-illustrations/q09-s.webp";
import q09b from "@/assets/help-illustrations/q09-b.webp";
import q10h from "@/assets/help-illustrations/q10-h.webp";
import q10s from "@/assets/help-illustrations/q10-s.webp";
import q10b from "@/assets/help-illustrations/q10-b.webp";
import q11h from "@/assets/help-illustrations/q11-h.webp";
import q11s from "@/assets/help-illustrations/q11-s.webp";
import q11b from "@/assets/help-illustrations/q11-b.webp";
import q12h from "@/assets/help-illustrations/q12-h.webp";
import q12s from "@/assets/help-illustrations/q12-s.webp";
import q12b from "@/assets/help-illustrations/q12-b.webp";

/** The three outcome frames (Хий, Шар, Бадган) of one question. */
export type HelpFrameSet = Record<DominantType, StaticImageData>;

/**
 * Owner-approved illustration frames per questionnaire question (2026-11-02).
 * Regenerate or replace a frame with scripts/help-illustrations/README.md;
 * the files are checked by src/lib/__tests__/helpFrames.test.ts.
 */
export const HELP_FRAMES: Record<number, HelpFrameSet> = {
  1: { H: q01h, S: q01s, B: q01b },
  2: { H: q02h, S: q02s, B: q02b },
  3: { H: q03h, S: q03s, B: q03b },
  4: { H: q04h, S: q04s, B: q04b },
  5: { H: q05h, S: q05s, B: q05b },
  6: { H: q06h, S: q06s, B: q06b },
  7: { H: q07h, S: q07s, B: q07b },
  8: { H: q08h, S: q08s, B: q08b },
  9: { H: q09h, S: q09s, B: q09b },
  10: { H: q10h, S: q10s, B: q10b },
  11: { H: q11h, S: q11s, B: q11b },
  12: { H: q12h, S: q12s, B: q12b },
};

export function getHelpFrames(questionId: number): HelpFrameSet | undefined {
  return HELP_FRAMES[questionId];
}
