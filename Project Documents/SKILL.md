---
name: 2bready-engineering-conventions
description: "Use this skill for ANY code written in the 2bready-api or 2bready-web repositories — new features, bug fixes, refactors, or reviews. Covers where new files belong (domain-oriented Laravel backend, feature-sliced Next.js frontend), which design pattern applies to a given change, the non-negotiable multi-tenancy and security rules, and the testing/API-contract conventions the project enforces in CI. Read this before creating any file, choosing a folder, or deciding whether something needs a Repository, a Service, or a QueryFilter."
---

# 2bReady Engineering Conventions

2bReady is a multi-tenant compliance-readiness SaaS platform (companies, third-party auditors,
admins; guided compliance journey; document vault; audit workflow; trust-scoring engine).
Backend: `2bready-api` (Laravel 11, PHP 8.3, PostgreSQL 16, ULID primary keys).
Frontend: `2bready-web` (Next.js 15 App Router, TypeScript, MUI v9.1.2 + Tailwind CSS v4, Zustand, Axios, React Hook Form + Zod).
The system supports two languages: **English (en)** and **Khmer (kh)** — see i18n section below.
The two repos are kept in sync by one generated contract: Laravel's OpenAPI spec (Scramble) →
`types/api.generated.ts` on the frontend. Never hand-edit that generated file; regenerate it.

This document is the decision guide for *where code goes* and *which pattern to use*. When in
doubt, follow this file over intuition — it encodes decisions already made for this project.

## The one rule that overrides all others

**Every tenant-scoped model MUST use the `BelongsToCompany` trait** (`app/Support/Concerns/BelongsToCompany.php`).
This is the single global-scope boundary that prevents one company's data from ever leaking into
another company's query results. Do not write a manual `where('company_id', ...)` clause as a
substitute — that's exactly the kind of one-off mistake this trait exists to make impossible.
If you're adding a new tenant-scoped table, applying this trait to its model is not optional.

**Admin bypass is explicit, not accidental.** Internal roles (`admin`, `staff`, `finance`) have
`company_id = null`. `BelongsToCompany` checks the user's role before applying the scope —
if the user holds an internal role, no scope is applied and all rows are visible. For admin
Actions that explicitly need to query across all tenants, use `withoutGlobalScope('company')`.
Never rely on a null `company_id` alone as the bypass signal — that's fragile.

**AuditLog models are write-once.** Never call `update()` or `delete()` on an `AuditLog`.
Always write through `RecordAuditLogAction` (called by event listeners only, never directly
from a Controller or Action). The DB role has no UPDATE/DELETE on `audit_logs`.

**Compliance score split.** `ComplianceScoreCalculator` (Audit domain) is a pure function —
it reads evidence and returns a score, it never writes. `ComplianceScoreService` (Company domain)
applies the result to the company record. The flow is always:
`AuditDecisionMade event → UpdateComplianceScoreListener → ComplianceScoreService → ComplianceScoreCalculator`.
No Controller or Action calls either class directly.

## Backend (`2bready-api`) — where does this code go?

Code is organized by **domain** (`app/Domain/{Company,User,Package,Payment,Journey,Document,
Audit,TrustBadge,Notification,Support,Sop,AuditLog,DataRoom}/`), not by technical type.
Never add a new top-level `app/Services/`, `app/Repositories/`, or `app/Http/Controllers`
file that isn't under `Api/V1/` — everything domain-specific lives inside its domain folder.

Use this checklist when adding something new:

