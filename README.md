# 2bReady

Compliance-readiness SaaS platform for Cambodian SMEs. Companies follow a guided compliance journey (documents, audits, trust badges), auditors review, admins run the back office.

## Quick Start

```bash
git clone https://github.com/thyvon/2bready.git
cd 2bready
cp .env.production.example .env.production
nano .env.production          # fill in required values
make prod                     # build and start everything
```

## Stack

| Layer | Technology |
|---|---|
| Edge | Cloudflare Tunnel (TLS, CDN, DDoS protection) |
| Reverse Proxy | Nginx Alpine (path-based routing, HSTS, gzip) |
| Backend | Laravel 11, PHP 8.3-FPM, Supervisor (4 processes) |
| Queue Worker | Laravel Horizon (Redis) |
| Frontend | Next.js 16 + React 19 + MUI v9 + Tailwind v4 (4 apps) |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 (AOF persistence) |
| PDF | Gotenberg 8 (Chromium, Khmer fonts) |

## Architecture

```
                    Cloudflare Tunnel
                           │
                    Nginx (edge proxy)
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  Marketing (/)    Admin (/admin)    Client (/portal)
  TP Portal (/tp-portal)
        │                  │                  │
        └──────────┬───────┴──────────────────┘
                   │
             API (nginx + PHP-FPM
              + Horizon + Scheduler)
                   │
        ┌──────────┼──────────┐
        │          │          │
   PostgreSQL   Redis    Gotenberg
```

9 containers, single Docker bridge network, zero exposed ports.

## Prerequisites

- Docker 20.10+ and Docker Compose v2
- Git
- Cloudflare account (or use port exposure — see below)

## Environment Setup

```bash
cp .env.production.example .env.production
nano .env.production
```

**Required variables:**

| Variable | How to generate |
|---|---|
| `APP_KEY` | `docker run --rm php:8.3-cli php -r "echo 'base64:'.base64_encode(random_bytes(32));"` |
| `DB_PASSWORD` | `openssl rand -base64 32` |
| `REDIS_PASSWORD` | `openssl rand -base64 32` |
| `CLOUDFLARE_TUNNEL_TOKEN` | Cloudflare Dashboard → Networks → Tunnels → Create |

**Domain variables** (pre-filled for `2bready.systemsolution.online`):

| Variable | Value |
|---|---|
| `APP_URL` | `https://2bready.systemsolution.online` |
| `SANCTUM_STATEFUL_DOMAINS` | `2bready.systemsolution.online` |
| `FRONTEND_URL` | `https://2bready.systemsolution.online/portal` |
| `ADMIN_FRONTEND_URL` | `https://2bready.systemsolution.online/admin` |
| `NEXT_PUBLIC_API_URL` | `https://2bready.systemsolution.online` |

## Deploy

```bash
make prod          # build + start
make status        # verify all containers are up
```

Or use the deploy script (includes health check):

```bash
./scripts/deploy.sh
```

First build takes 5-10 minutes. Subsequent starts are fast.

## Commands

### Production

| Command | Description |
|---|---|
| `make prod` | Build and start production |
| `make prod-build` | Full rebuild (no cache) |
| `make stop` | Stop containers (data persists) |
| `make stop-all` | Stop + remove volumes |
| `make status` | Container status |
| `make clean` | Remove everything (containers + images + volumes) |

### Logs

| Command | Description |
|---|---|
| `make logs` | All logs |
| `make logs-api` | API only |
| `make logs-web` | Admin portal only |
| `make logs-client` | Client portal only |
| `make logs-tp` | TP portal only |
| `make logs-marketing` | Marketing only |

### Database

| Command | Description |
|---|---|
| `make migrate` | Run pending migrations |
| `make seed` | Run seeders |
| `make migrate-fresh` | Drop all + re-migrate + seed |

### Shell Access

| Command | Description |
|---|---|
| `make shell-api` | Shell into API container |
| `make shell-postgres` | PostgreSQL CLI |
| `make shell-redis` | Redis CLI |

### Utilities

| Command | Description |
|---|---|
| `make cache-clear` | Clear all caches |
| `make optimize` | Cache config/routes/views |
| `make generate-key` | Generate new APP_KEY |
| `make fix-permissions` | Fix storage/bootstrap ownership |
| `make generate-types` | Regenerate TypeScript types from API |

### Scripts

