# BEDI field in 3D: bring the approved prototype into the app, without the demo clutter

Date: 2026-11-02 · Status: owner said "start" (questions skipped); decisions below are the builder's · Branch: `feature/bedi-field-3d`

## Intent

For the 2026-10-30 meeting a three.js prototype ("Махбодын талбар 3D", claude.ai artifact
14436b21-6040-4caa-8498-2788424099a5) showed the person's constitution as a pin on the
ternary махбод field, the current state as a ball in a basin, and earlier measurements
as a trail. The owner liked the look but finds the current ideas cluttered, and wants
the 3D picture in the app. The prototype's clutter is its demo side panel (steppers,
presets, Δ slider, symptom checkboxes, w_b and θ sliders, a live formula table, ten zone
buttons, a four-item legend) and its corner gauges, all of which exist to explore
Option C (three indices), which Оточ has not approved.

## Goals

- One calm 3D scene on the calculator result and on the dashboard, replacing the radar
  chart in those two places: the field with its ten zones, the constitution pin, the
  current ball, the arc between them, the trail of earlier measurements, drag to rotate,
  two view buttons (top / side).
- Only approved quantities drive it: `doshaType` (constitution zone), `deviation` Δ and
  `status` from `bediEngine`, and the stored `BEDIRecord` history (date, Δ, status).
- The BEDI formula, thresholds and the questionnaire mapping are untouched
  (`lessons.md` 2026-10-23). The ball's displacement is a *display rule*, the same one
  `DoshaRadar` already uses (`applyDeviation`): Хий excess moves toward the Хий corner;
  Шар/Бадган excess moves toward whichever of Шар or Бадган the constitution favours;
  the amount grows with |Δ| and is capped.
- Theme tokens, `Icon`, `Section`, `StatusBadge` from the kit; no new colours.
- Three.js is loaded only when the scene is on screen (`next/dynamic`, `ssr: false`);
  when WebGL is unavailable the existing `DoshaRadar` renders instead.
- Reduced motion: no eased camera, no bead animation; the scene still renders.

## Non-goals / anti-goals

- No Option C indices, symptoms, weights or θ anywhere in the app.
- No raw questionnaire scores: the app stores only `doshaType`; the pin sits at the
  zone's representative lattice point (the same point the prototype's zone buttons use).
- No auto-rotation, no decorative particles, no text baked into the canvas except the
  zone names (painted on the field texture so they turn with it, as in the prototype).
- Do not delete `DoshaRadar`: it is the fallback and the history page may still use it.

## Decisions

1. **Geometry module `src/lib/bediField.ts`** (pure, tested): the 91-point lattice of
   (H,S,B) with sum 12, each point's zone through the real `mapToDoshaKey` (exported from
   `questionnaireEngine.ts`, body unchanged), zone centres and representative points,
   barycentric → 2D → world mapping (triangle width 6 world units), `displaceForDeviation`
   mirroring `DoshaRadar.applyDeviation`, `nearestZone(point)`, and `fieldSummary(...)`
   producing the aria text.
2. **Scene `src/components/bedi/BediFieldScene.tsx`** (client, imports `three`): the
   sunken field texture with zones and names, the pin, the ball coloured by status
   (`khii_excess` primary teal, `balanced` emerald, `shar_badgan_excess` amber, matching
   `DoshaRadar`), the arc, the trail (oldest faintest, date tags), a floor shadow, HTML
   tags positioned by projection, custom orbit (drag, arrow keys, wheel), top/side buttons.
   The basin depth is `min(1, |Δ|)` toward the displaced direction; balanced → flat.
   Colours are read from CSS variables so the theme stays the source of truth.
3. **Wrapper `src/components/bedi/BediField.tsx`**: `next/dynamic` of the scene with a
   placeholder of the same aspect ratio (16/11); props
   `{ doshaKey, deviation, status, history?: { date: string | Date; deviation: number; status: BEDIStatus }[], className? }`;
   renders `DoshaRadar` when the scene reports no WebGL.
4. **Integration**: `src/app/(app)/calculator/page.tsx` result section and
   `src/app/(app)/dashboard/page.tsx` balance section swap `DoshaRadar` for `BediField`;
   the dashboard passes the last seven records (oldest first, the latest excluded because
   it is the ball); the calculator passes the profile's stored records if the page has
   them, else none.
5. **Copy**: new namespace keys under `shared.field3d` in `messages/{mn,en}/shared.json`
   (hint, view buttons, pin/now/trail labels, no-WebGL text, aria summary parts). The
   section titles/legends in `calculator.json` and `dashboard.json` are updated to describe
   the field (two strings each).
6. **Tests**: `src/lib/__tests__/bediField.test.ts` (lattice complete and unique; every zone
   has a centre; displacement rule equals the radar's for the same inputs; displaced points
   stay inside the triangle; summary mentions zone, Δ and status). The scene is checked
   visually (Playwright on a temporary public preview page, deleted before commit) at
   1440 and 390 px, with drag and reduced motion, plus `tsc`, `lint`, `npm test`,
   `npm run build` and a bundle check that `three` is not in the calculator's first-load JS.

## Left to the builder

Exact camera defaults, texture resolution, lattice hexagon radius, tag offsets, and the
easing constant; whether the trail shows at most seven or all records.
