# 2bReady API — Claude Code Context

## What this project is

Multi-tenant compliance-readiness SaaS. Three user types: **companies** (customers), **auditors** (third-party reviewers), **admins** (internal staff). Core flow: company registers → pays for a package → follows a guided compliance journey → uploads documents → gets audited → receives a trust badge/score.

**This repo is the backend API only.** Frontend lives in `2bready-web` (Next.js). The two repos are kept in sync by one generated contract: Scramble (Laravel) → OpenAPI → `types/api.generated.ts` on the frontend. Never hand-edit generated types.

## Stack

| Layer | Tech |
|---|---|
| Framework | Laravel 11, PHP 8.3 |
| Database | PostgreSQL 16, ULID primary keys |
| Auth | Laravel Sanctum + spatie/laravel-permission |
| Queue | Redis + Laravel Horizon |
| Realtime | Laravel Reverb (WebSockets) |
| Storage | S3-compatible (signed URLs only — never public buckets) |
| API Docs | Scramble (OpenAPI 3 auto-generated) |
| Testing | Pest 3 |
| Static Analysis | Larastan level 6 |
| Formatting | Laravel Pint (PSR-12 + strict_types) |

## Dev environment — Docker + Laravel Sail

All commands run inside the Sail container. Use `./vendor/bin/sail` (or alias `sail` after setup).

```bash
# Start all services (PostgreSQL, Redis, MinIO, Mailpit) — detached
./vendor/bin/sail up -d

# Stop all services
./vendor/bin/sail down

# View logs
./vendor/bin/sail logs -f

# Open a shell inside the container
./vendor/bin/sail shell
```

Services when running:
| Service | Local URL |
|---|---|
| API | http://localhost |
| Mailpit (email UI) | http://localhost:8025 |
| MinIO (S3 console) | http://localhost:8900 |

## Essential commands

Run these with `sail artisan ...` or `sail ...` (inside container):

```bash
# Run tests
./vendor/bin/sail test

# Run a specific test file
./vendor/bin/sail test tests/Feature/Api/V1/CompanyTest.php

# Static analysis
./vendor/bin/sail exec laravel.test ./vendor/bin/phpstan analyse

# Format code
./vendor/bin/sail exec laravel.test ./vendor/bin/pint

# Run migrations
./vendor/bin/sail artisan migrate

# Fresh migration + seed
./vendor/bin/sail artisan migrate:fresh --seed

# Run queue worker (dev)
./vendor/bin/sail artisan horizon

# Run websocket server (dev)
./vendor/bin/sail artisan reverb:start

# Generate OpenAPI spec
./vendor/bin/sail artisan scramble:export

# Clear all caches
./vendor/bin/sail artisan optimize:clear
```

## Sail alias (optional, add to ~/.bashrc)

```bash
alias sail='[ -f sail ] && sh sail || ./vendor/bin/sail'
```

## Project structure — the one rule that matters most

```
app/
├─ Domain/          ← ALL business logic lives here, organized by domain
│  ├─ Company/
│  ├─ User/
│  ├─ Package/
│  ├─ Payment/
│  ├─ Journey/
│  ├─ Document/
│  ├─ Audit/
│  ├─ TrustBadge/
│  ├─ Notification/
│  ├─ Support/
│  ├─ Sop/
│  └─ Shared/ValueObjects/   ← cross-domain concepts (Money)
├─ Http/
│  ├─ Controllers/Api/V1/    ← thin: validate → call Action → return Resource
│  ├─ Requests/Api/V1/       ← one per endpoint, all server-side validation here
│  ├─ Resources/Api/V1/      ← API output shape
│  └─ Middleware/            ← ForceJsonResponse, EnsureCompanyIsActive, ScopeToCompany
├─ Support/
│  ├─ Concerns/
│  │  ├─ HasUlid.php         ← apply to every model (ULID primary key)
│  │  └─ BelongsToCompany.php ← THE multi-tenancy boundary (see rule #1 below)
│  └─ ApiResponse.php        ← standard {data,meta} / {message,errors} envelope
└─ Providers/
   └─ RepositoryServiceProvider.php  ← binds interfaces → implementations
```

## Rule #1 — Multi-tenancy boundary (never break this)

**Every tenant-scoped model MUST use the `BelongsToCompany` trait.**

```php
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;

class Document extends Model
{
    use HasUlid, BelongsToCompany;
}
```

Do **not** write `where('company_id', ...)` manually anywhere — that's exactly what this trait exists to prevent. One global scope, one place to audit. If you add a tenant-scoped table and forget this trait, one company can see another's data.

**Admin bypass is explicit.** Internal users (admin, staff, finance) have `company_id = null`. The trait checks the user's role set before applying the scope. For admin-facing Actions that must query across all tenants, use `withoutGlobalScope('company')` — never rely on a null `company_id` alone as the bypass signal.

## Rule #2 — AuditLog is write-once

Never call `update()` or `delete()` on an `AuditLog` record. All writes go through `RecordAuditLogAction`, which is called exclusively by event listeners. The PostgreSQL role used by the app has no UPDATE/DELETE on `audit_logs` — immutability is enforced at the DB layer, not just by convention.

Every sensitive action must fire a domain event that is caught by `RecordAuditLogListener`. If you add a new sensitive action (payment, role change, document access, data-room activity), check that its event is wired to the listener.

