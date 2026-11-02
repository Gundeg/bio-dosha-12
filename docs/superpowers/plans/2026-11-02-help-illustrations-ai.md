# AI help illustrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 12 code-drawn SVG help illustrations with the 36 owner-approved AI frames, behind the unchanged `HelpIllustration` API, and commit the pipeline that made them.

**Architecture:** 36 WebP frames are static `next/image` imports collected in one registry (`frames.ts`). `HelpIllustration` renders either one frozen frame or three stacked frames that crossfade through a CSS keyframe defined once in `globals.css`; the dialog and the calculator side panel keep calling it as before. The махбод letter marks disappear from the dialog (small coloured dot instead), the SVG components are deleted, and `scripts/help-illustrations/` holds the Python pipeline and prompts.

**Tech Stack:** Next.js 16 (App Router, `next/image` static imports), React 19, TypeScript, Tailwind v4 (`globals.css`), next-intl, vitest (node env), Python 3 + Pillow + google-genai (pipeline only).

**Spec:** `docs/superpowers/specs/2026-11-02-help-illustrations-ai-design.md`

## Global Constraints

- Branch `feature/ai-help-illustrations`; one PR to `master`; no migration, no new app environment variable.
- Frames: `src/assets/help-illustrations/q{NN}-{h|s|b}.webp`, exactly 1200×800, WebP quality 82, centre-cropped to 3:2 before Lanczos resampling; sources are the 36 PNGs in `C:\Users\gunju\OneDrive\IT Projects\bio-dosha-12-assets\help-illustrations\final\` (`q1-h.png` … `q12-b.png`).
- `HelpIllustration({ questionId, variant?, className?, ariaLabel? })` keeps its signature; `QuestionHelpDialog.tsx` and `src/app/(app)/calculator/page.tsx:1273` keep calling it unchanged.
- Crossfade: 9 s loop; windows 0–30 % / 33–63 % / 66–96 % (fades between); `prefers-reduced-motion: reduce` shows the H frame; no JS timer, no per-instance `<style>`.
- No Х/Ш/Б letter anywhere in the help UI (chip, dialog rows, panels); no text inside images.
- Dark mode: no filter on the frames. Design system: no new colours, no new radius steps, `Icon` only.
- `GEMINI_API_KEY` stays in the git-ignored `.env.local`; never printed, never committed. The 2K sources are never committed.
- Tests: vitest, `node` environment, only under `src/**/__tests__/**/*.test.ts`. Commands: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.
- Code, comments and commit messages in English; `docs/help-illustrations.md` and the pipeline README in Mongolian (technical terms in Latin script).
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. A question id without frames (a 13th question added later) must render nothing, not crash: `getHelpFrames(99)` is `undefined` and `HelpIllustration` returns `null` (Task 2 test, Task 3 code).
2. A frame file that is missing or the wrong size must fail the test suite, not ship as a broken image: Task 1's test reads every file's WebP header from disk.
3. `next/image` with `fill` inside a parent with no explicit height collapses to 0 px; the root carries `aspect-[3/2]` and `relative`, checked visually in both dialog layouts and the side panel (Task 6).
4. Reduced motion: cycle mode must still show a picture (H), and tapping an outcome must still freeze it (Task 6 check with `reducedMotion: "reduce"`).
5. Locale without a label (a future `en` gap): the chip calls `t()` only for keys that exist in both message files today; the existing `questionHelp.test.ts` plus Task 2's registry test keep ids and keys aligned, and Task 6 screenshots `en` once.

---

### Task 1: Pipeline in the repo and the 36 exported frames

**Files:**
- Create: `scripts/help-illustrations/README.md`, `scripts/help-illustrations/run_jobs.py`, `scripts/help-illustrations/split_panels.py`, `scripts/help-illustrations/compose_inset.py`, `scripts/help-illustrations/export_frames.py`, `scripts/help-illustrations/jobs/*.json`
- Create: `src/assets/help-illustrations/q01-h.webp` … `q12-b.webp` (36 files)
- Test: `src/lib/__tests__/helpFrames.test.ts` (first `describe`)

**Interfaces:**
- Consumes: the sibling assets folder `C:\Users\gunju\OneDrive\IT Projects\bio-dosha-12-assets\help-illustrations\` (`final/`, `jobs/`, `pipeline/`, `MANIFEST.md`).
- Produces: the 36 WebP files, named `q{NN}-{h|s|b}.webp` with `NN` zero-padded (`q01-h.webp`), 1200×800. Later tasks import them by that name.

- [ ] **Step 1: Write the failing file test**

Create `src/lib/__tests__/helpFrames.test.ts` with a header parser and the file checks:

```ts
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
  if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  if (chunk === "VP8L") { const b = buf.readUInt32LE(21); return { width: 1 + (b & 0x3fff), height: 1 + ((b >>> 14) & 0x3fff) }; }
  if (chunk === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/__tests__/helpFrames.test.ts`
Expected: FAIL, the first `existsSync` assertion for `q01-h.webp`.

- [ ] **Step 3: Copy the pipeline scripts into `scripts/help-illustrations/`**

From the assets folder `pipeline/`: `run_jobs.py`, `split_panels.py`, `compose_inset2.py` (rename to `compose_inset.py`). Edit `run_jobs.py` so nothing points at a session folder: the generate script path comes from the env var `NANOBANANA_GENERATE` (default `~/.claude/skills/synced/7c581858-5e74-4335-adfd-74d02b97e266_d2094c1b-25ea-45f4-87b8-c4ce2c4a5c1c/nanobanana/scripts/generate.py` expanded with `Path.home()`), `.env.local` is found at the repo root (`Path(__file__).resolve().parents[2] / ".env.local"`), and a relative `input` in a job is resolved against `--inputs DIR` (default `.`). Keep the job schema `{name, prompt, ratio?, size?, input?, kept?, note?}` and the `OK`/`FAIL` line per job. English module docstrings on all four scripts.

- [ ] **Step 4: Copy the prompts into `scripts/help-illustrations/jobs/`**

From the assets folder `jobs/`: `q01.json` → `q01-wrist.json`, `jobs1.json` → `batch1-q02-q06.json`, `jobs2.json` → `batch2-q07-q12.json`, `jobs3.json` → `retry-q03-q06.json`, `jobs4.json` → `retry-q09-q12.json`, `jobs5.json` → `retry-q06.json`, `jobs6.json` → `fix-q11-q12.json`. Rewrite every `input` value to its basename (a short Python loop) so no scratchpad path remains: `grep -rn "AppData" scripts/help-illustrations/` prints nothing.

- [ ] **Step 5: Write `export_frames.py`**

Signature: `python scripts/help-illustrations/export_frames.py SRC_DIR OUT_DIR [--width 1200] [--height 800] [--quality 82]`. For `q in 1..12` and `s in h,s,b`: open `SRC_DIR/q{q}-{s}.png`, centre-crop to `width:height`, `resize((width, height), Image.LANCZOS)`, save `OUT_DIR/q{q:02d}-{s}.webp` with `quality=82, method=6`; print one line per file with the final size. Exit non-zero if a source is missing.

- [ ] **Step 6: Export the frames**

Run: `python -I scripts/help-illustrations/export_frames.py "C:/Users/gunju/OneDrive/IT Projects/bio-dosha-12-assets/help-illustrations/final" src/assets/help-illustrations`
Expected: 36 lines, each ending in `(1200, 800)`; `ls src/assets/help-illustrations | wc -l` prints 36; the largest file is under 150 KB (`du -ah src/assets/help-illustrations | sort -h | tail -3`).

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run src/lib/__tests__/helpFrames.test.ts`
Expected: PASS (1 test).

- [ ] **Step 8: Write `scripts/help-illustrations/README.md` (Mongolian)**

Sections, in this order: зорилго (what the set is, where the approved sources live outside the repo), урьдчилсан нөхцөл (`GEMINI_API_KEY` in `.env.local`, `pip install google-genai pillow`, the nanobanana skill script and `NANOBANANA_GENERATE`), дөрвөн алхам (`run_jobs.py` → `split_panels.py` or `compose_inset.py` → `export_frames.py` → `npm test`), асуулт бүрийн эх сурвалж (the table from the assets `MANIFEST.md`: method, job file, kept output, compose parameters for Q1 `--point 640,440 --inset 640,200,178` and Q3 `--point 590,465 --inset 520,172,155 --macro-cx 0.5 --src-r 50`), сургамж (the four lessons from the spec, section 4), and нэг зураг солих (regenerate one state, split or compose, export, run the test, swap the file; no code change).

- [ ] **Step 9: Lint and commit**

Run: `npm run lint` → Expected: no errors.

```bash
git add scripts/help-illustrations src/assets/help-illustrations src/lib/__tests__/helpFrames.test.ts
git commit -m "Add the AI help-illustration frames and their generation pipeline" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Frame registry

**Files:**
- Create: `src/components/help/illustrations/frames.ts`
- Test: `src/lib/__tests__/helpFrames.test.ts` (second `describe`)

**Interfaces:**
- Consumes: the 36 files from Task 1.
- Produces: `export type HelpFrameSet = Record<DominantType, StaticImageData>`, `export const HELP_FRAMES: Record<number, HelpFrameSet>`, `export function getHelpFrames(questionId: number): HelpFrameSet | undefined`.

- [ ] **Step 1: Write the failing registry test**

Append to `helpFrames.test.ts`:

```ts
import { HELP_FRAMES, getHelpFrames } from "@/components/help/illustrations/frames";

describe("HELP_FRAMES", () => {
  it("covers every questionnaire question and nothing else", () => {
    const ids = QUESTIONNAIRE.map((q) => q.id).sort((a, b) => a - b);
    expect(Object.keys(HELP_FRAMES).map(Number).sort((a, b) => a - b)).toEqual(ids);
  });
  it("has H, S and B for every question, each pointing at that question's file", () => {
    for (const q of QUESTIONNAIRE) {
      expect(Object.keys(HELP_FRAMES[q.id]).sort()).toEqual(["B", "H", "S"]);
      for (const d of DOSHAS) {
        const frame = HELP_FRAMES[q.id][d] as unknown;
        const src = typeof frame === "string" ? frame : (frame as { src: string }).src;
        expect(src).toContain(frameFile(q.id, d).replace(".webp", ""));
      }
    }
  });
  it("returns undefined for a question without frames", () => {
    expect(getHelpFrames(99)).toBeUndefined();
  });
});
```

(In vitest, Vite resolves a `.webp` import to a URL string; in Next it is a `StaticImageData`. The test accepts both.)

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/__tests__/helpFrames.test.ts`
Expected: FAIL, cannot resolve `@/components/help/illustrations/frames`.

- [ ] **Step 3: Write `frames.ts`**

`import type { StaticImageData } from "next/image"`, `import type { DominantType } from "@/lib/questionnaireEngine"`, then 36 literal imports `import q01h from "@/assets/help-illustrations/q01-h.webp";` … `q12b`, the `HelpFrameSet` type, `HELP_FRAMES` with keys `1`–`12`, and `getHelpFrames`. One JSDoc line: frames are owner-approved; regenerate with `scripts/help-illustrations/README.md`.

- [ ] **Step 4: Run the tests and the type check**

Run: `npx vitest run src/lib/__tests__/helpFrames.test.ts && npx tsc --noEmit`
Expected: PASS (4 tests); tsc prints nothing.

- [ ] **Step 5: Commit**

```bash
git add src/components/help/illustrations/frames.ts src/lib/__tests__/helpFrames.test.ts
git commit -m "Add the help-illustration frame registry" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: `HelpIllustration` on images, CSS crossfade, SVGs removed

**Files:**
- Modify: `src/components/help/illustrations/index.tsx` (rewrite)
- Modify: `src/app/globals.css` (append after the `@layer base` block, before `@utility shadow-ambient`)
- Delete: `src/components/help/illustrations/Q01BoneWrist.tsx` … `Q12DailyRhythm.tsx` (12 files) and `shared.tsx`

**Interfaces:**
- Consumes: `getHelpFrames` from Task 2; `useTranslations("questionHelp")` keys `q{N}.ariaLabel` and `q{N}.outcomes.{H|S|B}.label` (both locales already have them).
- Produces: `export interface HelpIllustrationProps { questionId: number; variant?: DominantType; className?: string; ariaLabel?: string; sizes?: string }` and `export function HelpIllustration(props: HelpIllustrationProps): JSX.Element | null`. `HELP_ILLUSTRATIONS` and `HelpIllustrationComponent` are no longer exported (grep confirms only `index.tsx` and the deleted files used them).

- [ ] **Step 1: Delete the SVG components**

```bash
git rm src/components/help/illustrations/Q*.tsx src/components/help/illustrations/shared.tsx
```

- [ ] **Step 2: Rewrite `index.tsx`**

Root element: `<div role="img" aria-label={label} data-variant={variant ?? "cycle"} className={cn("help-frames relative aspect-[3/2] w-full overflow-hidden", className)}>`. `label` = `ariaLabel ?? (t.has(key) ? t(key) : undefined)` as today. `states` = `variant ? [variant] : ["H", "S", "B"]`. Each state renders `<div key={v} className="help-frame absolute inset-0">` containing `<Image src={frames[v]} alt="" fill sizes={sizes} className="object-cover" />` and, only when `variant` is undefined, the chip `<span className="absolute bottom-2 left-2 max-w-[80%] truncate rounded-md bg-surface-container-lowest/85 px-2 py-0.5 text-xs font-medium text-on-surface">{t(`q${questionId}.outcomes.${v}.label`)}</span>`. `sizes` defaults to `"(min-width: 640px) 320px, 100vw"`. Return `null` when `getHelpFrames(questionId)` is undefined. No letter, no `DoshaMark`.

- [ ] **Step 3: Add the crossfade CSS to `globals.css`**

```css
/* Help illustrations: Х→Ш→Б crossfade, 9 s loop, 3 s per state (docs/help-illustrations.md). */
@layer components {
  .help-frames .help-frame { opacity: 0; }
  .help-frames:not([data-variant="cycle"]) .help-frame { opacity: 1; }
  .help-frames[data-variant="cycle"] .help-frame:nth-child(1) { animation: help-ph1 9s linear infinite; }
  .help-frames[data-variant="cycle"] .help-frame:nth-child(2) { animation: help-ph2 9s linear infinite; }
  .help-frames[data-variant="cycle"] .help-frame:nth-child(3) { animation: help-ph3 9s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .help-frames[data-variant="cycle"] .help-frame { animation: none; }
    .help-frames[data-variant="cycle"] .help-frame:nth-child(1) { opacity: 1; }
  }
}
@keyframes help-ph1 { 0%, 30% { opacity: 1; } 36%, 94% { opacity: 0; } 100% { opacity: 1; } }
@keyframes help-ph2 { 0%, 27% { opacity: 0; } 33%, 63% { opacity: 1; } 69%, 100% { opacity: 0; } }
@keyframes help-ph3 { 0%, 60% { opacity: 0; } 66%, 96% { opacity: 1; } 100% { opacity: 0; } }
```

- [ ] **Step 4: Type check, lint, tests**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: tsc silent; lint clean; all tests pass (the deleted files have no tests).

- [ ] **Step 5: Commit**

```bash
git add -A src/components/help/illustrations src/app/globals.css
git commit -m "Render the help illustrations from the AI frames with a CSS crossfade" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: No махбод letters in the dialog; shared dot marker

