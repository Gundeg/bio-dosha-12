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
