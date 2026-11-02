import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { QUESTIONNAIRE, type DominantType } from "../questionnaireEngine";

const DOSHAS: DominantType[] = ["H", "S", "B"];
const DIR = join(process.cwd(), "src", "assets", "help-illustrations");
export const frameFile = (id: number, d: DominantType) =>
  `q${String(id).padStart(2, "0")}-${d.toLowerCase()}.webp`;

/** Width/height from a WebP header: simple (VP8 ), lossless (VP8L) or extended (VP8X). */
function webpSize(buf: Buffer): { width: number; height: number } {
  expect(buf.toString("ascii", 0, 4)).toBe("RIFF");
  expect(buf.toString("ascii", 8, 12)).toBe("WEBP");
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const b = buf.readUInt32LE(21);
    return { width: 1 + (b & 0x3fff), height: 1 + ((b >>> 14) & 0x3fff) };
  }
  if (chunk === "VP8X") {
    return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  }
  throw new Error(`unknown WebP chunk ${chunk}`);
}

describe("help illustration files", () => {
  it("has a 1200x800 WebP for every question and outcome", () => {
    for (const q of QUESTIONNAIRE) {
      for (const d of DOSHAS) {
        const path = join(DIR, frameFile(q.id, d));
        expect(existsSync(path), path).toBe(true);
        expect(webpSize(readFileSync(path))).toEqual({ width: 1200, height: 800 });
      }
    }
  });
});
