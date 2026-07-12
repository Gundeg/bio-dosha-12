import { describe, expect, it } from "vitest";
import { QUESTIONNAIRE, type DominantType } from "../questionnaireEngine";
import { QUESTION_HELP } from "../questionHelp";

const DOSHAS: DominantType[] = ["H", "S", "B"];

describe("QUESTION_HELP", () => {
  it("covers every questionnaire question and nothing else", () => {
    const questionIds = QUESTIONNAIRE.map((q) => q.id).sort((a, b) => a - b);
    const helpIds = Object.keys(QUESTION_HELP)
      .map(Number)
      .sort((a, b) => a - b);
    expect(helpIds).toEqual(questionIds);
    for (const q of QUESTIONNAIRE) {
      expect(QUESTION_HELP[q.id].questionId).toBe(q.id);
    }
  });

  it("has non-empty title, instruction and ariaLabel per entry", () => {
    for (const help of Object.values(QUESTION_HELP)) {
      expect(help.title.trim()).not.toBe("");
      expect(help.instruction.trim()).not.toBe("");
      expect(help.ariaLabel.trim()).not.toBe("");
    }
  });

  it("describes all three dosha outcomes per entry", () => {
    for (const help of Object.values(QUESTION_HELP)) {
      expect(Object.keys(help.outcomes).sort()).toEqual(["B", "H", "S"]);
      for (const dosha of DOSHAS) {
        expect(help.outcomes[dosha].label.trim()).not.toBe("");
        expect(help.outcomes[dosha].description.trim()).not.toBe("");
      }
    }
  });
});
