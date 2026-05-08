# Clinical intake feature — setup & operations

This feature digitises the paper Эмчлүүлэгчийн бүртгэлийн хуудас + Эмчилгээ хуудас for practitioners.

## One-time setup

### 1. Run the database migration

The schema adds optional columns to `Profile` and creates new `ClinicalIntake` and `TreatmentLog` tables.

```bash
npm install
npx prisma migrate dev --name add_clinical_intake
```

`postinstall` regenerates the Prisma client. The migration is additive (all new `Profile` columns are nullable), so existing rows are unaffected. `ClinicalIntake.profileId` uses `onDelete: Restrict` — medical records are preserved if a profile is removed.

### 2. Add Cyrillic-supporting fonts

`@react-pdf/renderer`'s default Helvetica does not render Mongolian Cyrillic. Place a Cyrillic-capable TTF in `public/fonts/`:

- `public/fonts/NotoSans-Regular.ttf`
- `public/fonts/NotoSans-Bold.ttf`

Recommended source: [Google Fonts — Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans). Download the static `Regular` and `Bold` TTFs.

Without these files the `/api/patients/[id]/intakes/[intakeId]/pdf` route will fail with a "font not registered" error.

## Routing surface

- `/patients/[id]` — practitioner-only; tabs **Үзлэгийн карт | Эмчилгээ | Түүх**.
- `/api/patients/[id]` — `GET` patient + profile + intakes.
- `/api/patients/[id]/intakes` — `POST` create new intake (auto-creates empty `TreatmentLog`).
- `/api/patients/[id]/intakes/[intakeId]` — `GET`, `PATCH`.
- `/api/patients/[id]/intakes/[intakeId]/treatments` — `PATCH` (debounced session counts).
- `/api/patients/[id]/intakes/[intakeId]/pdf` — `GET` streams PDF.

All routes verify `session.user.role === "PRACTITIONER"` and ownership through `Patient.practitionerId`.

## Verification flow

1. Log in as a `PRACTITIONER` user.
2. Go to `/patients`, click **Үзлэгийн карт** on a patient card.
3. **Үзлэгийн карт** tab: fill the long form and click **Шинэ үзлэг хадгалах**.
4. **Эмчилгээ** tab: click numbered cells per therapy row. Counts persist (debounced 500 ms PATCH).
5. **Түүх** tab: confirm the new visit appears. Click **PDF** — verify Cyrillic renders correctly.
6. As an `INDIVIDUAL` user, navigate to `/patients/<any-id>` → middleware redirects to `/dashboard`.
7. As a different `PRACTITIONER`, `GET /api/patients/<other-doctors-patient>` → expect `404`.

## Data model summary

- `Profile` — extended with optional `lastName`, `registerNumber`, `phone`, `address`, `occupation`.
- `ClinicalIntake` — one row per visit, free-text clinical fields, `pulseTable` JSON (3×4 grid), `condition`/`mentalState`/`position` enums-as-strings.
- `TreatmentLog` — 1:1 with `ClinicalIntake`. 24 named integer columns, default 0, max 10. Storage is leaf-only; group totals (e.g. Бариа = head + neckShoulder + back + legs) are computed in the UI.