**Files:**
- Modify: `src/lib/doshaUi.ts` (add `DOSHA_FILL`)
- Modify: `src/components/kit/status.tsx` (add `Dot`), `src/components/kit/index.ts` (export it)
- Modify: `src/components/help/QuestionHelpDialog.tsx` (remove `DoshaMark`, use `Dot`)
- Modify: `src/app/(app)/calculator/page.tsx:85-89` and `:149-151` (delete the local `DOSHA_FILL` and `Dot`, import the shared ones)

**Interfaces:**
- Produces: `export const DOSHA_FILL: Record<DominantType, string> = { H: "bg-primary", S: "bg-secondary", B: "bg-tertiary" }` in `doshaUi.ts`; `export function Dot({ fill, className }: { fill: string; className?: string })` in `kit/status.tsx` rendering `<span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", fill, className)} />`.

- [ ] **Step 1: Move `DOSHA_FILL` and `Dot` to their shared homes**

Add them as specified; export `Dot` from `kit/index.ts`. In the calculator page delete lines 85–89 and 149–151, add `DOSHA_FILL` to the existing `@/lib/doshaUi` import and `Dot` to the existing `@/components/kit/status` import. Behaviour of the side panel and the progress bars is unchanged.

- [ ] **Step 2: Replace the letter marks in `QuestionHelpDialog.tsx`**

