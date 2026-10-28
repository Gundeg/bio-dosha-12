# Bio-Dosha-12 platform architecture

This document describes how accounts, medical organizations, plans, the
control center and data protection fit together. It is the contract for anyone
changing the app: the API routes listed here are the source of truth, and the
UI must not invent fields they do not return.

> **The BEDI formula is locked.** Do not change `bediEngine.ts`, `bediConfig.ts`,
> `seasonFactors.ts`, `ktMapping.ts`, `questionnaireEngine.ts` or
> `potencyEngine.ts` without written approval from the owner. See `lessons.md`.

## 1. Who uses the platform

| Audience | What they do | Where |
| --- | --- | --- |
| **Individual** | Tracks their own and their family's body balance (BEDI). | `/dashboard`, `/calculator`, `/history`, `/family`, `/recommendations` |
| **Medical organization** (clinic, hospital, private practice) | Registers patients, records intakes and treatments, prints reports. Several practitioners share the organization's patients. | `/patients`, `/reports`, `/org` |
| **Platform staff** | Verify organizations, support accounts, assign plans. Never see health records. | `/admin` (the control center) |

One login can be all three at once: a doctor has personal profiles, works in a
clinic, and the platform owner is also a superadmin.

## 2. Roles and permissions

### Platform role (`User.role`)

| Role | Meaning |
| --- | --- |
| `INDIVIDUAL` | Default for every account. |
| `PRACTITIONER` | Legacy value from before organizations. No longer assigned; treated like `INDIVIDUAL`. |
| `ADMIN` | Platform staff. Control center: overview, organizations, users, plans (read), invitations. |
| `SUPERADMIN` | Platform owner. Everything ADMIN does, plus staff invitations, plan editing, permanent deletion, the audit log and system checks. |

Clinical access **never** comes from the platform role. Staff cannot open
patient records, intakes, BEDI records or recommendations of other people.
The control center shows counts and account data only.

### Organization role (`OrganizationMember.role`)

| Role | Manage members and settings | Patient records |
| --- | --- | --- |
| `OWNER` | yes (only owners grant or remove `OWNER`) | yes |
| `ADMIN` ("manager") | yes | **no** |
| `PRACTITIONER` | no | yes |

Clinical access requires all of: membership `ACTIVE`, organization `ACTIVE`,
role `OWNER` or `PRACTITIONER`, and 2-step sign-in turned on. All clinical
members of an organization see all of its patients.

Rules enforced by the API:
- An organization keeps at least one active `OWNER` (`last_owner`).
- Nobody changes their own organization role or status (no self-promotion).
- Clinical members count toward the plan's `maxPractitioners`.

### Organization status

| Status | Meaning |
| --- | --- |
| `PENDING` | Registered, waiting for platform verification. Members can manage the organization profile and invite colleagues; patient records are closed (`org_pending`). |
| `ACTIVE` | Verified. Everything works. |
| `SUSPENDED` | Closed by staff (with a reason). Patient records and management are blocked (`org_suspended`); members see the reason. |

New organizations from self sign-up start `PENDING`. Organizations created by
staff in the control center start `ACTIVE`.

### 2-step sign-in (TOTP)

Required for platform staff and for every member of an organization; optional
for individuals. Until it is turned on, the proxy sends the person to
`/mfa-setup` and the API answers `403 mfa_setup_required` for protected
actions. Authenticator apps: Google Authenticator, Microsoft Authenticator,
2FAS, Authy. Ten one-time recovery codes (`XXXX-XXXX-XXXX`) are shown once.

## 3. Plans (multi-tier, payments later)

`Plan` rows define tiers per audience (`INDIVIDUAL` or `ORGANIZATION`) with
`limits` (`maxProfiles`, `maxPractitioners`, `maxPatients`, `pdfReports`; `null`
means unlimited) and an informational monthly price in MNT. Each audience has
exactly one default plan, used by everyone without a `Subscription`.

Seeded plans (migration `20261027000000_organizations_plans_security`):

| Code | Audience | Limits |
| --- | --- | --- |
| `IND_FREE` (default) | Individual | 5 profiles |
| `IND_FAMILY` | Individual | 15 profiles |
| `ORG_STARTER` (default) | Organization | 3 practitioners, 300 patients, PDF |
| `ORG_PRO` | Organization | 15 practitioners, 5,000 patients, PDF |
| `ORG_ENTERPRISE` | Organization | unlimited |

Today the superadmin assigns plans in the control center. A payment provider
(QPay, card) will later write the same `Subscription` rows through
`src/lib/subscriptions.ts#assignPlan`, so no other code changes. Every limit
check goes through `src/lib/entitlements.ts` and fails with `403 plan_limit`.

## 4. Data protection

- **Encryption at rest.** AES-256-GCM through a Prisma client extension
  (`src/lib/prisma.ts`). Encrypted fields: `ClinicalIntake` free text and pulse
  table, `Patient.clinicalNotes`, `BEDIRecord.notes`, `Profile.registerNumber`,
  `phone`, `address`, and `User.totpSecret`. The key is `ENCRYPTION_KEY`
  (32 random bytes, base64). Without a valid key the app refuses to read or
  write those fields (fails closed). Losing the key means losing that data: keep
  a copy in the password manager.