| You're adding... | Goes in | Notes |
|---|---|---|
| A single-purpose use-case triggered by one endpoint | `Domain/{X}/Actions/` | One public method. No business logic in the Controller — it only validates and delegates here. |
| Logic reused by 2+ Actions (score calc, unlock rules, gateway orchestration) | `Domain/{X}/Services/` | Only create this folder when something is actually shared. Don't create an empty one "just in case." |
| An interchangeable implementation behind one contract (payment gateway, notification channel) | `Domain/{X}/Contracts/` + a concrete class (e.g. `Gateways/`, `Channels/`) | This is the Strategy pattern. Add a contract when you can already name 2+ implementations, not preemptively. |
| Persistence abstraction (needed for mocking in tests, or swapping storage) | `Domain/{X}/Contracts/{X}RepositoryInterface.php` + `Domain/{X}/Repositories/Eloquent{X}Repository.php`, bound in `RepositoryServiceProvider` | Only for domains with a real reason (Company, Payment). A plain CRUD domain (Support, Sop) does NOT need this — don't cargo-cult it. |
| Non-trivial list/search/filter logic for an index endpoint | `Domain/{X}/QueryFilters/` | Composable filter objects, not `if` chains in the Controller or Action. |
| A typed cross-boundary payload | `Domain/{X}/DTOs/` (spatie/laravel-data) | Never pass raw arrays across a layer boundary. |
| A status/type field | `Domain/{X}/Enums/` (native PHP backed enum) | Mirror it as a DB `CHECK` constraint in the migration. Never use magic strings. |
| Something other modules need to react to | `Domain/{X}/Events/` + a `Listeners/` class elsewhere | Observer pattern — keeps modules decoupled. Don't call another domain's Action directly from inside your Action; fire an event instead. |
| A concept genuinely shared across domains (e.g. `Money`) | `Domain/Shared/ValueObjects/` | Only for things 2+ domains depend on. Not a dumping ground. |

**Controllers are always thin**: validate via a Form Request → call one Action or Service →
return an API Resource. If you're tempted to put an `if` statement with business meaning in a
Controller, it belongs in an Action or Policy instead.

**Authorization** is always a Policy (`Domain/{X}/Policies/`), registered in
`AuthServiceProvider`. Never infer authorization from whether the frontend hides a button.

**Dependency injection only.** Type-hint against the interface when one exists
(`CompanyRepositoryInterface`, not `EloquentCompanyRepository`). Never `new` a class with
swappable behavior directly inside an Action or Service.

## Frontend (`2bready-web`) — where does this code go?

Code is organized by **domain** (`src/domains/{auth,company,package,payment,journey,document,
audit,trust-badge,notification,support,sop,data-room,audit-log}/`) — mirroring the backend.
`src/app/` is routing only — layouts and `page.tsx` files, no data-fetching, no business logic.

| You're adding... | Goes in | Notes |
|---|---|---|
| An API call for a domain | `domains/{x}/api.ts` | This is the ONLY place that calls the network for that domain, always through `lib/api.ts` Axios instance. Never call Axios from a component directly. |
| A data-fetching hook | `domains/{x}/hooks.ts` | Custom React hooks wrapping `domains/{x}/api.ts`. Components consume these, never fetch themselves. |
| Domain-specific UI | `domains/{x}/components/` | Presentational; receives data as props from the page or hook. |
| A Zod schema | `domains/{x}/schemas.ts` | Must mirror the backend's Form Request validation rules exactly. |
| A reusable cross-domain component (layout, dialog, badge) | `components/ui/` or `components/layouts/` | MUI wrappers and project-specific primitives. |
| Cross-domain logic (debounce, pagination, permission check) | `hooks/` | `use-permission.ts` must mirror backend Policy names 1:1 — never invent a frontend-only permission name. |
| Auth state (user, token, roles) | `store/auth.store.ts` (Zustand persisted) | The ONLY place for auth state. Never read/write `localStorage` directly in components. |
| UI-only state (sidebar, theme) | `store/ui.store.ts` (Zustand) | Layout state only — never put fetched server data here. |
| Types for API data | `types/api.generated.ts` | Auto-generated — do NOT hand-edit. Regenerate with `npm run generate:types`. Add augmentations in `types/index.ts`. |
| Route protection | `middleware.ts` | Role/auth guards run before the page renders, not inside the page component. |
| i18n translation helper | `hooks/use-locale.ts` | Use `const { t } = useLocale(); t(model.name)` to extract the correct locale key from a translatable JSON field. Never access `.en` or `.kh` directly in a component. |

## Design patterns in play (and why)