Delete the `DoshaMark` function and the `DOSHA_BG`/`DOSHA_COLOR` import; import `DOSHA_FILL` from `@/lib/doshaUi` and `Dot` from `@/components/kit/status`. Desktop panel (lines 88–99): `<Dot fill={DOSHA_FILL[opt.value]} className="mt-1.5" />` in place of `<DoshaMark …/>`, and delete the `<span className="sr-only">{doshaName}: </span>`. Phone rows (lines 149–158): same replacement, same `sr-only` removal. Remove the now unused `doshaName` and `tShared`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test && grep -rn "DoshaMark\|dosha3" src/components/help`
Expected: tsc silent, lint clean, tests pass, grep prints nothing.

- [ ] **Step 4: Commit**

```bash
git add src/lib/doshaUi.ts src/components/kit/status.tsx src/components/kit/index.ts src/components/help/QuestionHelpDialog.tsx "src/app/(app)/calculator/page.tsx"
git commit -m "Show outcomes without the махбод letters in the help dialog" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Documentation and lessons

**Files:**
- Modify: `docs/help-illustrations.md` (rewrite, Mongolian)
- Modify: `docs/design-system.md:36` (one bullet after the emoji rule)
- Modify: `README.md:124` (keep the link; fix the sentence if it still says the pictures are SVG)
- Modify: `lessons.md` (append one entry)

