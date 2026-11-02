# Help illustrations: replace the code-drawn SVGs with an AI-generated image set

Date: 2026-11-02 · Status: approved by the owner on 2026-11-02 · Branch: `feature/ai-help-illustrations`

## Intent

Each of the 12 questionnaire questions has a "Хэрхэн тодорхойлох вэ?" help dialog
and (on `xl` screens) a side panel that show how to check the trait, with one
picture per outcome (Х / Ш / Б). Today those pictures are SVGs drawn by hand in
code (`src/components/help/illustrations/Q01…Q12*.tsx`). The owner judged them
ugly, not accurate and not clear: hands and faces drawn as paths look amateurish,
the three outcomes often differ by a tiny cue, and some metaphors do not explain.

On 2026-11-02 the owner reviewed and approved a complete replacement set of 36
AI-generated frames (Nano Banana Pro, one consistent flat style, one recurring
character). This document describes how that set goes into the app. The images
are the deliverable; the code change is a swap of the picture source behind an
existing component contract.

## Goals

- Every question shows the approved frames, three per question, in the existing
  dialog (3 frozen panels on `sm+`, one cycling picture with tap-to-freeze on
  phones) and in the `xl` side panel (cycling).
- The Х→Ш→Б cycle keeps its rhythm (9 s loop, 3 s per state) but becomes a soft
  crossfade between frames instead of SVG keyframes.
- Reduced motion, dark mode, keyboard and screen-reader behaviour are no worse
  than today.
- The generation pipeline (prompts, runner, splitter, compositor, exporter) is in
  the repo so a frame can be regenerated when the clinic asks for a change.
- The old SVG components and their contract leave the codebase and the docs.

## Non-goals

- No new help content: titles, instructions, outcome labels and aria-labels in
  `messages/*/help.json` and `src/lib/questionHelp.ts` stay as they are.
- No change to the dialog's layout, the trigger button, the side panel or the
  calculator flow, apart from the махбод letter marks described in Decision 2.
- No per-image animation beyond the crossfade (no Ken Burns, no Lottie).
- No change to the BEDI formula, the questionnaire or its scoring.

## Anti-goals (would make this a failure even if it works)

- A frame set that looks like 12 different styles. The approved frames share one
  look; nothing in the app may recolour, outline or filter them per page.
- Text baked into images. Labels stay in HTML so both locales keep working.
- Shipping without checking the result where people use it (production after the
  merge, at 1440 px and 390 px; see `lessons.md` 2026-10-28).
- A large repository: the 2K three-panel sources (2–4 MB each) are not committed.

## Constraints

- Frame aspect ratio 3:2 (the slot the current SVG viewBox 240×160 defines).
- Display sizes: about 210 px wide per panel in the desktop dialog, up to about
  600 px in the phone dialog, about 280 px in the side panel. Frames are
  exported at 1200×800.
