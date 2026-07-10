# 2bReady — MVP Development Proposal (v3)

**COMPLY. SCALE. LEAD.**

Technology Proposal • Response to Owner Concept • Contract & Payment Terms • Development Plan • Performance, Security & Scalability • ERD • Landing Page

*Engineered for High Performance • Strong Security • Enterprise Scalability • Built to Scale Beyond Cambodia F&B*

**Proposed Stack:** Laravel API • Next.js 15 + MUI v9 + Tailwind CSS v4 • PostgreSQL 16 (ULID)

Prepared for: 2bReady
Prepared by: Development Partner
Date: July 2026 • Version 3.0 — supersedes v2.1

---

## Table of Contents

0. Response to Owner Concept — What Changed and Why
1. Technology Proposal
2. Contract & Payment Terms
3. Development Plan
4. Performance, Security & Scalability Architecture
5. Entity Relationship Diagram (ERD)
6. Landing Page & Public Routes
7. Open Questions Requiring Owner Decision

---

## 0. Response to Owner Concept — What Changed and Why

[#0-response-to-owner-concept](#0-response-to-owner-concept)

v2 of this proposal was built from the MVP requirements document. Since then we reviewed the owner's own working concept prototype (the interactive HTML blueprint, "MVP 6.3.3.2"), which encodes real product decisions that weren't fully reflected in v2's scope. This version replaces v2 entirely and closes those gaps — not by bolting features on, but by re-deriving the architecture from what the blueprint actually reveals about the product's objective:

**The objective isn't "digitize compliance paperwork."** It's building the **trust infrastructure that lets a small Cambodian SME become investable and export-ready**, with compliance as the on-ramp and a verifiable, publicly-checkable badge as the payoff. Every gap we found matters *because* it sits close to that value proposition, not because it's a missing checkbox feature.

### 0.1 What v2 got right and keeps unchanged

- Domain-oriented Laravel backend, feature-sliced Next.js frontend, ULID/PostgreSQL, RBAC + tenant scoping, event-driven compliance scoring, immutable audit log at the database-role level. This foundation is correct and nothing here is being re-architected — it's being **extended**, because it was built with the right seams (interfaces, event listeners, strategy patterns) to extend cleanly.

### 0.2 What was missing, and where it now lives

| Gap found in blueprint, absent from v2 | Why it matters to the objective | Where it lives in v3 |
|---|---|---|
| **TP Marketplace** — named audit firms with per-level pricing, ratings, company-initiated hire/unhire | This *is* the two-sided network effect the business model depends on — auditors get distribution, 2bReady takes a platform position, companies get social proof. v2 only scoped one-directional auditor *assignment*, a fundamentally smaller feature. | New `TpPartner` + `Marketplace` domains, new Sprint 7 (§3.3) |
| **Vault/PIN security layer** for sensitive documents (admin/finance unlock, auto-lock timer) | Directly protects the compliance data that *is* the product's credibility. Missing this is a real security gap, not a nice-to-have. | New `Vault` domain, folded into Sprint 5 (§3.3) |
| **Legal consent gating** on restricted P3/P4 documents | Legal exposure control for the platform when sensitive financial data changes hands. | New `LegalConsent` domain, folded into Sprint 5 |
| **Public certificate verification page** (`verify.2bready.asia/{auditId}` + QR) | This is the actual product being sold — an externally verifiable credential. A certificate with a QR code that resolves to nothing is a broken promise to the end customer's investors/buyers/banks. | New public route group, Sprint 6 (§3.3, §6) |
| **SOP workflow** — present in the backend/frontend structure but never assigned to a sprint | Silent scope creates the highest-risk kind of gap: work everyone assumes is "in there somewhere." | Explicitly assigned, Sprint 8 |
| **TP-as-tenant architecture question** — are audit firms internal users or their own semi-independent orgs? | This is a data-model decision, not a UI decision. Getting it wrong means re-architecting mid-build, not after. | Resolved explicitly in §0.3 and §1.5 |
| Lead capture on paywall hit, employee-count auto-bypass rule, bilingual company name field | Smaller, but each is a specific business rule the blueprint hard-codes. Silently missing them fails UAT, not code review. | Folded into Sprints 2–3 as named acceptance criteria |

### 0.3 Architecture decision: Third-Party Partners are their own tenant type

The blueprint models TPs as independent audit *firms* (ADMIT Global, KPMG Cambodia, BDO Cambodia, Mekong Strategic Partners, Sophea & Associates) — each with their own pricing, reputation, and staff. v2's data model treated an auditor as a `User` with an `auditor` role and nothing more, which only supports a single internal audit team.

**v3 resolves this explicitly: TP Partners are a second, lighter tenant type, structurally parallel to `companies`.**

- A `tp_partners` table represents the *firm* — confirmed from the blueprint's own data structure: five seeded demo firms — ADMIT Global Audit, KPMG Cambodia, BDO Cambodia, Mekong Strategic Partners, Sophea & Associates — each with `expertise` (food_cert / finance_audit / internal_control), `rating`, `reviewCount`, and **per-level pricing**. **Correction per §0.5: the specific dollar figures in the mockup ($199–$999 range) are demo placeholder data, not pricing requirements** — what's confirmed is the *mechanic* (each firm sets its own L2/L3/L4 price, editable via their own portal in Sprint 7), not any particular number. Same for the **20% "special" discount** shown in the UI — the discount mechanic is real, the 20% figure is not a confirmed business decision.
- Individual auditors remain `users`, but now carry a `tp_partner_id` FK, so a firm can have multiple staff auditors under one organizational identity.
- **Confirmed (owner decision, correcting the earlier v3 assumption): ADMIT Global is both a regular marketplace vendor *and* the platform's hardcoded master certifying authority.** Re-reading the blueprint's actual certificate/report generation code confirms this is not incidental mockup styling — every certificate and report, regardless of which TP partner performed the underlying document review, is stamped:
  - `"Verified by: ADMIT UNIT Master Auditors"`
  - `"Approved by: ADMIT Global Executive"`
  - `"Prepared by: 2bReady Trust Engine Powered by ADMIT Global"`

  This means the data model needs **two distinct ADMIT-related concepts**, not one:
  1. **`ADMIT Global Audit` — `tp_partners` row #1**, hireable/rateable exactly like the other four firms, for the actual document-review work a company pays for.
  2. **A platform-level `master_verification_authority` setting** (simple config, e.g. `platform_settings` key/value, not a new domain) that every issued certificate/report references for its "Verified by / Approved by / Powered by" footer text — independent of which TP partner (if any) was hired for that specific audit. This is issued by `CertificateGenerationService` (§1.6) as a fixed stamp, not derived from the `tp_hires` record.
  3. **`ADMIT Unit` is a third, separate concept — confirmed from the blueprint as a consulting lead-generation feature**, not part of the marketplace at all: a "Request Consultation" CTA (`captureLead('ADMIT_Unit')`) that appears on the SOP page and is auto-triggered when a company has been active 14+ days with 0% pathway progress. This is a `Lead` domain entry with `source: 'admit_unit_upsell'`, not a `TpPartner` or `Marketplace` record.

This single decision is why v3 needed a full rewrite rather than an addendum: it changes the `Audit` domain's foreign keys, the RBAC model, and the marketplace/matchmaking logic all at once. Better to resolve it now than mid-Sprint-4.

### 0.4 Re-verification pass (July 2026) — corrections made against source

This proposal was re-checked line-by-line against the actual blueprint source file and the actual v2 document text, rather than from summarized memory of them. Several details in the previous draft were approximate or, in one case, an unlabeled assumption presented as fact. Corrected here for transparency:

| Item | Previous draft said | Verified/corrected to |
|---|---|---|
| ADMIT Global | Standard vendor only, no special branding | **Both a standard vendor AND the platform's hardcoded master verification authority on every certificate** — confirmed from actual certificate-generation code, not assumption (§0.3) |
| Certificate QR/verify URL | Would use a separate non-guessable `public_verification_id` | **Blueprint confirmed uses the audit ID directly** (`verify.2bready.asia/{auditId}`); the separate-ID approach was my own security recommendation, mislabeled as settled fact — now explicitly flagged as optional, not required (§1.6) |
| Employee bypass rule | Bypasses "Internal Regulations" category | **Bypasses the specific "Company Internal Rules" document** — narrower than previously stated |
| Vault auto-lock | Generic "auto-lock timer" | **Confirmed: 6-digit PIN, 3-minute inactivity timeout, and finance-role access is further restricted to self-uploaded sensitive documents only** |
| TP partner pricing | Not specified / assumed generic | **Confirmed exact figures for all 5 seeded firms** (§0.3), plus a confirmed 20%-off "special price" UI pattern |
| DataRoom secure links | Not detailed | **Confirmed: 7-day expiry, auto-generated password shown at creation** |
| ADMIT Unit | Not previously distinguished from ADMIT Global | **Confirmed as a separate consulting lead-capture feature**, auto-triggered after 14 days of 0% pathway progress |

Everything else in §§1–6 was checked and found consistent with source; unchanged.

### 0.5 Mockup data vs. confirmed mechanics — no static values in production

An important correction to the re-verification pass above: confirming a detail "from the blueprint source" only means **the mechanic is real** — it does not mean the specific number or string attached to it in the mockup is a business requirement. A prototype author typing `$299`, `< 8 employees`, `3 minutes`, or `20% discount` into demo code is sample data for making the mockup look believable, not a signed-off business rule. Treating those literal values as "confirmed" — as the §0.4 table above partly did — overstates certainty exactly the way this rebuild was meant to eliminate.

**The corrected rule going forward: the *existence* of a mechanic can be confirmed from source; the *specific value* attached to it cannot, and must never be hardcoded in production code.** Every business-tunable value below moves into admin-editable configuration, with the mockup's number kept only as a sensible seed default:

| Mechanic (confirmed real) | Mockup's placeholder value (NOT a requirement) | Production treatment |
|---|---|---|
| Employee-count bypass rule exists | Threshold of 8 | `platform_settings.bypass_employee_threshold` — admin-editable, seeded at 8 |
| TP partners have per-level pricing | $199–$999 range across 5 firms | `tp_partners.price_l2/l3/l4` — each firm sets their own via their portal (Sprint 7), not seeded as fixed platform values |
| Marketplace shows a discounted "special" price | 20% off | `tp_partners.discount_percent` or a platform-wide promo setting — admin-editable, not a hardcoded `× 0.8` in code |
| Vault auto-locks after inactivity | 3 minutes | `platform_settings.vault_auto_lock_minutes` — admin-editable |
| Vault PIN length | 6 digits | Configurable PIN policy, not a hardcoded `maxlength` |
| DataRoom links expire | 7 days | `platform_settings.data_room_link_expiry_days` — admin-editable |
| ADMIT Unit upsell auto-triggers | 14 days at 0% progress | `platform_settings.admit_unit_trigger_days` — admin-editable |
| Company default employee count | 42 (demo seed only) | No production meaning whatsoever — pure mockup artifact, ignore entirely |
| Certificate master-verifier stamp text | "ADMIT UNIT Master Auditors" / "ADMIT Global Executive" | Already correctly scoped as `platform_settings` (§0.3) — reconfirmed here as the right pattern, not an exception |

This has one direct effect on Sprint scope (§3.3): **every sprint touching these mechanics (Sprints 2, 5, 6, 7) needs a lightweight admin settings screen for its threshold(s), not a hardcoded constant** — small additional scope, but the alternative (hardcoding the mockup's numbers) creates exactly the kind of static-data problem that would need a code deploy every time the business wants to change a number like a discount rate or a lock timeout.

### 0.6 Going beyond the blueprint: designed to scale past Cambodia F&B

The blueprint is Cambodia-F&B-specific by necessity (NSSF, MoC, ISIC codes, CAS accounting). The architecture underneath it should not be. v3 makes the compliance taxonomy, journey levels, and document requirements **configuration, not code**, so a second country or industry vertical is a data-entry exercise, not a rebuild. Details in §1.8.

### 0.7 Addendum (2026-07): a company_owner can now own more than one company

Discovered as a real gap, not a hypothetical: as originally built (Sprint 1–3), `users.company_id` is a single nullable foreign key — a company_owner belongs to exactly one company, enforced both by the schema and by `CompanyPolicy::registerOwn()` explicitly blocking self-registration of a second company once `company_id` is set. This matches a solo-SME assumption the blueprint never actually stated one way or the other; it just wasn't questioned until now. **Confirmed direction going forward: one person can own multiple companies** — an agency, holding company, or serial founder running more than one SME through a single 2bReady login, switching between them the way Slack/GitHub let one account move between workspaces/orgs.

**Architecture decision, resolved the same way §0.3 resolved TP-as-tenant — before it compounds, not after:**

- **`users.company_id` is replaced by a `company_user` pivot table** (`user_id`, `company_id`, timestamps) — true many-to-many. `RegisterOwnCompanyAction` no longer overwrites a single column; it adds a new membership row, and the old "block if already has a company" policy guard is removed since having one no longer disqualifies registering another.
- **A new `users.current_company_id`** (nullable FK) becomes the "active company" — the single thing every tenant-scoped query still needs to resolve to exactly one company per request. This is what `BelongsToCompany`, `ScopeToCompany`, and `EnsureCompanyIsActive` read from now, instead of the old `company_id`. A new "switch active company" endpoint validates the target is in the caller's own `company_user` memberships before updating it.
- **Roles stay global, not per-company.** spatie/laravel-permission's `teams` feature (config `teams => false`, unchanged) is deliberately *not* being turned on for this: nothing in the product today assigns a user a different role per company, and there's no invite-another-owner's-company flow yet to justify that complexity. `company_owner` simply describes the kind of user; the pivot table alone describes which companies they're linked to.
- **This is the same class of decision as §0.3 for exactly the same reason**: it touches the multi-tenancy boundary itself (`BelongsToCompany`, the single most safety-critical trait in the backend per its own documented rule — see `2bready-api/CLAUDE.md` Rule #1), the frontend auth store/routing (`user.company_id` becomes `user.companies[]` + `current_company_id`, and the existing "redirect owner without a company to /setup" logic needs to key off "zero memberships" instead of "company_id is null"), and retroactively touches Sprint 2 (Company Management), which already shipped against the single-company assumption. Resolving the schema now, rather than letting more sprints build on the old assumption, avoids a much larger retrofit later.

---

## 1. Technology Proposal

[#1-technology-proposal](#1-technology-proposal)

### 1.1 Overview & Objectives

Unchanged from v2's engineering priorities — performance, security, scale-out architecture — with one addition made explicit as a fourth priority given §0.4: **configurability**, so the compliance taxonomy that is currently Cambodia-F&B-specific can expand to new countries or industries without a rewrite.

### 1.2 Proposed Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend API | Laravel 11 (PHP 8.3) | REST/JSON API, business logic, RBAC, queue orchestration, scoring engine |
| Frontend | Next.js 15 (App Router, TypeScript) | Admin back office, company portal, auditor/TP portal, public verification pages |
| UI Library | MUI v9.1.2 + Tailwind CSS v4 | Enterprise React components; CSS-variable theming, light/dark out of the box |
| Database | PostgreSQL 16 | Primary store; JSONB for config/feature flags; row-level multi-tenant constraints |
| Primary Keys | ULID (26-char) | Sortable, URL-safe, non-enumerable |
| Auth | Laravel Sanctum + spatie/laravel-permission | SPA token auth; role & permission-based access |
| Cache / Queue | Redis + Laravel Horizon | Sessions, score calculation queue, notifications, TP matchmaking queries |
| File Storage | S3-compatible object storage | Documents, certificates, badge assets, generated PDFs |
| Realtime | Laravel Reverb (WebSockets) | Live notifications, audit status, TP hire status |
| Search (phase 2) | Laravel Scout + Meilisearch | Company/document/TP-partner search at scale |
| API Docs | Scramble (OpenAPI 3) | Auto-generated, always-current API reference |
| PDF Generation | Laravel Snappy / Spatie Browsershot | Certificate & report generation (§1.6) |
| QR Generation | Simple QrCode (Laravel) | Certificate verification QR codes, server-generated not client-side |
| Testing | Pest / Jest + RTL / Playwright | Unit, feature, component, E2E |
| CI/CD | GitHub Actions | Lint → static analysis → test → build → deploy |
| Containerization | Docker + docker-compose | Environment parity |
| Observability | Telescope (dev), Sentry, Laravel Pulse | Error tracking, performance, queue health |

*Two additions vs v2: server-side PDF and QR generation, required for the certificate/verification feature (§0.2) that v2 didn't scope.*

### 1.3 High-Level Architecture

Unchanged from v2: Next.js as presentation layer only, all reads/writes through versioned `/api/v1/*`, Laravel owns auth/authorization/domain logic/background jobs, PostgreSQL is the single source of truth. One addition: a **public, unauthenticated route surface** (`/api/v1/public/*` and the `(public)` Next.js route group) for certificate verification — deliberately isolated from the authenticated API surface so it can be cached aggressively and rate-limited independently without affecting the authenticated app.

### 1.4 Why This Stack

Unchanged from v2 (§1.4) — still holds.

### 1.5 Enterprise-Grade, Reusable Project Structure & Design Patterns

Backend and frontend remain two independently deployable repositories in lockstep via the generated OpenAPI contract, per v2. The domain list below **extends** v2's backend structure with the domains required to close the gaps in §0.2, and reflects the TP-as-tenant decision in §0.3.

#### Backend — new/changed domains vs v2

```
app/Domain/
│
├─ TpPartner/                          ← NEW: the audit firm/vendor org itself
│  ├─ Actions/       (RegisterTpPartnerAction, ApproveTpPartnerAction,
│  │                   UpdateTpPricingAction, SuspendTpPartnerAction)
│  ├─ Models/         (TpPartner.php — parallel structure to Company.php)
│  ├─ DTOs/           (TpPartnerData.php)
│  ├─ Enums/          (TpPartnerStatus.php, TpExpertise.php — food_cert, finance_audit, internal_control)
│  └─ Policies/       (TpPartnerPolicy.php)
│
├─ Marketplace/                        ← NEW: the two-sided hire/rate mechanic
│  ├─ Actions/        (HireTpPartnerAction, UnhireTpPartnerAction, RateTpPartnerAction)
│  ├─ Models/          (TpHire.php, TpRating.php)
│  ├─ Services/
│  │  └─ TpMatchmakingService.php       (filters TP partners by expertise, rating, price, availability —
│  │                                      pure query service, no side effects; UI calls this to render
│  │                                      the marketplace list, same pattern as ComplianceScoreCalculator)
│  └─ Enums/           (TpHireStatus.php — active, completed, cancelled)
│
├─ Vault/                              ← NEW: sensitive-document access control
│  ├─ Actions/         (RequestVaultUnlockAction, VerifyVaultPinAction, ResetVaultPinAction)
│  ├─ Models/          (VaultUnlockLog.php)
│  ├─ Services/
│  │  └─ VaultAutoLockService.php       (evaluates idle timeout, called from a scheduled job —
│  │                                      same "evaluator, not mutator" split as ComplianceScoreCalculator)
│  └─ Enums/           (VaultLockReason.php — timeout, manual, role_change)
│
├─ LegalConsent/                       ← NEW: restricted-document access gating
│  ├─ Actions/         (RecordLegalConsentAction.php)
│  └─ Models/          (LegalConsent.php — versioned consent text, so old consents remain valid evidence
│                        even after terms are updated)
│
├─ Lead/                               ← NEW: paywall/upgrade lead capture
│  ├─ Actions/         (CaptureLeadAction.php)
│  └─ Models/          (Lead.php — source enum: paywall, marketing_site, referral,
│                        admit_unit_upsell — the last confirmed from blueprint as a
│                        consulting CTA auto-triggered after 14 days at 0% pathway progress,
│                        distinct from a TP marketplace hire)
│
├─ Audit/                              ← CHANGED from v2
│  ├─ Actions/          (AssignAuditorAction unchanged, plus IssueCertificateAction — NEW)
│  ├─ Models/           (Audit.php, Auditor.php — Auditor now also carries tp_partner_id FK,
│  │                     nullable for a future in-house-only audit path)
│  └─ Services/
│     └─ CertificateGenerationService.php   (NEW — renders PDF + QR, writes to object storage,
│                                              per confirmed blueprint behavior — see §1.6)
│
├─ TrustBadge/                         ← CHANGED from v2
│  ├─ Actions/          (IssueTrustBadgeAction.php — now also triggers CertificateGenerationService)
│  └─ Models/           (TrustBadge.php — adds audit_id reference, qr_payload_url)
│
├─ PublicVerification/                 ← NEW: the unauthenticated verification surface
│  ├─ Actions/          (VerifyCertificateAction.php — looks up by audit_id, per confirmed
│  │                      blueprint URL pattern (§1.6); no auth, heavily cached, rate-limited)
│  └─ Controllers live under Http/Controllers/Api/V1/Public/ (see §1.5 routing note)
│
└─ Sop/                                ← UNCHANGED from v2, now explicitly scheduled (§3.3)
```

Existing v2 domains (Company, User, Package, Payment, Journey, Document, Notification, Support, AuditLog, DataRoom, Shared) are unchanged in structure, with three additions:

- `Company` model gains `name_kh`, `employee_count`, and a `bypass_flags` JSONB column. **The mechanic is confirmed** (an employee-count threshold bypasses the "Company Internal Rules" document, not a whole "Internal Regulations" category as the settings UI copy loosely suggests) — **but per §0.5, the mockup's threshold of 8 is a placeholder, not a confirmed business rule.** `EmployeeCountBypassRule` (inside `Journey/Services/`) reads the threshold from `platform_settings.bypass_employee_threshold` (admin-editable, seeded at 8) rather than hardcoding the number, following the same rule-engine pattern already used for milestone unlocks.
- `MilestoneUnlockRuleEngine` (Journey domain, unchanged location) gains one more strategy: bypass rules are evaluated *before* the standard unlock rules, so a bypassed milestone never appears as "required" to begin with.
- **`User` model gains a `companies()` many-to-many relation** (through the new `company_user` pivot, §0.7) replacing the old single `company()` belongs-to, plus a `currentCompany()` belongs-to via the new `current_company_id` column. `Company/Actions/SwitchActiveCompanyAction` (NEW) validates the target company against the caller's own memberships and updates `current_company_id` — this is the only write path allowed to change it.

#### Backend structure rules — one addition to v2's list

- **A second tenant boundary now exists.** `BelongsToCompany` remains the boundary for company-scoped data. A new `BelongsToTpPartner` trait/global scope, structurally identical, is the boundary for TP-partner-scoped data (their staff, their pricing, their hire history). These two boundaries never overlap on the same table — a table is scoped to one tenant type or the other, never both — keeping the "one boundary per concern" rule from v2 intact rather than compromising it.
- **Public routes never touch an authenticated model directly.** `PublicVerification/Actions/VerifyCertificateAction` reads from a narrow, denormalized lookup by `audit_id` (confirmed URL pattern, §1.6) — it returns only certificate-safe fields, never a company's other documents or unrelated internal data. This is a deliberate, minimal read surface, not a relaxed authorization check on the main API.

#### Frontend — additions to v2's structure

```
src/app/
├─ (public)/                           ← NEW: unauthenticated, cacheable, no dashboard chrome
│  └─ verify/[verificationId]/page.tsx  (renders the certificate/report exactly as shown in the
│                                         blueprint's showCertificate()/showReport() modals, but as a
│                                         real, linkable, SSR page — this is what the QR code opens)
├─ (dashboard)/
│  ├─ company/
│  │  └─ marketplace/page.tsx          ← NEW: browse/hire/rate TP partners
│  ├─ tp-partner/                      ← NEW role-guarded section: tp_admin, tp_staff
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                      (dashboard: active hires, pending reviews)
│  │  ├─ pricing/page.tsx
│  │  └─ assignments/page.tsx
│  └─ admin/
│     └─ tp-partners/page.tsx          ← NEW: admin approves/onboards TP firms

src/domains/
├─ tp-partner/, marketplace/, vault/, legal-consent/, lead/    ← NEW, same api.ts/hooks.ts/schemas.ts/types.ts shape as every other domain
```

### 1.6 Certificate & Public Verification — Technical Approach

This is the feature the blueprint treats as central and v2 didn't scope, so it gets its own subsection. Corrected against the actual blueprint source (previous draft of this section contained an unverified assumption, flagged below):

1. `IssueTrustBadgeAction` fires on audit approval (unchanged trigger from v2).
2. It now additionally dispatches `GenerateCertificateJob` (queued, not inline — PDF rendering is slow work and must never block the request thread).
3. `CertificateGenerationService` renders the certificate/report as HTML (bilingual EN/KH — **confirmed**: the blueprint's certificate header literally renders both `"2BREADY TRUST AUDIT CERTIFICATE"` and its Khmer equivalent) via a Blade template, converts to PDF, generates a QR code, and stores both in object storage.
4. **The certificate footer always stamps the master verification authority** (§0.3) — `"Verified by: ADMIT UNIT Master Auditors"`, `"Approved by: ADMIT Global Executive"`, `"Prepared by: 2bReady Trust Engine Powered by ADMIT Global"` — regardless of which TP partner was hired for that audit. This is a fixed template value from `platform_settings`, not derived from the `tp_hires` record.
5. **QR code and verification URL — confirmed directly from blueprint source, correcting an earlier assumption in this proposal:** the QR code encodes `https://verify.2bready.asia/{auditId}` — the audit's own identifier, used directly. My earlier draft of this section claimed a separate, non-guessable `public_verification_id` would be used instead; that was **my own security recommendation, not something confirmed in the blueprint, and it was wrongly presented as settled fact.** Flagging clearly now: 
   - **If following the blueprint exactly (per owner instruction to follow the blueprint for certificates):** the public verify route is `/{auditId}` directly, and `audits.id` (ULID) is exposed in the public URL/QR code as-is.
   - **Recommendation, clearly labeled as a recommendation, not a requirement:** ULIDs are already non-sequential and hard to guess in practice, so exposing the audit ID directly is a reasonable, low-risk simplification — not a security gap that needs solving before MVP. Worth a one-line confirmation with the owner, but does not need to block Sprint 6.
6. The public verify page is statically cacheable per audit ID (certificates don't change after issuance) — served from CDN edge, not hitting the API on every scan.

### 1.7 Development Rules, Coding Standards, Multi-Language Strategy

Unchanged from v2 (§1.6, §1.7) in full — these rules were already correct and apply equally to the new domains.

### 1.8 Configurability & Multi-Vertical Readiness (new in v3)

This directly answers "dynamic scaling" beyond server/traffic scaling:

- **Journey templates are data, not code.** `journey_templates` (new table, parent of the existing `journeys`/`journey_levels`/`milestones`) lets a `country_code` + ~~`industry_code`~~ **`industry_id`** pair select a different P1–P4 taxonomy. Cambodia F&B ships as the first template at MVP; a second vertical (e.g. Cambodia manufacturing, or a second country) is a data-entry and translation exercise against the existing schema, not a schema change.
- **Industry is now a first-class top-level domain, not a free-text field — UPDATED (2026-07-10), supersedes every `industry_code` reference elsewhere in this document.** Originally scoped (Sprint 2, §3.3) as a generic-but-plain `industry_code` string column on `companies`, matching `country_code`. Mid-build, the owner reframed it: **industry is the top layer everything else varies by** — not just Company, but Package pricing/catalog and (per this section) journey templates too. It was rebuilt as its own `App\Domain\Industry` backend domain (model, admin CRUD at `/api/v1/industries`, a public read-only `/api/v1/industry-options` for unauthenticated onboarding flows) with a real `industries` table, seeded with the same coarse categories originally planned as a hardcoded option list (F&B, Retail, Manufacturing, Services, Other — not the full CSIC dataset, still deferred). `companies.industry_id` and `packages.industry_id` are real FKs now; the old `industry_code` string column was dropped from `companies` entirely (dev-stage, no backfill needed) rather than kept as a parallel denormalized field. **Implication for Sprint 4:** `journey_templates` should be built keyed by `(country_code, industry_id)` from the start, referencing the real `industries` table — not the free-text `industry_code` this section originally described.
- **Document taxonomy is already template-driven** (`document_templates`, per v2) — this was already correct and simply needs its content populated per journey template rather than globally.
- **The `MilestoneUnlockRuleEngine` strategy pattern (already in v2) is the seam for future automation** — e.g. auto-verifying a document against a government e-filing API (Cambodia GDT, MoC registry) is a new strategy implementation behind the existing interface, not a rearchitecture. Flagged here as a natural Phase 2 (post-MVP) integration, not in MVP scope.
- **Packages/feature flags (JSONB, already in v2) now also gate marketplace and vault access**, consistent with how they already gate journey levels — no new gating mechanism introduced.

---

## 2. Contract & Payment Terms

[#2-contract--payment-terms](#2-contract--payment-terms)

Structure unchanged from v2 (§2.1, §2.3–§2.8: fixed-price milestone engagement, Net 7 invoicing, Change Request policy, IP transfer on payment, 30-day warranty, confidentiality/termination terms all carry over as written). **Only the payment schedule (§2.2) changes**, to reflect the added ninth sprint from §3.

### 2.2 Payment Schedule (revised)

| Phase | Milestone | % of Contract | Trigger / Deliverable |
|---|---|---|---|
| Phase 0 | Kickoff & Discovery | 10% | Contract signed; technical discovery, environment setup, finalized backlog **including the TP-as-tenant decision and other open questions in §7 resolved in writing** |
| Phase 1 | Sprints 1–2 — Foundation | 15% | Auth (TOTP 2FA), RBAC, Admin Dashboard, Company Management (incl. bilingual name, employee-count bypass) complete & demoed |
| Phase 2 | Sprints 3–5 — Core Journey | 25% | Packages/Payments/Lead Capture, Journey Builder, Document Upload, Vault, Legal Consent & Smart Data Room complete & demoed |
| Phase 3 | Sprints 6–7 — Audit, Trust & Marketplace | 25% | Audit workflow, Trust Badge issuance, Certificate generation, Public Verification page, TP Marketplace (onboarding/pricing/hire/rate) complete & demoed |
| Phase 4 | Sprint 8 — Notifications, Support, SOP & Reporting | 10% | Notifications, support ticketing, SOP sign-off workflow, reporting dashboard complete & demoed |
| Phase 5 | Sprint 9 + UAT & Go-Live | 10% | QA/security/load testing, UAT sign-off, production deployment live |
| Phase 6 | Warranty Holdback | 5% | Released after 30-day post-launch warranty with no unresolved critical defects |

*Note: the warranty holdback drops from 10% to 5% and Phase 1 rises from 10% to 15% — a minor rebalancing so the added marketplace/certificate scope in Phase 3 isn't underfunded relative to its actual complexity. Confirm this split works commercially before signing.*

---

## 3. Development Plan

[#3-development-plan](#3-development-plan)

### 3.1 Team Composition

Same roles/allocation as v2 (§3.1), with one addition: **UI/UX Designer allocation extends through Sprint 7** (was Sprints 1–6 in v2) to cover the marketplace and certificate/verification page designs, which didn't exist in v2's scope.

### 3.2 Methodology

Unchanged: Agile Scrum, 2-week sprints, sprint planning/standups/mid-sprint check-in/review/retro per sprint.

### 3.3 Scope by Module (revised — 9 sprints, up from 8)

| Sprint | Module | Key Scope / User Stories | Priority | Risk |
|---|---|---|---|---|
| 1 | Authentication, Roles, Dashboard | Login + TOTP 2FA + recovery codes · RBAC · Admin dashboard shell · Audit log foundation | ★★★★ | Medium |
| 2 | Company Management | Company CRUD, bilingual profile (EN/KH), employee count + auto-bypass rule, status, progress view. **~~`industry_code`~~/`country_code` built as generic, non-Cambodia-locked fields per confirmed multi-vertical roadmap (§7, item 4) — industry field since rebuilt as `industry_id` FK to a real Industry domain, see §1.8 update (2026-07-10).** | ★★★★ | Low |
| 3 | Packages & Payment Activation | Package management · Stripe + ManualBankTransfer · subscription activation · **paywall lead capture form** | ★★★★★ | Medium |
| 4 | Journey Builder & Unlock Logic | Journey/level/milestone builder · MilestoneCompletion tracking · rule engine (incl. bypass strategy) · journey activation by plan | ★★★★★ | **High** ⚠️ |
| 5 | Documents, Vault, Legal Consent & Data Room | Template setup · signed S3 upload · **Vault PIN unlock + auto-lock (admin/finance)** · **legal consent gating for P3/P4** · Smart Data Room | ★★★★★ | **High** ⚠️ (expanded from v2's Medium) |
| 6 | Audit, Trust Badges & Public Verification | Auditor assignment & review workflow · compliance score recalculation · **certificate/report generation (PDF+QR)** · **public verification page** | ★★★★★ | High |
| 7 | TP Marketplace | **TP partner onboarding/approval · per-level pricing · hire/unhire flow · ratings & reviews · matchmaking list** | ★★★★ | **High** ⚠️ (new) |
| 8 | Notifications, Support, SOP & Reporting | Email/in-app notifications · support ticketing · **SOP sign-off workflow** · reports & analytics dashboard | ★★★ | Low |
| 9 | QA, Security & Deployment | Full regression QA · security review · load testing (k6) · dependency scan · production deployment | ★★★★ | Medium |

Three sprints now carry **High** risk instead of v2's single Sprint 4 — this is the honest cost of scoping the marketplace, vault, and certificate features properly rather than squeezing them into the original 8-sprint estimate. See mitigation notes below.

### 3.4 Task Schedule (revised)

Total MVP build: 9 sprints × 2 weeks = 18 weeks, plus 2-week UAT/hardening & go-live buffer — **approximately 5 months end to end** (up from 4.5 months in v2).

| Sprint | Duration | Weeks | Focus | Payment Phase |
|---|---|---|---|---|
| Kickoff | 1 week | W0 | Discovery, environment/repo setup, backlog sign-off, open questions (§7) resolved | Phase 0 |
| Sprint 1 | 2 weeks | W1–W2 | Auth, Roles, Dashboard | Phase 1 |
| Sprint 2 | 2 weeks | W3–W4 | Company Management | Phase 1 |
| Sprint 3 | 2 weeks | W5–W6 | Packages & Payment Activation | Phase 2 |
| Sprint 4 | 2 weeks | W7–W8 | Journey Builder & Unlock Logic | Phase 2 |
| Sprint 5 | 2 weeks | W9–W10 | Documents, Vault, Legal Consent & Data Room | Phase 2 |
| Sprint 6 | 2 weeks | W11–W12 | Audit, Trust Badges & Public Verification | Phase 3 |
| Sprint 7 | 2 weeks | W13–W14 | TP Marketplace | Phase 3 |
| Sprint 8 | 2 weeks | W15–W16 | Notifications, Support, SOP & Reporting | Phase 4 |
| Sprint 9 | 2 weeks | W17–W18 | QA, Security, Deployment prep | Phase 4 |
| UAT / Go-Live | 2 weeks | W19–W20 | User acceptance testing, hardening, production launch | Phase 5 |
| Warranty | 4 weeks | W21–W24 | Post-launch monitoring & free defect fixes | Phase 6 |

### 3.5 QA Strategy & Definition of Done

Unchanged from v2 (§3.5).

### 3.6 Risks & Assumptions (revised)

Carries over v2's assumptions on UAT feedback windows, Stripe/gateway timing, and mid-sprint scope handling unchanged. Updated risk items:

- **Sprint 4 (Journey Builder) remains the highest-complexity single sprint** — same mitigation as v2: ship a simplified admin-signoff unlock first, layer in the automated rule engine in Week 2.
- **Sprint 5 (Vault/Legal Consent added) now carries High risk**, not Medium — three distinct security-sensitive flows (signed upload, PIN vault, consent gating) in one sprint. **Mitigation:** Vault and Legal Consent are built as thin, isolated domains (§1.5) that layer on top of the existing Document/DataRoom flow rather than modifying it, so a delay in one doesn't block the other two.
- **Sprint 6+7 (Trust Badges/Verification, then Marketplace) are new High-risk sprints** because they depend on the TP-as-tenant architecture decision (§0.3) being finalized at kickoff — if that decision changes mid-build, both sprints are affected. **Mitigation:** this decision is a Phase 0 exit criterion (§2.2), not something resolved during Sprint 6 itself.
- **Certificate generation (Sprint 6) depends on final certificate copy/design (bilingual) being ready before the sprint starts** — same dependency pattern as v2's compliance-framework assumption for Sprint 5; flagged here for Sprint 6 instead.
- Any scope added mid-sprint is still deferred to the next sprint or handled via Change Request (§2.5) — this discipline matters more, not less, now that the estimate is tighter around real scope.
- **Taxonomy finalization (§7, item 3) is the single largest schedule risk in this plan, currently unresolved.** It does not block Sprint 4 (the rule engine is built generically either way), but it is a hard gate for Sprint 5 (W9) — document template content cannot be entered without it. This is tracked as an active risk, not a resolved one, and should be revisited at the end of every sprint retro until closed.

---

## 4. Performance, Security & Scalability Architecture

[#4-performance-security-scalability-architecture](#4-performance-security-scalability-architecture)

Sections 4.1 (Performance Engineering) and 4.3 (Scalability & High Availability) carry over from v2 **unchanged and in full** — the SLO targets, indexing/caching/queueing practices, PgBouncer pooling, horizontal scale-out, and multi-tenancy growth path were already correctly designed for this product and don't need revision. Two additions:

### 4.2 Security Architecture — additions for Vault & Marketplace

Everything in v2's §4.2 (Sanctum, mandatory TOTP 2FA, dual-layer authorization, OWASP Top 10 mapping, encryption in transit/at rest, immutable audit log) carries over unchanged and now also covers the new domains. New, specific to v3's added scope:

- **Vault PIN storage**: hashed with bcrypt (same standard as DataRoom PINs in v2), never logged, never returned in any API response — the `VerifyVaultPinAction` compares hashes server-side only. Auto-lock timeout is enforced server-side via `VaultAutoLockService`, not trusted to a frontend timer.
- **Legal consent records are themselves audit-log entries** — `RecordLegalConsentAction` writes to both `legal_consents` (the durable record, tied to a specific consent-text version) and `audit_logs` (the access-trail entry), so a consent can be proven even if the LegalConsent row were ever disputed.
- **TP Partner onboarding requires the same admin-approval gate as company activation** — a TP partner cannot self-activate into the marketplace; `ApproveTpPartnerAction` is an explicit admin action, preventing an unverified "audit firm" from appearing credible to companies.
- **Public verification endpoints are the only unauthenticated surface in the system** and are treated accordingly: separate, tighter rate limiting; response payload is a strict allow-list (never a full model serialization); no database write ever occurs on this path except the access-log entry.

### 4.4 Configurability as a Scaling Dimension (new)

v2's scalability section addressed *load* scaling (more tenants, more traffic). v3 adds the dimension the blueprint's own ambition implies: **scaling to new compliance verticals without a rewrite**, detailed in §1.8. This is listed here because it's a scalability property, not a feature: the journey-template/document-template separation means adding "2bReady Vietnam" or "2bReady Manufacturing" post-MVP is bounded by content and translation work, not by backend re-architecture — the same claim v2 made for tenant count now also holds for taxonomy breadth.

---

## 5. Entity Relationship Diagram (ERD)

[#5-entity-relationship-diagram-erd](#5-entity-relationship-diagram-erd)

All v2 entities (§5.1) and design notes (§5.2) carry over unchanged — companies, users, roles/permissions, packages, subscriptions, payments, journeys/journey_levels/milestones, milestone_completions, document_templates, documents, auditors, audits/audit_documents, trust_badges, data_room_links, notifications, support_tickets/ticket_messages, sops/sop_signoffs, audit_logs. ULID-everywhere, soft-deletes on audit-sensitive tables, integer-cents money, enum-backed status fields with CHECK constraints — all unchanged and correct.

### 5.1 New Entities (v3)

| Entity | Purpose |
|---|---|
| `journey_templates` | Parent of `journeys`; keyed by `(country_code, industry_id)` (updated 2026-07-10 — real FK to the `industries` table, not the free-text `industry_code` this row originally specified; see §1.8). Enables a second vertical/country without a schema change (§1.8). |
| `tp_partners` | The audit firm/vendor organization — parallel structure to `companies`. Holds name (EN/KH), expertise tags, authorization status, per-level pricing (JSONB: `{L2: cents, L3: cents, L4: cents}`). |
| `tp_hires` | `company_id`, `tp_partner_id`, `journey_level`, `price_agreed_cents`, `status`, `hired_at`, `completed_at`. Records the marketplace transaction. |
| `tp_ratings` | `tp_hire_id`, `company_id`, `tp_partner_id`, `rating` (1–5), `review_text`, `created_at`. One rating per completed hire. |
| `vault_unlock_logs` | `user_id`, `company_id`, `unlocked_at`, `locked_at`, `lock_reason` (timeout/manual/role_change). **Confirmed specifics from blueprint**: PIN is 6-digit numeric; auto-lock fires after **3 minutes of inactivity** (hardcoded `setTimeout` in the prototype — treat as a configurable default, not a fixed constant, in production); unlock is available to `admin` and `finance` roles, but **finance access is further restricted** — a finance-role user cannot view a sensitive document unless they were the one who uploaded it (`uploadedBy === 'finance'`), confirmed in the prototype's document-visibility check. |
| `legal_consents` | `user_id`, `company_id`, `pathway_level`, `consent_text_version`, `accepted_at`, `ip_address`. **Confirmed consent text from blueprint**: *"I agree to the Terms of Use — I confirm authorization and will use this document for legitimate business purposes. It contains confidential information,"* tied to a reference to 2bReady's Data Protection Policy. |
| `leads` | `name`, `email`, `company_name`, `phone`, `message`, `requested_tier`, `source` (paywall/marketing_site/referral/**admit_unit_upsell** — confirmed, see §0.3), `status`, `created_at`. |
| `certificates` | `trust_badge_id` FK, `audit_id` FK (QR/verify URL uses this directly per confirmed blueprint behavior — see §1.6 note on the `public_verification_id` idea being a labeled recommendation, not a requirement), `pdf_url`, `qr_payload_url`, `issued_at`, `master_verifier_stamp` (denormalized snapshot of the platform verifier text at time of issuance, so historical certificates don't change if the platform setting is later updated). Extends `trust_badges` rather than overloading it. |
| `company_user` (NEW, §0.7) | `user_id`, `company_id`, timestamps. Replaces `users.company_id` as the membership record — true many-to-many, so one person can be linked to more than one company. No `role` column here: roles stay global (spatie/laravel-permission, `teams => false`, unchanged), this table only tracks *which* companies a user is linked to. |
| `users.current_company_id` (NEW, §0.7) | Nullable FK to `companies`, added to the existing `users` table (not a new table). The one thing every tenant-scoped query resolves against — `BelongsToCompany` reads this instead of the old `company_id`. Changed only via `SwitchActiveCompanyAction`, which validates the target is in the caller's own `company_user` rows first. |

### 5.2 Key Design Notes (additions to v2's list)

- **`tp_partners` and `companies` are structurally parallel but never share a table.** Both are "tenants" in the loose sense, but a TP partner is never a company and vice versa — resist the temptation to unify them into one polymorphic `organizations` table. Keeping them separate keeps `BelongsToCompany` and `BelongsToTpPartner` each simple and independently auditable (§1.5).
- **`auditors.tp_partner_id` is nullable by design** — this leaves room for a future in-house-only audit path (2bReady's own staff auditors) without forcing every auditor through the marketplace model. Not required at MVP; the column costs nothing to include now and avoids a migration later.
- **`certificates` uses `audit_id` directly in its public URL/QR code, per confirmed blueprint behavior (§1.6)** — not a separate obfuscated identifier. A separate non-guessable ID was this proposal's own earlier (mislabeled) security recommendation; ULIDs are already non-sequential and hard to guess, so this is treated as a reasonable simplification, not a gap, unless the owner decides otherwise.
- **`data_room_links` mechanics — confirmed detail from blueprint, worth calling out explicitly** since v2's original spec didn't detail it: shared data-room links are time-limited (**7-day expiry**, confirmed) and password-protected with an **auto-generated password** shown alongside the link at creation time. Implementation detail (the blueprint generates the password from a truncated hash) is a mockup shortcut — production should use a proper random token, but the *behavior* (expiring, password-gated share link) is confirmed product intent, not a guess.
- **`journey_templates` is the single most important new table for the "beyond requirements" goal** — every other new-vertical decision (which documents, which levels, which badges) hangs off this one row.
- **`company_user` and `current_company_id` split "membership" from "active context" on purpose (§0.7)** — a user can belong to many companies, but every tenant-scoped query still only ever needs to answer "which one, right now," never "which ones." Collapsing these into one concept (e.g. always scoping to "all of the user's companies" instead of one active company) would silently turn every list/detail endpoint into a cross-company query — exactly the kind of ambiguity `BelongsToCompany` (Rule #1, backend `CLAUDE.md`) exists to prevent.

---

## 6. Landing Page & Public Routes

[#6-landing-page-public-routes](#6-landing-page-public-routes)

§6.1–§6.4 from v2 (stack, page structure, folder structure, performance/SEO checklist) carry over unchanged — the marketing site remains part of the same Next.js app and deploy pipeline. One structural addition:

### 6.5 Public Verification Route (new)

The `(public)` route group (§1.5) sits alongside `(marketing)` and `(backoffice)` as a third, distinct route group — not a page *within* marketing. It has its own minimal layout (no marketing nav/footer, no dashboard chrome), is statically cacheable per certificate, and is the literal destination of every QR code the platform issues. This route did not exist in v2's structure at all and is a go-live blocker: shipping certificates with QR codes that 404 is worse than not having QR codes.

---

## 7. Open Questions Requiring Owner Decision

[#7-open-questions](#7-open-questions)

These were flagged as Phase 0 exit criteria (§2.2). Three of four are now resolved (July 2026) — only item 3 remains open and is the one actively tracked as a schedule risk (§3.6).

1. ~~Is ADMIT Global a marketplace vendor like any other TP partner, or a co-branding/platform partner...~~ **RESOLVED (July 2026), corrected after re-verifying source: neither answer alone was right.** Re-checking the blueprint's actual certificate-generation code confirms ADMIT Global/Unit is genuinely hardcoded as the platform's master verification authority on every certificate — this is confirmed product behavior, not mockup styling. **Owner decision: follow the blueprint exactly.** So: `ADMIT Global Audit` is `tp_partners` row #1 (hireable/rateable like any other firm) **and separately**, every certificate's "Verified by / Approved by / Powered by" footer always references ADMIT UNIT/ADMIT Global Executive regardless of which TP partner was actually hired (§0.3). `ADMIT Unit` is a third, distinct concept — a consulting lead-capture CTA, unrelated to the marketplace hire flow.
2. ~~Do TP partners need their own login/dashboard at MVP...~~ **RESOLVED (July 2026): Full self-service TP portal at MVP.** Sprint 7 (§3.3) stays at its full scope — TP layout, pricing management, hire/assignment views, all included, not deferred to a fast-follow.
3. **Should the compliance framework/document taxonomy for P1–P4 be finalized and signed off before Sprint 4? — STILL OPEN, owner not yet decided.** This is now the single highest-priority open question. **Mitigation while this remains open:** Sprint 4's `MilestoneUnlockRuleEngine` and Sprint 5's `document_templates` are being built fully config-driven against `journey_templates` (§1.8) regardless of the answer, so the engine ships on schedule either way — but the *content* (which specific documents, per level) cannot be entered into Sprint 5 until this is finalized. **Hard deadline: taxonomy must be locked before Sprint 5 begins (W9), not before Sprint 4.** If it slips past that, Sprint 5 risk moves from High to Critical and the schedule in §3.4 will need to shift.
4. ~~Is a second country or vertical planned within 12 months...~~ **RESOLVED (July 2026): Yes.** `journey_templates` (§1.8) is confirmed as a required MVP investment, not a nice-to-have — Company-model fields (~~`industry_code`~~ **`industry_id`, updated 2026-07-10 — see §1.8**, `country_code`) must stay generic from Sprint 2 onward and never assume Cambodia-F&B as a hardcoded default.