- **Repository** — Company, Payment only (real need: mocking, multiple gateways). Don't add it elsewhere by default.
- **Action/Service** — Actions are one-shot, called from Controllers. Services hold logic shared by 2+ Actions.
- **Strategy** — `PaymentGatewayInterface` (Stripe / manual transfer), `MilestoneUnlockRuleEngine`, notification channels.
- **DTO** — every cross-boundary payload, backend and frontend.
- **Observer/Event-Listener** — domain events decouple side effects from the triggering Action. Score updates, audit logging, and subscription activation all happen through events, never inline.
- **Specification/Query Filter** — composable list filtering (Company directory, Audit queue).
- **Global Scope** — `BelongsToCompany`, the tenant-isolation boundary. See rule #1 above. Admins bypass via explicit role check.
- **Immutable Append-Only** — `AuditLog` records are created once, never mutated. Enforced at DB layer.
- **Adapter** — `types/api.generated.ts` adapts the backend contract to frontend-friendly types.
- **Domain-aligned API layer (frontend)** — `domains/*/api.ts` is the only network boundary per domain; all calls go through `lib/api.ts` Axios instance.

## Multi-language (i18n) rules

The system supports **en** (English) and **kh** (Khmer). Two distinct concerns:

**Translatable content (database)** — stored as JSON: `{"en": "...", "kh": "..."}`.
Fields: `packages.name`, `journey_levels.label`, `milestones.name`, `document_templates.name/category`, `notification_templates.subject/body`, `faqs.question/answer`.

**Backend rules:**
- `SetLocale` middleware sets `App::setLocale()` from `auth()->user()->locale` on every request.
- Access translatable fields via `$model->getTranslation('name', app()->getLocale())` — never `$model->name['en']` directly.
- `TranslatableContent` validation rule enforces both `en` and `kh` keys are present on admin-created content.
- Notifications render in the recipient's locale (`users.locale`), not the sender's.

**Frontend rules:**
- `useLocale()` hook provides `t(field)` helper — use it every time you display a translatable field.
- Never access `.en` or `.kh` directly in a component — always go through `t()`.
- Language switcher calls `PATCH /api/v1/users/me` to persist `locale` to the backend.
- Static UI strings (labels, buttons, errors) live in `lib/translations.ts` as a simple locale map.

## Key data relationships to remember

- `auditors.user_id → users.id` — auditors log in as Users; `auditors` is a profile extension, not a separate auth system.
- `companies.active_subscription_id → subscriptions.id` — always query via subscription, not a direct package_id on company.
- `milestone_completions(company_id, milestone_id)` — the source of truth for journey progress. The `MilestoneUnlockRuleEngine` reads this, not milestones directly.
- `data_room_links` tokens are 64-char random; PINs are bcrypt-hashed. Never log either in plain text.
- `audit_logs` has no `updated_at`. It is append-only by design and DB enforcement.

## API contract rules

- All endpoints versioned: `/api/v1/...`.
- Success envelope: `{ data, meta }`. Error envelope: `{ message, errors }`. Every endpoint, no exceptions.
- Standard status codes: 422 validation, 403 authorization, 404 not found, 409 conflict, 429 rate-limited.
- The OpenAPI spec (Scramble) is the source of truth — if you change an endpoint's shape, regenerate
  `types/api.generated.ts`, don't hand-patch the frontend type to match.

## Non-negotiable rules (CI will reject these)

- No raw SQL string concatenation — Eloquent/query builder only.
- No business logic in a Controller.
- No `any` in TypeScript without an inline justification comment.
- No commented-out code, no `console.log`/`dd()` in committed code.
- Every new API endpoint ships with a Pest feature test (happy path + validation failure + authorization failure).
- Domain services and score-calculation logic require unit tests.
- Every foreign key and every column used in `WHERE`/`ORDER BY`/`JOIN` is indexed by migration.
- File uploads validated by MIME + size + antivirus hook before persisting to storage; served only via short-lived signed URLs.
- Secrets never committed — `.env` only.
- PHP: PSR-12 (Pint), `strict_types=1`, PHPStan/Larastan level 6+. TypeScript: strict mode, ESLint + Prettier.

## When you're not sure

If a change doesn't clearly fit one of the tables above, prefer the simplest option (an Action,
a plain component) over adding a new abstraction (Repository, Service, global store) — this
project's rule is that abstractions are earned by a real, current need, not added speculatively.
