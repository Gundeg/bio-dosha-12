# Design system

Bio-Dosha-12 is a clinical tool used by doctors and by individuals on phones and shared clinic computers. The look is calm, precise and quiet. One accent colour is used, and decoration is never added for its own sake. Every screen is built from the same few parts.

## Tokens (src/app/globals.css)

| Token | Value | Use |
| --- | --- | --- |
| `primary` | `#00626b` teal | The one accent: primary buttons, active navigation, links, focus |
| `surface` | `#f5f7f7` | Page background |
| `surface-container-lowest` | `#ffffff` | Panels, cards, inputs, sidebar |
| `surface-container-low` | `#eff3f3` | Hover rows, quiet fills, segmented-control track |
| `outline-variant` | `#d2dbdc` | Hairlines: borders, dividers, input outlines |
| `on-surface` / `on-surface-variant` | `#132428` / `#52626a` | Text / secondary text and icons |
| `secondary` | `#904d00` amber | Шар (Fire) data only, never for buttons |
| Status | emerald, amber, red (`-50` fills, `-700` text) | Success, warning, danger |

**Type.** Inter is the only family.
- Page title: `text-2xl md:text-[28px] font-semibold tracking-tight`.
- Section title: `text-base font-semibold`.
- Body: `text-sm`.
- Labels: `text-xs` or `text-sm`, `font-medium`, `text-on-surface-variant`, in sentence case.
- Never use `uppercase`, letter-spaced eyebrows, `font-black` or `font-extrabold` (both map to 700).

**Radius.** There are two steps:
- `rounded-lg` (8px) for controls: buttons, inputs, selects, chips, list rows, icon tiles.
- `rounded-xl` (12px) for surfaces: cards, panels, dialogs. `rounded-2xl` and `rounded-3xl` render as 12px.
- `rounded-full` only for avatars, status dots, progress tracks and toggle knobs. Never use it on a button or chip with text.

**Elevation.** Panels use `shadow-ambient` (a hairline plus a soft shadow). Do not add `ring-*` on top of it. Popovers and dialogs use `shadow-lg`. There are no hover lifts (`hover:-translate-y`, `hover:shadow-xl`), gradients, blurred blobs or decorative circles.

**Icons.** Always `<Icon name="…" />` from `src/components/ui/icon.tsx` (Lucide, 1.5px stroke).
- Sizes: 16px (`size-4`) in text and buttons, 18px (`size-[18px]`) in navigation and tiles, 20px (`size-5`) standalone.
- Icon colour follows the text.
- In a tinted square use `<IconTile>`, which centres the icon.
- No emoji or Unicode pictograms (❄ ⚖ 🌿 ♂ …) as icons. New names are added to the map in `icon.tsx`.

## Components (use these, do not restyle per page)

- `Button` / `ButtonLink` (`src/components/ui`):
  - Variants: `default` (primary), `outline`, `secondary` (neutral), `ghost`, `destructive`, `link`.
  - Sizes: `sm` 32px, default 36px, `lg` 40px.
  - Each view has **one** filled primary action. Secondary actions are `outline` or `ghost`. Do not append "→" to labels.
  - Offer an action in one place only. A page-header "Add" button needs no second "Add" tile in the grid.
  - Delete on a card is a `ghost` icon button in the card header, neutral at rest and red on hover. Only the final confirm inside the dialog is filled red.
- `Input`, `Select`: 40px, white, hairline border.
- `Dialog`: `DialogTitle` already carries the title style (`text-lg font-semibold`). Do not restyle it per dialog.
- `PageHeader` (`src/components/kit/layout.tsx`): title, optional description, and actions on the right. No eyebrow above the title unless it adds context the page does not already show, for example an organization name. It keeps its own bottom margin, so do not pass `mb-0`.
- `Section`: a white panel with an optional header row (title, description, actions).
- `StatCard`, `DescriptionList`, `Callout`, `IconTile`, `StatusBadge`.
- `FilterTabs` (`src/components/kit/DataTable.tsx`): the segmented control (an 8px track, 32px items). Use it for choosing one of a few options, for example a profile, patient, sex or season. `LocaleToggle` uses the same look.
- `EmptyState`, `ErrorState`, `PageLoading`, `Skeleton` (`src/components/states`).

## Status colours

The same BEDI status always looks the same, on every page and in print:

| Status | Badge tone | Text |
| --- | --- | --- |
| Тэнцвэртэй (`balanced`) | `success` | `text-emerald-700` |
| Хий арвидсан (`khii_excess`) | `primary` | `text-primary` |
| Шар/Бадган арвидсан (`shar_badgan_excess`) | `warning` | `text-secondary` |

An imbalance is not an emergency, so no status uses red. Red is reserved for errors and destructive actions.

Monospace is only for technical identifiers: IDs, IP addresses, plan codes and recovery codes. Measurements such as Kt use Inter with `tabular-nums`.

## Layout

- Desktop:
  - A 240px sidebar with the brand, navigation sections and the account menu (settings, help, language, sign out).
  - Content sits in `max-w-6xl`. There is no top bar.
  - Narrow pages such as help and settings cap their width (`max-w-3xl`, `max-w-4xl`) but stay left-aligned, so every page starts at the same left edge. Only the printable report preview is centred.
  - The sidebar shows the mark and name only; the tagline belongs on the landing and sign-in pages.
- Phone: a bottom bar with four places and "Цэс", which opens the sheet with everything else.
- A page reads top-down:
  1. `PageHeader`, with the page's primary action on the right.
  2. The main content in `Section`s or a simple grid (`gap-4`/`gap-6`).
  3. Supporting information last.
- Spacing scale: 4, 8, 12, 16, 24, 32 (`gap-1`…`gap-8`). Panel padding is `p-5`; dense lists use `px-4 py-3`.
- Stack page blocks with `space-y-6`. In Tailwind v4 this sets a bottom margin on every child except the last, so a child's own `mb-*` class overrides it.
- An icon next to text that may wrap goes in a flex row with the text in its own `<span>`. A bare text node becomes a full-width flex item and pushes the icon to the edge.

## Writing

- Sentence case everywhere. Buttons say what happens ("Тооцоолох", "Хадгалах").
- An action keeps the same name through the flow.
- Errors say what happened and what to do next.
