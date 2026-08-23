# 2bReady — Engineering Context (AGENTS.md)

Persistent onboarding memory for AI coding assistants. Read this fully before touching any code.
Supersedes nothing — `2bready-api/CLAUDE.md` and `2bready-web/apps/*/CLAUDE.md` carry the per-repo rules; `Project Documents/SKILL.md` is the engineering conventions guide. This file is the map that ties them together plus the current build state.

## What this product is

2bReady is a **compliance-readiness SaaS platform** for Cambodian SMEs. The objective (per MVP Proposal v3) is not "digitize compliance paperwork" — it is building **trust infrastructure that lets a small Cambodian SME become investable and export-ready**: companies follow a guided compliance journey (levels L1–L4, milestones, documents), get audited, and receive a **publicly verifiable certificate + trust badge** as the payoff. Two-sided marketplace: companies hire third-party audit firms (TP partners) per journey level.

Bilingual: **English (en) + Khmer (kh)** — everywhere, including database translatable fields.

Product decisions locked in `Project Documents/2bReady_MVP_Proposal_v3.md` (THE source of truth for product intent — read the relevant section before building any feature). Key decisions already made:
- **TP Partners are a second tenant type** (`tp_partners`), structurally parallel to companies — never unified into one org table.
- **ADMIT Global is BOTH a regular marketplace vendor AND the hardcoded master verification authority** stamped on every certificate ("Verified by: ADMIT UNIT Master Auditors" etc., from `platform_settings`, not from the hire record). ADMIT Unit = separate consulting lead-capture CTA.
- **One person can own multiple companies** — `company_user` pivot + `users.current_company_id` (active context). Roles stay global (spatie `teams => false`).
- **Taxonomy is data, not code** — journey templates keyed by `(country_code, industry_id)`. Never hardcode taxonomy outside the seeded DB tables.
- **Mockup numbers are not requirements** — every business-tunable value lives in `platform_settings`, admin-editable, seeded with the mockup value as default only.
- Certificates' QR/verify URL uses the **audit ID directly** (`/verify/{auditId}`) — owner chose to follow the blueprint.

## Repository layout

```
2bready/                  monorepo root
├─ 2bready-api/           Laravel 11 (PHP 8.3, PostgreSQL 16, ULID PKs) — Docker/Sail
├─ 2bready-web/           npm-workspaces monorepo, Next.js 16.2 + React 19 + MUI v9 + Tailwind v4
│  ├─ apps/
│  │  ├─ admin-portal/    back office (admin/staff/finance) — basePath /admin in prod — uses src/domains/*
│  │  ├─ client-portal/   company portal — basePath /portal in prod — uses flat src/lib/*-api.ts + lib/i18n
│  │  ├─ tp-portal/       third-party auditor portal — basePath /tp-portal — uses src/domains/*
│  │  └─ marketing/       single-page landing site at /
│  └─ packages/
│     ├─ api-client/      @2bready/api-client — axios factory, getApiError, GENERATED types (api.generated.ts)
│     └─ ui-core/         @2bready/ui-core — shared MUI components (SectionCard, StatusBadge, ConfirmDialog…)
├─ devops/                nginx/php/supervisor configs baked into the prod containers
├─ docker-compose.prod.yml
└─ Project Documents/     proposals (v3 = current), ERD (2bReady_ERD.dbml), SKILL.md
```

**Critical: Next.js here is v16 with breaking changes vs. training data.** Read the relevant guide in `node_modules/next/dist/docs/` before writing frontend code (e.g. `proxy.ts`, not `middleware.ts`). Do not trust the CLAUDE.md "Next.js 15" notes — stale.

## The contract between frontend and backend

Scramble (Laravel) → OpenAPI (`/docs/api.json`) → `packages/api-client/src/generated/api.generated.ts` → consumed by all 4 apps. **Never hand-edit generated types.** Regenerate: `npm run generate:types` in `2bready-web` (needs API running at :8080). If you change an endpoint's shape, regenerate — don't patch the frontend type.

## Non-negotiable backend rules (CI blocks on these)

