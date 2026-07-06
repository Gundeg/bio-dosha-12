import { describe, expect, it } from "vitest";
import { QUESTIONNAIRE, scoreQuestionnaire, type DominantType } from "../questionnaireEngine";

function answersOf(pattern: DominantType[]): Record<number, DominantType> {
  const answers: Record<number, DominantType> = {};
  pattern.forEach((v, i) => {
    answers[i + 1] = v;
  });
  return answers;
}

const all = (v: DominantType) => answersOf(Array(12).fill(v));

describe("QUESTIONNAIRE", () => {
  it("has exactly 12 tri-choice questions", () => {
    expect(QUESTIONNAIRE).toHaveLength(12);
    for (const q of QUESTIONNAIRE) {
      expect(q.options).toHaveLength(3);
      expect(q.options.map((o) => o.value)).toEqual(["H", "S", "B"]);
    }
  });
});

describe("scoreQuestionnaire", () => {
  it("maps pure answer sets to the pure dosha types (regression: this branch was dead code)", () => {
    expect(scoreQuestionnaire(all("H"))).toMatchObject({ doshaKey: "Khii", kt: 0.7 });
    expect(scoreQuestionnaire(all("S"))).toMatchObject({ doshaKey: "Shar", kt: 1.0 });
    expect(scoreQuestionnaire(all("B"))).toMatchObject({ doshaKey: "Badgan", kt: 1.5 });
  });

  it("maps a strong majority with weak runner-up to the pure type (9/3/0)", () => {
    const r = scoreQuestionnaire(
      answersOf(["H", "H", "H", "H", "H", "H", "H", "H", "H", "S", "S", "S"])
    );
    expect(r.doshaKey).toBe("Khii");
  });

  it("maps first+second dominant to combined types", () => {
    // 6H 4S 2B → Хий-Шар
    const r = scoreQuestionnaire(
      answersOf(["H", "H", "H", "H", "H", "H", "S", "S", "S", "S", "B", "B"])
    );
    expect(r.doshaKey).toBe("Khii_Shar");
    expect(r.kt).toBe(0.8);
    expect(r.scores).toEqual({ H: 6, S: 4, B: 2 });
  });

  it("treats near-even splits (within ±1 across all three) as Тэнцвэртэй", () => {
    const r = scoreQuestionnaire(
      answersOf(["H", "H", "H", "H", "S", "S", "S", "S", "B", "B", "B", "B"])
    );
    expect(r.doshaKey).toBe("Tentsveertei");
    expect(r.kt).toBe(1.0);
  });

  it("documents the 5/4/3 edge: chained ±1 differences also count as balanced", () => {
    const r = scoreQuestionnaire(
      answersOf(["H", "H", "H", "H", "H", "S", "S", "S", "S", "B", "B", "B"])
    );
    expect(r.scores).toEqual({ H: 5, S: 4, B: 3 });
    expect(r.doshaKey).toBe("Tentsveertei");
  });

  it("tolerates partial answer sets (skipped questions are simply not counted)", () => {
    const r = scoreQuestionnaire({ 1: "B", 2: "B", 3: "B", 4: "B", 5: "H" });
    expect(r.scores).toEqual({ H: 1, S: 0, B: 4 });
    // runner-up (1) is below half of the leader (4) → pure Бадган
    expect(r.doshaKey).toBe("Badgan");
  });

  it("keeps combined types when the runner-up is at least half the leader (8/4/0)", () => {
    const r = scoreQuestionnaire(
      answersOf(["B", "B", "B", "B", "B", "B", "B", "B", "H", "H", "H", "H"])
    );
    expect(r.doshaKey).toBe("Badgan_Khii");
  });
});
