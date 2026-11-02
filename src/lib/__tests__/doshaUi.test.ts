import { describe, expect, it } from "vitest";
import { DOSHA_FILL } from "../doshaUi";

describe("DOSHA_FILL", () => {
  it("maps each constitution to its fill utility, matching DOSHA_COLOR", () => {
    expect(DOSHA_FILL).toEqual({ H: "bg-primary", S: "bg-secondary", B: "bg-tertiary" });
  });
});