- [ ] **Step 1: Rewrite `docs/help-illustrations.md`**

Keep the title and the first paragraph's purpose, then these sections: Файлын бүтэц (table: `src/assets/help-illustrations/q{NN}-{h|s|b}.webp`, `frames.ts`, `index.tsx`, `globals.css` crossfade block, `scripts/help-illustrations/`, `helpFrames.test.ts`), Зургийн гэрээ (3:2, 1200×800 WebP, one flat style, one character, no text, the teal ring only in Q1 and Q3, light background kept in dark mode), Компонентын гэрээ (the props, `data-variant`, cycle vs frozen, chip only in cycle mode, reduced motion shows H, no махбод letters by the owner's decision of 2026-11-02), Танилцуулга (the two dialog layouts and the side panel, unchanged), Нэг зураг солих (points to the pipeline README). Remove every mention of `viewBox`, `PhaseBadge`, `phaseCss`, `SKIN`, `INK`, `qa-one.ts`.

- [ ] **Step 2: Add the design-system bullet and check the README sentence**

`docs/design-system.md` after line 36: `- Illustrations are the approved image set described in docs/help-illustrations.md; never redraw, recolour or filter them per page.` In `README.md:124` make the sentence say the help pictures are an image set (it is one line; keep the link).

- [ ] **Step 3: Append the lesson**