| Script | Description |
|---|---|
| `./scripts/deploy.sh` | Deploy with health check |
| `./scripts/deploy.sh abc123` | Deploy specific commit |
| `./scripts/rollback.sh` | Rollback to previous commit |
| `./scripts/rollback.sh abc123` | Rollback to specific commit |

## Deploying Updates

### Code changes

```bash
git pull origin main
make prod
```

### With migrations

```bash
git pull origin main
make migrate
make seed   # if new seeders included
```

### Config changes

```bash
make cache-clear
make optimize
```

## Cloudflare Tunnel

1. Cloudflare Dashboard → **Networks** → **Tunnels** → **Create a tunnel**
2. Choose **Cloudflared** connector, name it (e.g., `2bready-prod`)
3. Copy the tunnel token → paste into `.env.production` as `CLOUDFLARE_TUNNEL_TOKEN`
4. **Public Hostnames** tab → add `2bready.systemsolution.online` → `http://2bready_nginx:80`

### Without Cloudflare

Uncomment the port mapping in `docker-compose.prod.yml`:

```yaml
nginx:
  ports:
    - '${NGINX_PORT:-8082}:80'
```

Comment out or remove the `cloudflared` service block.

## API Container (4 processes)

| Process | Purpose |
|---|---|
| `nginx` | Reverse proxy to PHP-FPM |
| `php-fpm` | PHP application server |
| `horizon` | Queue worker (certificate PDFs, malware scans, expiry jobs) |
| `scheduler` | Cron task runner |

If jobs pile up in Redis, check Horizon:

```bash
make shell-api
php artisan horizon:status
```

## Troubleshooting

**Containers won't start:**
```bash
make status
make logs-api
```

**Health check fails:**
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec api wget -qO- http://localhost/health
```

**Database connection refused:**
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec postgres pg_isready -U 2bready
```

**Next.js 404s:**
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec nginx nginx -t
```

**PDF generation fails:**
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec gotenberg ls /usr/share/fonts/custom/
```

**Port conflicts:**
```bash
lsof -i :8082    # find what's using the port
# change NGINX_PORT in .env.production
```

**Disk space:**
```bash
docker system df
docker system prune -a --volumes
```

## Development

```bash
# One command to start API (Sail)
make dev

# Frontend (separate terminal)
cd 2bready-web
npm install
npm run dev
```

| Service | Dev URL |
|---|---|
| API | http://localhost:8080 |
| Web | http://localhost:3000 |
| Mailpit | http://localhost:8026 |
| MinIO | http://localhost:8901 |

## Project Structure

```
2bready/
├── 2bready-api/              Laravel 11 API
│   ├── Dockerfile            Multi-stage (Composer + PHP-FPM)
│   ├── app/Domain/           Business logic
│   └── routes/api.php        API routes
├── 2bready-web/              npm workspaces monorepo
│   ├── apps/
│   │   ├── admin-portal/     /admin
│   │   ├── client-portal/    /portal
│   │   ├── tp-portal/        /tp-portal
│   │   └── marketing/        /
│   └── packages/
│       ├── api-client/       Generated TypeScript types
│       └── ui-core/          Shared MUI components
├── devops/                   Production configs
│   ├── nginx/                Reverse proxy + API nginx
│   ├── php/                  PHP-FPM tuning
│   └── supervisor/           Process manager
├── scripts/                  Deploy + rollback helpers
├── docker-compose.prod.yml   9 services
├── .env.production.example   Environment template
├── Makefile                  One-command ops
└── Project Documents/        Proposals, ERD
```

## CI

| Pipeline | Checks |
|---|---|
| API | Pint → Larastan L6 → Pest (80% min) |
| Admin Portal | TypeScript → ESLint → Build |
| TP Portal | TypeScript → ESLint → Build |

## Security

- TLS terminated at Cloudflare (no server-side certs)
- Security headers: X-Frame-Options, X-Content-Type-Options, XSS-Protection, Referrer-Policy, HSTS
- Zero exposed ports (Cloudflare Tunnel)
- Gzip compression on text/css/js/json/svg
- Static assets cached 30 days (immutable)
- Hidden files blocked (except .well-known)
- PHP `expose_php=Off`
- Database/Redis internal to Docker network only

## Docs

- **[Deployment Guide](DEPLOYMENT.md)** — full step-by-step for fresh servers
- [Architecture proposal](Project Documents/2bReady_MVP_Proposal_v3.md)
- [Engineering conventions](Project Documents/SKILL.md)
- [API rules](2bready-api/CLAUDE.md)
- [Frontend rules](AGENTS.md)