1. **Tenant boundary**: every tenant-scoped model uses `BelongsToCompany` trait (global scope on `current_company_id`). NEVER manual `where('company_id')`. Internal roles bypass by role, never by null company_id. `withoutGlobalScope('company')` for explicit admin cross-tenant queries.
2. **AuditLog is write-once**: only via `RecordAuditLogAction` from event listeners. DB role blocks UPDATE/DELETE. Sensitive actions fire domain events → `RecordAuditLogListener`.
3. **Thin controllers**: Form Request → one Action → Resource. Business logic lives in `app/Domain/{X}/Actions/` (one invokable class per use case).
4. **Authorization via Policies**, never frontend-hidden buttons.
5. `declare(strict_types=1)` every file; ULID PKs (`HasUlid`); Money = integer cents (`Money` VO); status = backed enum + DB CHECK constraint; every FK/WHERE/ORDER/JOIN column indexed; no raw SQL; secrets only in `.env`.
6. Domain events, not cross-domain Action calls (`AuditDecisionMade` → listener → `ComplianceScoreService`, etc.).
7. Repositories only where earned (Company, TpPartner). Abstractions earned by real need, never speculative.
8. Every endpoint ships a Pest test (happy + 422 + 401/403). CI: Pint, Larastan L6, Pest coverage ≥ 80%.
9. Files: validate MIME+size → antivirus scan job → serve only via signed URLs.

## Frontend rules

1. Never hand-edit `api.generated.ts`. No `any` without inline justification.
2. Forms always RHF + Zod (schemas mirror backend validation). React Compiler lint is ON — use `useWatch` not top-level `watch()`, never read `ref.current` during render (pass ref objects to MUI anchors where supported).
3. Auth state from Zustand only (localStorage keys: `admin_auth_token`, `client_auth_token`, `tp_auth_token` — prefixed because prod mounts apps same-origin). Admin/tp also sync auth cookies (`*_full` = 2FA-pending distinction).
4. Money: display via `formatCents` from each app's `src/lib/utils.ts` — never `/ 100` inline. **client-portal gained `lib/utils.ts` in Aug 2026; all three portals now share the identical canonical util** (`getApiError` re-export + `formatCents` Intl + `formatDate`). New apps/portals must copy the same file.
5. i18n: every UI string in `lib/i18n/{en,kh}.ts` (typed dict, `{var}` interpolation) — never hardcoded. DB-translatable fields via `t(field)` from `useTranslation()`, never `.en`/`.kh` directly. Khmer font: Kantumruy Pro.
6. API calls only through `lib/api.ts` axios instance per app. Route guards: admin = `can_access_admin_portal`; company = `can_access_client_portal` + `current_company_id`; TP = `can_access_tp_portal`.
7. MUI for interactive elements, Tailwind for layout/spacing, no inline style for spacing. CSS vars via `cssVariables: true`.
8. Two layout conventions coexist (do not "unify" them): admin/tp-portal use `src/domains/{x}/api.ts|hooks.ts|schemas.ts`; client-portal uses flat `src/lib/{x}-api.ts` + `src/lib/{x}-schema.ts`.

## API surface (v1, prefix /api/v1)

- Public: `auth/*`, `leads`, `pricing`, `industry-options`, `data-room/{token}/verify`, `data-room/{token}/documents/{doc}/preview-url`
- Auth'd: companies (+ register/switch/users), industries, users/roles, packages, subscriptions, payments (submit/confirm/reject), leads, journey (+ templates/levels/milestones/medals/complete), documents (+ templates/preview/verify/reject), data-room, audit-logs, settings (+ google-oauth/mail/mail-test), me, tp-partners (+ auditors), tp-hires (hire/complete/mark-paid-out), tp (TP-portal: companies, company journey)
- Stub route files awaiting implementation: `audit.php`, `notification.php`, `support.php`, `sop.php`, `report.php`

## Build state vs. v3 proposal (Aug 2026, refreshed 2026-08-23)