In `lessons.md`, a `## 2026-11-02 — Instructional pictures are checked as the person will use them` entry with: Rule: a how-to picture shows the gesture exactly as performed (whole hand, wrist held like a bracelet), the three outcomes must differ at panel size (220 px), callouts never cover the subject, and the махбод letters are never shown to the person answering. Why: the owner rejected the code-drawn set, then the first AI Q1 twice (read as pulse-taking; magnifier covered the hand; the forearm looked like a stick) and asked to drop the Х/Ш/Б letters. How to apply: render a candidate set at panel size in the real layout and ask whether a stranger would perform the test correctly; keep scoring categories out of copy and images.

- [ ] **Step 4: Commit**

```bash
git add docs/help-illustrations.md docs/design-system.md README.md lessons.md
git commit -m "Document the AI help-illustration set and record the lesson" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Visual verification, build, PR text

**Files:**
- Create then delete (never committed): `src/app/invite/help-preview/page.tsx`
- Output: screenshots in `.playwright-mcp/` (git-ignored); the PR description text in the final summary

There is no local database, so `/calculator` cannot be opened in `next dev`. `/invite/*` is a public prefix in `src/proxy.ts`, so a temporary client page there renders the real components without sign-in.

- [ ] **Step 1: Create the temporary preview page**

`src/app/invite/help-preview/page.tsx`, a `"use client"` page that renders, for `QUESTIONNAIRE[0]` and `QUESTIONNAIRE[4]`: the `QuestionHelpButton` (so the dialog can be opened) and, below, `<HelpIllustration questionId={id} className="h-auto w-full" />` in a 280 px wide box (the side-panel case) and `<HelpIllustration questionId={id} variant="S" />` in a 220 px box (the frozen case). Return `notFound()` when `process.env.NODE_ENV === "production"`.

- [ ] **Step 2: Start the dev server and screenshot**

Run: `npm run dev -- --port 3100` (background). With Playwright (the `playwright` MCP tools): open `http://localhost:3100/invite/help-preview` at 1440×900, click the first "Хэрхэн тодорхойлох вэ?", screenshot `.playwright-mcp/help-dialog-1440.png`; resize to 390×844, reopen the dialog, screenshot `.playwright-mcp/help-dialog-390.png`, tap the second outcome row, screenshot `help-dialog-390-frozen.png`, click "Автомат"; close the dialog and screenshot the 280 px cycle box at 0.5 s and 4 s (`help-panel-cycle-*.png`); add `class="dark"` on `<html>` via `page.evaluate` and screenshot once (`help-dialog-dark.png`); emulate `prefers-reduced-motion: reduce` (new context) and screenshot the cycle box (`help-panel-reduced.png`); switch the locale to `en` the way the app does (see how `src/i18n/request.ts` reads it) and screenshot the dialog once (`help-dialog-en.png`).
Expected, by eye and by the saved files: three distinct frames crossfading, no 0-height boxes, chip label visible only in cycle mode, no Х/Ш/Б letters anywhere, frames light on dark panels, reduced motion shows the first frame, English labels in `en`.

- [ ] **Step 3: Remove the preview page and confirm nothing of it remains**

Run: `rm -r src/app/invite/help-preview && git status --short`
Expected: no `invite/help-preview` entry; only intended files.

- [ ] **Step 4: Full check**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean; the build lists no warning about the frames.

- [ ] **Step 5: Write the PR text (do not open the PR unless the owner asks)**

Save it to `docs/superpowers/plans/2026-11-02-help-illustrations-ai.pr.md` (uncommitted, for the owner to paste): title `Replace the help illustrations with the approved AI image set`; body with the 12 questions and their scenes, the three screenshots, "no migration, no environment variable", the post-merge checklist from the spec (section 5, owner's visual check; Claude reads `commit_ref` and the ≥ 500 logs; rollback = republish the previous deploy), a request to forward the gallery to Оточ, and the attribution line `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 6: Report**

Give the owner: the per-task commit list on `feature/ai-help-illustrations`, the screenshot paths, the frame count and total size, and the two things that remain theirs (open/merge the PR; the production check).
