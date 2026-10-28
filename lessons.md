# Lessons

## 2026-10-23 — The BEDI formula is owner-controlled (updated 2026-10-26)

- **Rule:** Never change the BEDI index, the deviation (Δ), the status thresholds,
  the season / sex / cultural / Kt coefficients, or the questionnaire-to-Kt mapping
  without written approval from the owner (Tb otoch). This includes "recalibrating",
  "fixing unreachable states", or adding new constants around the formula.
- **Source of truth:** the first web build, commit 25e015a, confirmed by the owner on
  2026-10-26:
  BEDI = (W · Kg · Ks · Kc) / (H · Age · Kt), Kg male 1.1 / female 1.0,
  Ks winter 2.0 / spring 1.5 / summer 1.0 / autumn 1.3, Δ = BEDI − 1,
  Δ < −0.3 Хий арвидсан, Δ > +0.3 Шар/Бадган арвидсан, otherwise Тэнцвэртэй.
  The V6.4.1 Excel in `OneDrive/Growth Mastery Consulting/BioDosha_System/` uses a
  different band (BEDI 0.8–1.2) and autumn 1.5; the owner chose the web values.
  `src/lib/__tests__/bediEngine.test.ts` locks these values.
- **Why:** commit cb1c2a4 (2026-07-06) replaced the deviation with a BMI-based model
  that ignored age and sex and cited the clinic's study for it. The study does not
  use that model, and the owner did not approve it.
- **How to apply:** if the formula looks wrong or produces odd results, write up the
  evidence with worked examples and stop. Offer the options; let the owner decide.
  Do not pick between documented sources (Excel vs. first build) on the owner's behalf.

## 2026-10-28 — Work is not "done" until it is live and checked where people use it

- **Rule:** When the owner or a tester reports a problem, first find out which commit
  production runs (Netlify deploy `commit_ref`) and read the production function logs
  (Netlify observability, status ≥ 500). Fix the root cause shown there, then say
  plainly which fixes are live and which still wait for a merge and deploy.
- **Rule:** In route files, never read an export of an async module at module load
  (`export const { GET, POST } = handlers`). Export functions that read it per request.
  Prisma/pg make `@/lib/auth` an async module under Turbopack, and on Netlify a cold
  instance can evaluate the route before it finishes; the instance then answers 500
  for every sign-out and session check.
- **Rule:** A health app ends idle sessions (30 minutes, sliding) and must let a shared
  computer switch accounts from /login. Sign-out shows an error when it fails; it never
  fails silently.
- **Why:** on 2026-10-28 the owner (Tb otoch) tested production for two days. Production
  still ran the 2026-10-26 master build, so none of the finished work was live, sign-out
  returned 500 on broken instances (sessions also lasted 30 days), and a second account
  could not sign in on the same computer. The user called the result an "engineering
  experiment" and asked for a complete, professional app.
- **How to apply:** before reporting a feature as finished, check it in a production
  build against the same flows the owner will use, and list what still needs a deploy.

## 2026-10-28 — Every screen follows one design system; look at it before calling it done

- **Rule:** Build screens only from the shared pieces in `docs/design-system.md`
  (`ui/*`, `kit/*`, `states`, `<Icon name>`). Do not restyle a button, input, dialog
  title, tab strip or status colour on one page; change the shared component instead.
- **Rule:** Each view has one filled primary action, and each action appears in one place.
  Secondary actions go in the account menu, an outline/ghost button, or a quiet icon.
- **Rule:** Before reporting UI work as finished, screenshot every touched page at 1440px
  and 390px and check: icons sit next to their text, corners and heights match the scale,
  the same thing (status, separator, picker) looks the same on every page, and no page
  starts at a different left edge.
- **Why:** on 2026-10-28 the owner sent a screenshot of the sign-in page: misaligned icons,
  mixed round and sharp corners, mixed sizes, thick icon strokes, and a navigation row of
  equal buttons. Pages had been styled one by one, so they read as a collection, not an app.
- **How to apply:** for new UI, start from the kit; when a page needs something the kit
  lacks, add it to the kit and the doc first. Parallel agents get the doc as their brief,
  and the lead reviews their pages in the browser, not only their reports.

## 2026-10-28 — A PR with a migration is merged only after the migration runs

- **Rule:** Whenever I tell the owner to merge a PR, I first list what production needs
  before that merge: database migrations (`npx prisma migrate deploy`), new environment
  variables, and one-off scripts, in order, with a link to `docs/deployment-checklist.md`.
  A merge order alone is never the whole instruction.
- **Rule:** A PR that adds a migration says so in its first lines ("Run the migration
  before merging").
- **Why:** on 2026-10-28 I gave the merge order "#11 → #13" without repeating that the
  migration and `ENCRYPTION_KEY` had to come first. The owner merged; production ran code
  that reads new columns against the old schema, and every sign-in failed
  (`prisma.user.findMany()`: "The column (not available) does not exist").
- **How to apply:** before any "merge this" message, diff `prisma/migrations` and the
  environment variables the code reads between `master` and the PR, and put the steps first.

## 2026-10-29 — Cookie flows are verified where cookies are merged: on Netlify

- **Rule:** The proxy (middleware) matcher excludes `/api/auth`. The NextAuth `auth()`
  wrapper re-issues the session cookie on every request it handles; on the sign-out or
  sign-in endpoint that fresh cookie sits next to the handler's own cookie change, and on
  Netlify's edge middleware it wins. `src/__tests__/proxyMatcher.test.ts` guards this.
- **Rule:** A sign-out is confirmed by reading the session back, never by the status of the
  sign-out request (`signOutHere` in `src/components/auth/session.ts`).
- **Rule:** Sign-in, sign-out and account switching are checked on the Netlify deploy
  preview before merge. A local `next start` merges middleware and handler cookies in a
  different order and can pass while production fails.
- **Why:** on 2026-10-29 "Гараад өөр бүртгэлээр нэвтрэх" did nothing on production: six
  sign-out requests all answered 200, yet the person stayed signed in. Locally the same flow
  had passed, because there the handler's cookie deletion came last.
- **How to apply:** for any change that touches cookies, sessions or the proxy, give the
  owner the deploy-preview steps to try before saying it is fixed.
