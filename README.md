# 2bReady

Compliance-readiness SaaS platform. Companies register, follow a guided compliance journey (documents, audits, trust badges), while auditors review and admins run the back office.

This is a monorepo with two projects that run together in local development:

| Project | What it is | Stack |
|---|---|---|
| `2bready-api` | Backend REST API | Laravel 11, PHP 8.2+, PostgreSQL, Redis |
| `2bready-web` | Frontend (marketing site + product app) | Next.js 16, TypeScript, MUI |

For deep architecture/domain rules, see each project's own `CLAUDE.md` (`2bready-api/CLAUDE.md`, `2bready-web/CLAUDE.md`) and `Project Documents/2bReady_MVP_Proposal_v2.md`. This README is just "how do I get it running."

## Prerequisites

- **Docker Desktop** (or compatible engine) — the API's database/redis/storage all run in containers via Laravel Sail
- **PHP 8.2+ and Composer** — only needed once, to install the API's `vendor/` folder before Sail can boot (Sail itself runs the app in a container, but bootstrapping `vendor/` needs a local PHP+Composer, or the Docker one-liner below)
- **Node 20+ and npm** — for the frontend

## First-time setup

### 1. Clone and enter the repo

```bash
git clone https://github.com/thyvon/2bready.git
cd 2bready
```

### 2. API (`2bready-api`)

```bash
cd 2bready-api
cp .env.example .env

# Install PHP dependencies
composer install
# No PHP/Composer installed locally? Use Docker instead:
# docker run --rm -u "$(id -u):$(id -g)" -v "$(pwd):/var/www/html" -w /var/www/html laravelsail/php84-composer:latest composer install

php artisan key:generate

# Boots PostgreSQL, Redis, MinIO (S3-compatible storage), Mailpit
./vendor/bin/sail up -d

./vendor/bin/sail artisan migrate --seed
```

Optional shell alias so you can type `sail` instead of `./vendor/bin/sail` (add to `~/.bashrc` / `~/.zshrc`):

```bash
alias sail='[ -f sail ] && sh sail || ./vendor/bin/sail'
```

### 3. Web (`2bready-web`)

```bash
cd ../2bready-web
cp .env.example .env.local
npm install
npm run dev
```

### 4. Open it

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| API | http://localhost:8080 |
| Mailpit (email UI — password resets, verification emails) | http://localhost:8026 |
| MinIO console (S3 storage — uploaded documents) | http://localhost:8901 (user: `sail` / password: `password`) |

Seeding only creates roles/permissions, not a demo user. Register your first account at http://localhost:3000/register, then promote it to admin if you need back-office access:

```bash
sail artisan tinker
>>> $user = \App\Models\User::first();
>>> $user->assignRole('admin');
```

## Day-to-day (once set up)

Two terminals:

```bash
# Terminal 1 — API
cd 2bready-api && sail up -d

# Terminal 2 — Web
cd 2bready-web && npm run dev
```

`sail up -d` is idempotent — leave it running across sessions, only `sail down` if you want to fully stop the containers.

## Common commands

**API** (`2bready-api`, run inside Sail):
```bash
sail test                                          # run tests (Pest)
sail exec laravel.test ./vendor/bin/pint           # format code
sail exec laravel.test ./vendor/bin/phpstan analyse # static analysis
sail artisan migrate:fresh --seed                  # reset the database
sail artisan scramble:export                       # regenerate OpenAPI spec
```

**Web** (`2bready-web`):
```bash
npm run dev             # dev server (http://localhost:3000)
npm run build            # production build
npm run type-check       # TypeScript, no emit
npm run lint              # ESLint
npm run generate:types   # regenerate src/types/api.generated.ts from the API's OpenAPI spec (needs the API running)
```

## Troubleshooting

- **Port already in use** (3000, 8080, 8026, 8901): something else on your machine is bound to it. `npm run dev` will auto-pick the next free port; for Sail, override with `FORWARD_DB_PORT`, `FORWARD_MAILPIT_DASHBOARD_PORT`, `FORWARD_MINIO_CONSOLE_PORT`, etc. in `2bready-api/.env`.
- **Frontend API calls failing**: confirm `NEXT_PUBLIC_API_URL` in `2bready-web/.env.local` matches where the API is actually running (default `http://localhost:8080`).
- **Frontend types out of sync with the API**: run `npm run generate:types` in `2bready-web` — never hand-edit `src/types/api.generated.ts`.
- **Sail won't start**: make sure Docker Desktop is running, then `sail down && sail up -d` to recreate containers.