**Exists (do not rebuild):** auth+TOTP+Google, RBAC, multi-company (`company_user`+`current_company_id`), industries, packages/leads, subscriptions/payments (FakeStripe + ManualBankTransfer gateways + payment lifecycle state guards → 409), journey templates/levels/milestones + builder, documents (recurring, periods, expiry, malware scan job), data-room (7-day links, PIN), Vault domain (PIN/auto-lock/unlock-log/expiry job), LegalConsent services, platform_settings machinery, audit logs, **Sprint 6 complete**: Audit domain (full review workflow pending→in_progress→submitted→approved/rejected+cancel, per-firm auditor guards, 27 tests) · ComplianceScoreCalculator→companies.compliance_score via `AuditDecisionMade` · TrustBadge issuance on approval · certificates (DomPDF bilingual w/ Khmer fonts + QR encoding `{verify_base_url}/{auditId}` + `master_verifier_stamp` snapshot from platform_settings, queued idempotent job) · public throttled `/api/v1/public/verify/{auditId}` + marketing app `(public)/verify/[verificationId]` page. **Sprint 7 complete**: tp_partners with onboarding approval (`pending_approval` → approve endpoint; companies browse active-only), per-level pricing self-service, tp_hires (hire/edit-pre-payment/cancel/complete/paid-out, commission), tp_ratings + rating dialog in client portal, matchmaking list w/ rating aggregates, admin partner suspend/activate toggle. SOP workflow shipped (editor, adoption, sign-off send/acknowledge, Gotenberg A4 PDF). Client portal pages (journey/billing/audits/data-room/sops/support/trust-badge/settings), admin portal full back office, tp-portal review flow, marketing landing page.

**MISSING (the real backlog — rough priority order):**
1. **Support ticketing backend** — Models/Enums/DTOs scaffolded, `support.php` still `// TODO: add routes`; needs endpoints/actions/policies/tests.
2. **Notification domain wiring** — folder structure exists but no Actions/routes; hook listeners onto existing events (payment confirmed, audit approved…), email channel via Mailpit.
3. **Report/Report & analytics dashboard** — no Report domain at all; `report.php` stubbed.
4. **Subscription expiry** — nothing flips `active`→`expired`; entitlements never lapse (`JourneyProgressService` MAX-cap makes accumulation permanent).
5. **Stale `companies.active_subscription_id`** — written by `ConfirmPaymentAction`, read by nothing (cap logic moved to multi-subscription MAX); decide delete-vs-repurpose; tests still bless it.
6. **ADMIT Unit lead-upsell trigger** (14 days, 0% progress — from platform_settings).
7. Minor debt: submit/confirm/reject have guards but no optimistic locking under concurrency; admin payments filter omits `failed`; client billing page i18n + `PricingCard` inline cents division violations; empty scaffold dirs (`TrustBadge/DTOs`, `Audit/QueryFilters`).

## Day-to-day commands

**API** (from `2bready-api/`, inside Sail): `./vendor/bin/sail test` · `sail exec laravel.test ./vendor/bin/pint` · `sail exec laravel.test ./vendor/bin/phpstan analyse` · `sail artisan scramble:export` · `sail artisan migrate:fresh --seed`
**Web** (from `2bready-web/`): `npm run dev:{admin,client,marketing,tp}` · `npm run type-check:{admin,client,marketing,tp}` · `npm run lint:{admin,client,marketing,tp}` · `npm run build:{admin,client,marketing,tp}` · `npm run generate:types`
Local ports: admin 3000, client 3001, marketing 3002, API 8080, Mailpit 8026, MinIO 8901.

## Production topology (local-server-1 / 2bready.systemsolution.online)

- One box, docker-compose: edge nginx (host 8082, path-routed) → 4 Next standalone apps (same-origin path mounts `/admin` `/portal` `/tp-portal` `/`) + one Laravel container (supervisord: nginx+php-fpm) + postgres:16 + redis:7. TLS via Cloudflare Tunnel/aaPanel (owns 80/443).
- No automated deploy — manual: `git pull` + `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build` (server-side `.env.production`; `.env.production.example` is the template).
- CI exists only for the API (`.github/workflows/ci.yml` in 2bready-api): Pint --test, Larastan, Pest parallel with coverage min 80%.
- git remote: https://github.com/thyvon/2bready.git

## Working conventions for this session (things learned the hard way)

- When touching money display, `utils.ts` canonical file must stay byte-identical across the 3 portals.
- Keep audits/billing-style pages: search + level filter (PillToggle), ConfirmDialog for destructive/hire actions, StatusBadge for statuses, cardRestShadow/cardHoverGlow from ui-core, EmptyState for all empty branches.
- Nginx path-routing means no hardcoded absolute URLs across apps — use env-configured cross-app URL vars (marketing does this).
- `docker compose` deploys used explicit `--force-recreate` for the specific service; verify with `docker compose ... ps` after.