## Rule #3 — Compliance score split

`ComplianceScoreCalculator` (Audit domain) = pure function, reads evidence, returns a score breakdown, **writes nothing**.

`ComplianceScoreService` (Company domain) = applies the score to the company, triggered by `AuditDecisionMade` event via a listener — **never called directly** from a Controller or Action.

## Rule #4 — Auditors are Users

`auditors` is a profile table. Auditors authenticate through the standard `users` table with the `auditor` role. `auditors.user_id → users.id`. Never create a parallel auth system for auditors.

## Rule #5 — Subscriptions track billing history

`companies.active_subscription_id → subscriptions.id`. When a company upgrades or renews, create a new `Subscription` row (mark the old one expired). Never overwrite an existing subscription — the history is a compliance record.

## Where does new code go?

| You're adding... | Goes in |
|---|---|
| A single endpoint's logic | `Domain/{X}/Actions/` — one invokable class, one `__invoke()` |
| Logic shared by 2+ Actions | `Domain/{X}/Services/` — only when actually shared |
| Payment/gateway abstraction | `Domain/Payment/Contracts/` + `Gateways/` (Strategy pattern) |
| Persistence abstraction | `Domain/{X}/Contracts/{X}RepositoryInterface` + `Repositories/Eloquent{X}Repository` — only Company and Payment need this |
| Non-trivial list/search filtering | `Domain/{X}/QueryFilters/` — Company and Audit have these |
| Typed request/response payload | `Domain/{X}/DTOs/` using `spatie/laravel-data` |
| Status/type field | `Domain/{X}/Enums/` — PHP backed enum, mirrored as DB CHECK constraint |
| Side effects from a domain event | `Domain/{X}/Events/` + `Listeners/` — never call another domain's Action directly |
| Cross-domain concept | `Domain/Shared/ValueObjects/` — only if 2+ domains need it |
| A sensitive action that must be audited | Fire a domain event → listener calls `RecordAuditLogAction`. Never write to `audit_logs` inline. |
| A background job (scan, expiry, reminder) | `Domain/{X}/Jobs/` — always dispatched to Horizon, never run inline on the request thread |

## Key data relationships

| Relationship | Notes |
|---|---|
| `auditors.user_id → users.id` | Auditors are Users with a role + profile. One auth system. |
| `companies.active_subscription_id → subscriptions.id` | Never store `package_id` directly on company; always query through subscription. |
| `milestone_completions(company_id, milestone_id)` | Source of truth for journey progress. `MilestoneUnlockRuleEngine` reads this. |
| `data_room_links.token` | 64-char random, URL-safe. PIN stored as bcrypt hash. Never log either in plain text. |
| `audit_logs` | No `updated_at`. Append-only. DB role blocks UPDATE/DELETE. |

## Controllers must be thin

```php
// ✅ correct
public function store(StoreCompanyRequest $request, CreateCompanyAction $action): JsonResponse
{
    $company = $action->execute(CompanyData::from($request->validated()));
    return ApiResponse::created(new CompanyResource($company));
}

// ❌ wrong — business logic in a controller
public function store(Request $request): JsonResponse
{
    $company = Company::create([...]);
    event(new CompanyCreated($company));
    // ...
}
```

## API response envelope

Always use `ApiResponse` or return an `JsonResource` — never raw `response()->json()` with a custom shape.

```php
ApiResponse::success($data, $meta)   // 200 {data, meta}
ApiResponse::created($data)          // 201 {data}
ApiResponse::error($message, $errors) // 4xx {message, errors}
ApiResponse::noContent()             // 204
```

## Testing rules

Every new API endpoint ships with a Pest feature test covering:
1. Happy path (200/201)
2. Validation failure (422)
3. Authorization failure (401/403)

```php
// tests/Feature/Api/V1/CompanyTest.php
it('creates a company', function () {
    $admin = User::factory()->withRole('admin')->create();
    $response = actingAs($admin)->postJson('/api/v1/companies', [...]);
    $response->assertCreated()->assertJsonStructure(['data' => ['id', 'name']]);
});

it('requires authentication', function () {
    postJson('/api/v1/companies', [])->assertUnauthorized();
});
```

## Non-negotiable rules (CI blocks on these)

- `declare(strict_types=1)` at the top of every PHP file
- No raw SQL string concatenation — Eloquent/query builder only
- No `any` type in TypeScript (frontend) without inline justification
- No `console.log` or `dd()` in committed code
- No business logic in Controllers
- Every FK and every WHERE/ORDER BY/JOIN column is indexed in its migration
- File uploads: validate MIME + size first, antivirus scan before persisting, serve only via signed URLs
- Secrets in `.env` only — never committed
- Money amounts stored as integer cents (use `Money` value object or cast to `int`)
- Status fields use PHP backed enums + DB CHECK constraint — never magic strings

## ULID primary keys

All models use ULIDs via the `HasUlid` trait. Never use `id` as auto-increment. In migrations:

```php
$table->char('id', 26)->primary();
$table->char('company_id', 26)->index();
```

## When you're unsure about a pattern

**Simplest option first.** An Action + a Form Request is almost always enough. Add a Repository only if you have a real reason to abstract persistence (Company, Payment). Add a Service only when 2+ Actions share logic. Do not add abstractions speculatively.

Run `/conventions` to load the full engineering decision guide.