- **Passwords** are bcrypt hashes. **Invitation and reset links** are random
  tokens; only their SHA-256 hash is stored, so a link is shown once.
- **Sessions** last 12 hours. Claims refresh every minute; disabling an account,
  changing a password or "sign out everywhere" bumps `sessionVersion`, which
  ends every session.
- **Audit log** (`AuditLog`): who did what to which record, with IP and browser.
  It never stores health data: meta keys that could carry it are dropped by
  `sanitizeMeta`. Superadmin can filter and export it as CSV.
- **Rate limits** on sign-in, sign-up, invitations, password reset (Postgres-backed).
- **Security headers / CSP** in `next.config.ts`.

## 5. Pages

| Path | Who | Purpose |
| --- | --- | --- |
| `/`, `/about`, `/privacy` | everyone | Landing, methodology (without the formula), privacy notice |
| `/login` | everyone | Email + password, then a 6-digit code if 2-step sign-in is on |
| `/register` | everyone | Personal account, or personal account + organization (pending verification) |
| `/forgot`, `/reset/[token]` | everyone | Password reset by email (when email is configured) or by a link from an admin |
| `/invite/[token]` | everyone | Accept an invitation to an organization or to platform staff |
| `/mfa-setup` | signed in | Required 2-step setup for staff and organization members |
| `/settings` | signed in | Tabs: profile, security (password, 2-step, sign out everywhere), privacy (export, delete account) |
| `/org` | organization members | Overview, members, invitations, organization profile, plan and usage |
| `/patients`, `/patients/[id]`, `/reports` | clinical members of an active organization | Clinical work |
| `/admin` | platform staff | Control center: overview, organizations, users, plans, invitations, audit (superadmin), system (superadmin) |

The proxy (`src/proxy.ts`) routes pages from session claims; every API route
re-checks permissions against the database (`src/lib/authz.ts`).

## 6. API

All routes answer errors as `{ error: string, code: string, fieldErrors? }`.
`error` is a Mongolian sentence; `code` is stable and translated by the UI
(`messages/*/errors.json`, `useErrorMessage()`). Read the route file for the
exact response shape before using it.

### Account (`src/app/api/account`)
- `GET /api/me`: account, `mfa {enabled, required, recoveryCodesLeft}`, `memberships[]`, `activeOrganizationId`, personal `plan`, `usage`, `emailEnabled`, `isPlatformStaff`, `isSuperadmin`.
- `PATCH /api/account` `{name?, locale?}` · `GET /api/account` deletion preview · `DELETE /api/account` `{password, confirm: "DELETE", deleteSoleOrganizations?}`.
- `POST /api/account/password` `{currentPassword, newPassword}` (signs out everywhere).
- `POST /api/account/signout-all`.
- `GET /api/account/export` (JSON download of personal data).
- `POST /api/account/mfa/setup` → `{secret, otpauthUrl, qrDataUrl}`; `POST /api/account/mfa/enable` `{code}` → `{recoveryCodes}`; `POST /api/account/mfa/disable` `{password, code}` (individuals only); `POST /api/account/mfa/recovery` `{password}` → new `{recoveryCodes}`.

### Sign-up and public (`src/app/api/register`, `src/app/api/public`)
- `POST /api/register` `{name, email, password, acceptPrivacy: true, accountType: "individual" | "organization", organization?: {name, type, registrationNumber?, phone?, email?, address?, city?}}`.
- `GET /api/public/config` → `{emailEnabled}`.
- `POST /api/public/forgot` `{email}` → always `{ok, emailEnabled}`.
- `GET|POST /api/public/reset/[token]` (`POST {password}`).
- `GET|POST /api/public/invite/[token]` (`GET` → `{email, kind, platformRole, orgRole, organization, accountExists, expiresAt}`; `POST {name?, password?, acceptPrivacy?}`; an existing account must be signed in with the invited email: `409 login_required`).
- Sign-in uses NextAuth credentials `{email, password, code?}`; `signIn()` returns `code`: `mfa_required`, `mfa_invalid`, `rate_limited`, `account_disabled`, or `credentials`.

### Organization (`src/app/api/org`)
- `GET /api/org` memberships · `POST /api/org` register another organization (pending).
- `PUT /api/org/active` `{organizationId}`.
- `GET|PATCH /api/org/[orgId]` profile, status, plan, usage, `myRole`, `canManage`.
- `GET /api/org/[orgId]/members` · `PATCH|DELETE /api/org/[orgId]/members/[memberId]` `{role?, status?, title?}`.
- `GET|POST /api/org/[orgId]/invites` `{email, role}` → `{inviteUrl, emailSent}` · `DELETE /api/org/[orgId]/invites/[inviteId]`.