- The design system (`docs/design-system.md`): calm, one accent, no decoration
  for its own sake. The teal highlight ring (#00626b) baked into the Q1 and Q3
  frames is the only accent inside the images; the app adds none.
- `next/image` is already used in the app (`MfaSetupWizard.tsx`) and Netlify's
  Next plugin 5.15 serves its optimizer, so it is the delivery mechanism.
- Tests run in vitest with the `node` environment and only under
  `src/**/__tests__/**/*.test.ts`; there is no component test harness.
- Generation needs `GEMINI_API_KEY` in `.env.local` (git-ignored) and the Python
  packages `google-genai` and `pillow`. The key never enters the repo or the chat.

## Decisions

### 1. Assets

- Final frames live at `src/assets/help-illustrations/q{NN}-{h|s|b}.webp`
  (`q01-h.webp` … `q12-b.webp`), 1200×800, WebP quality 82, exported from the
  approved composites: centre-crop to 3:2 first (the Q1 and Q3 composites are
  1264×848, about 3 px are lost), then Lanczos resampling (the Q4 source is
  1164 px wide and is upscaled 3 %, accepted).
- The approved composites are exactly the 36 files in
  `OneDrive/IT Projects/bio-dosha-12-assets/help-illustrations/final/`
  (`q1-*.png` there is the owner-approved V1 top-down set; the rejected Q1
  candidates are under `sources/rejected-q1/`).
- They are imported statically so Next knows width and height, hashes the URL
  and can build a blur placeholder. A registry module
  `src/components/help/illustrations/frames.ts` exports
  `HELP_FRAMES: Record<number, Record<DominantType, StaticImageData>>` with the
  36 literal imports.
- The approved composites (PNG) and the 2K three-panel sources stay outside the
  repo. The builder copies them from the scratchpad to
  `OneDrive/IT Projects/bio-dosha-12-assets/help-illustrations/` (a sibling of
  the repo, not inside it) so they survive the session; the scratchpad
  `MANIFEST.md` goes with them.

### 2. Component contract (unchanged API, new implementation)

`HelpIllustration({ questionId, variant?, className?, ariaLabel? })` in
`src/components/help/illustrations/index.tsx` keeps its signature, so
`QuestionHelpDialog.tsx` and the calculator side panel do not change.

New rendering:

- Root: `<div role="img" aria-label=…>` with `aspect-ratio: 3/2`, `relative`,
  `overflow-hidden`, `data-variant={variant ?? "cycle"}`, class `help-frames`
  plus the caller's `className`. It replaces the old `<svg>` one for one, so
  the callers' rounded containers keep working.
- In cycle mode (`variant` undefined): three children `div.help-frame`
  (absolute, inset 0), one per state in the order H, S, B, each holding
  `<Image alt="" fill sizes=… />` and a small caption chip at the bottom left
  with the outcome's short label from `questionHelp.q{N}.outcomes.{V}.label`
  on a translucent surface. No Х/Ш/Б letter anywhere: the owner decided on
  2026-11-02 that the махбод letters must not be shown to the person
  answering; the score is counted in the background.
- In frozen mode (`variant` set): only that one frame is mounted, with no chip,
  because the caller already shows the label (desktop panels, the pressed row
  on phones). A desktop dialog therefore loads three images, not nine. The
  phone dialog toggling between the two modes re-mounts the same cached URL,
  which is acceptable. `placeholder="blur"` is optional (builder's call).
- The crossfade is CSS, defined once in `src/app/globals.css` under
  `@layer components`, with no per-instance `<style>` and no JS timer:
  - `[data-variant="cycle"] .help-frame:nth-child(1|2|3)` get
    `animation: help-ph1|2|3 9s linear infinite` with opacity keyframes that
    show each frame for about 3 s with about 0.6 s fades (the same windows as
    the old `phaseCss`: 0–30 %, 33–63 %, 66–96 %).
  - `[data-variant="H"|"S"|"B"]` sets `animation: none` on all frames and
    opacity 1 on the matching one.
  - `@media (prefers-reduced-motion: reduce)`: no animation; in cycle mode the H
    frame is shown (users can tap outcomes to see the others, as today).
- `sizes` defaults to `(min-width: 640px) 320px, 100vw`; callers may override.
- For the same reason the dialog's `DoshaMark` letter circles (desktop panels
  and phone rows in `QuestionHelpDialog.tsx`) are replaced by the small
  coloured dot the `xl` side panel already uses for the same outcomes
  (`Dot` with `DOSHA_FILL` in the calculator page, moved to a shared place so
  both import it), and `DoshaMark` is deleted. The `sr-only` махбод name that
  precedes each label is removed as well. The tinted panel backgrounds and the
  row highlight stay.
- Images keep next/image's lazy loading. Nothing is preloaded.
- Dark mode: the frames keep their light #eff3f3 background and read as light
  cards on dark panels. No filter is applied.

### 3. Removal

- Delete `Q01BoneWrist.tsx` … `Q12DailyRhythm.tsx` and `shared.tsx`. Nothing
  outside the folder imports them (checked 2026-11-02).
- `docs/help-illustrations.md` is rewritten (in Mongolian, like today) to
  describe the image set, the component contract above and the regeneration
  pipeline. `docs/design-system.md` gets one line under Icons pointing to it.

### 4. Pipeline in the repo

`scripts/help-illustrations/` (Python, English comments; README in Mongolian):

- `run_jobs.py` runs a JSON list of generation jobs in parallel through the
  Nano Banana `generate.py` script whose path comes from `NANOBANANA_GENERATE`
  (default: the installed skill path), reading `GEMINI_API_KEY` from
  `.env.local` without printing it.
- `split_panels.py` splits a stacked three-panel image into three 3:2 frames
  (gaps are the brightest uniform rows near the thirds; frame trimming is
  capped at 5 %).
- `compose_inset.py` composes a base scene with a circular magnifier inset cut
  from a three-panel macro, with the teal ring and leader line (Q1 and Q3).
- `export_frames.py` converts PNG composites to 1200×800 WebP q82 in
  `src/assets/help-illustrations/`.
- `jobs/*.json` holds the exact prompts that produced the approved frames:
  copy them from `bio-dosha-12-assets/help-illustrations/jobs/` (`q01.json` for
  the Q1 base and macro, `jobs1.json` for Q2–Q6 including the Q3 base and
  macro, `jobs2.json` for Q7–Q12, `jobs3–6.json` for the retries and the
  "redraw the bottom panel crisp" fixes). `MANIFEST.md` in that folder says
  which output was kept for each question; the README repeats that table.
- README: prerequisites, the four steps, and the lessons (subtle finger
  positions need a macro inset; the bottom panel of a stacked image is often
  blurred and an edit pass fixes it; a style-reference image can corrupt a
  simple hand scene, so those are generated from text alone).

### 5. Tests and verification

- New `src/lib/__tests__/helpFrames.test.ts`: every question id in
  `QUESTIONNAIRE` has H, S and B entries in `HELP_FRAMES`, and the 36 files in
  `src/assets/help-illustrations/` exist and are 1200×800 (read the WebP
  header from disk; vitest resolves image imports to plain strings, so
  `StaticImageData` is not available in the node test environment).
- The existing `questionHelp.test.ts` stays.
- Manual, before the PR: `npx tsc --noEmit`, `npm test`, `npm run build`; then
  in `next dev` screenshot the dialog at 1440 px (3 panels), at 390 px (cycle,
  tap to freeze, "Автомат"), and the side panel at 1280 px or wider, in light
  and dark mode; confirm the frames crossfade and freeze; confirm reduced
  motion shows H.
- After the merge (owner's decision 2026-11-02): the owner does the visual
  check on production with a checklist the builder writes into the PR
  description (sign in, open the help dialog of Q1 and Q5 at desktop width and
  in a phone-sized window, confirm crossfade, tap-to-freeze and "Автомат",
  check the `xl` side panel). Claude's part is read-only: confirm the live
  deploy's `commit_ref` through the Netlify connector, read the function logs
  for status ≥ 500 after the deploy, and state the rollback (republish the
  previous deploy from the Netlify Deploys page). Deploy previews cannot sign
  in, so nothing is claimed as live before this.

### 6. Rollout

- Work on `feature/ai-help-illustrations`; one PR to `master`.
- No migration and no new environment variable for the app. `GEMINI_API_KEY`
  is only for the generation pipeline on a developer machine.
- The PR description lists the 12 questions, carries the post-merge checklist
  above, and asks the owner to forward the gallery screenshot to Оточ for the
  medical read; a frame that needs a change is regenerated with the pipeline
  and swapped without touching code.
- The PR adds no migration and no environment variable, so the merge needs no
  preparation step (see `lessons.md` 2026-10-28 on migrations).

## Left to the builder

- Exact keyframe percentages and easing within the windows above.
- Where the shared `Dot` marker lives (`src/components/help/` or
  `src/components/kit/`) and the chip's exact padding and opacity.
- WebP quality between 78 and 85 if 82 shows banding on the flat backgrounds.
- File layout inside `scripts/help-illustrations/` and the README's wording.
- How `frames.ts` is written (36 literal imports is acceptable; a generator is
  not required).

## Open for the owner (not blocking)

- Оточ's medical read of the 36 frames. Any frame can be replaced later without
  a code change.