### Clinical (organization-scoped)
- `/api/patients`, `/api/patients/[id]`, `/api/patients/[id]/intakes`, `.../[intakeId]`, `.../treatments`, `.../pdf`.
- Errors the UI must explain: `no_organization`, `org_pending`, `org_suspended`, `not_clinical`, `mfa_setup_required`, `plan_limit`, `plan_feature`.

### Control center (`src/app/api/admin`, staff only)
- `GET /api/admin/overview`: totals, 30-day series, pending organizations, security counters, plans, recent activity (superadmin).
- `GET /api/admin/organizations?q&status&page&pageSize` · `POST` create + owner invite `{...organization, ownerEmail, status?, planCode?}` → `{organization, inviteUrl, emailSent}`.
- `GET /api/admin/organizations/[orgId]` · `PATCH` `{action: "verify" | "suspend" (reason) | "reactivate" | "update" (fields) | "set_plan" (planCode, note?, currentPeriodEnd?)}` · `DELETE` (superadmin) `{confirmName}`.
- `GET /api/admin/users?q&role&status&type&page&pageSize` · `GET /api/admin/users/[userId]` · `PATCH` `{action: "disable" (reason) | "enable" | "signout" | "reset_mfa" | "set_role" (role, superadmin) | "set_plan"}` · `DELETE` (superadmin) `{confirmEmail, deleteSoleOrganizations?}` · `POST /api/admin/users/[userId]/reset-link` → `{resetUrl, emailSent}`.
- `GET /api/admin/plans` · `POST` (superadmin) · `PATCH /api/admin/plans/[planId]` (superadmin).
- `GET /api/admin/invites?kind&state&page` · `POST` staff invite (superadmin) `{email}` · `POST /api/admin/invites/[inviteId]` new link · `DELETE` revoke.
- `GET /api/admin/audit?action&actor&organizationId&targetId&from&to&page&format=csv` (superadmin).
- `GET /api/admin/system` (superadmin): configuration checks, plaintext counters, migrations, the locked formula constants (read-only).

Staff can never act on their own account through the control center, and
nobody can change or delete a `SUPERADMIN` there.

## 7. Interface rules

- **Languages.** Mongolian (default) and English, chosen by the `locale` cookie.
  Every string comes from `messages/<locale>/<namespace>.json`; `mn` and `en`
  files have identical keys. Mongolian uses refined business vocabulary; keep
  technical terms (QR, PDF, CSV, email) as is. Use ICU plurals for counts.
- **Namespaces** (registered in `src/i18n/request.ts`): `admin` (control center),
  `org`, `settings`, `authFlows`, `about`, `errors`, `kit`, plus the existing page namespaces.
- **UI kit** (`src/components/kit`): `PageHeader`, `Section`, `StatCard`,
  `DescriptionList`, `Callout`, `StatusBadge` (+ tone helpers), `ConfirmDialog`
  (reason, type-to-confirm), `CopyField` (one-time links), `DataTable` (table on
  desktop, cards on phones), `Pagination`, `FilterTabs`, `SearchInput`,
  `useApiQuery`, `useErrorMessage`, `useDebouncedValue`, `withQuery`.
- **States.** Every data view shows exactly one of: content, skeleton, error
  with retry (`ErrorState`), or an empty state that says what to do next.
- **Dates** through `src/lib/formatDate.ts` (never `toLocaleDateString("mn-MN")`).
- **Accessibility.** Labels on every input, visible focus, 44px touch targets on
  phones, status never shown by color alone, `aria-live` for async results.
- **Consequential actions** (suspend, disable, delete, reset 2-step) go through
  `ConfirmDialog`; permanent deletion requires typing the name or email.
- **One-time links** are shown in `CopyField` with the note that they appear once.
- **Health safety.** The app is a prevention and self-monitoring aid. Show the
  medical disclaimer where results are shown, and the emergency note: call **103**
  in an emergency.

## 8. Engineering notes

- **Zod 4 `.partial()` runs defaults and transforms for absent keys.** An update
  schema built with `createSchema.partial()` fills `type: "CLINIC"`, `phone: null`
  or `limits: {}` for keys the request did not send and silently overwrites stored
  values. Write update schemas explicitly with `.optional()` as the outermost
  wrapper (see `organizationUpdateSchema`, `planUpdateSchema` and their tests).
- **Encryption and transactions.** The encryption extension applies inside batch
  and interactive `$transaction` calls (verified). Raw SQL (`$queryRaw`,
  `$executeRaw`) bypasses it: never write sensitive fields with raw SQL, and build
  raw identifiers only from constants.
- **Nested writes of sensitive fields are refused** (`EncryptionWriteError`):
  create the sensitive row with its own model call.
- **One-time codes** (TOTP steps, recovery codes) are consumed with conditional
  `updateMany` writes, so two simultaneous sign-ins cannot reuse a code.
- **Migrations run before the deploy** (`npx prisma migrate deploy`): the build
  does not run them. New columns are nullable or defaulted so the previous
  version keeps working during the switch.
