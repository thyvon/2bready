#!/bin/bash
set -euo pipefail

# 2bReady — Production Deploy Script
# Usage: ./scripts/deploy.sh [commit]
#
# Examples:
#   ./scripts/deploy.sh          # deploy latest main
#   ./scripts/deploy.sh abc123   # deploy specific commit

# Ensure we're in the project root
cd "$(dirname "$0")/.." || exit 1

COMMIT="${1:-main}"
COMPOSE_PROD="docker compose -f docker-compose.prod.yml --env-file .env.production"

echo "============================================"
echo "  2bReady Deploy"
echo "  Target: ${COMMIT}"
echo "============================================"
echo ""

# 1. Pre-flight checks
echo "[1/6] Pre-flight checks..."

if [ ! -f .env.production ]; then
    echo "ERROR: .env.production not found."
    echo "Run: cp .env.production.example .env.production"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed."
    exit 1
fi

echo "  OK"
echo ""

# 2. Pull latest code
echo "[2/6] Pulling code..."
if [ "$COMMIT" = "main" ]; then
    git pull origin main
else
    git fetch origin
    git checkout "$COMMIT"
fi
echo ""

# 3. Check for migrations
echo "[3/6] Checking for migration changes..."
MIGRATION_CHANGED=$(git diff HEAD~1 --name-only | grep -c "database/migrations" || true)
if [ "$MIGRATION_CHANGED" -gt 0 ]; then
    echo "  WARNING: Migration files changed. Running migrations after deploy."
    RUN_MIGRATIONS=true
else
    RUN_MIGRATIONS=false
    echo "  No migration changes detected."
fi
echo ""

# 4. Build and deploy
echo "[4/6] Building and starting containers..."
$COMPOSE_PROD up -d --build
echo ""

# 5. Run migrations if needed
if [ "$RUN_MIGRATIONS" = true ]; then
    echo "[5/6] Running migrations..."
    $COMPOSE_PROD exec -T api php artisan migrate --force
    echo ""
else
    echo "[5/6] Skipping migrations (no changes)."
    echo ""
fi

# 6. Health check
echo "[6/6] Running health check..."
sleep 5

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://2bready.systemsolution.online/health 2>/dev/null || echo "000")

if [ "$HEALTH" = "200" ]; then
    echo "  Health check: OK (HTTP 200)"
else
    echo "  WARNING: Health check returned HTTP ${HEALTH}"
    echo "  Check logs with: make logs"
fi
echo ""

# Summary
echo "============================================"
echo "  Deploy complete!"
echo ""
echo "  Git:     $(git log -1 --pretty=format:'%h %s')"
echo "  Health:  HTTP ${HEALTH}"
echo ""
echo "  URLs:"
echo "    Marketing:  https://2bready.systemsolution.online"
echo "    Admin:      https://2bready.systemsolution.online/admin"
echo "    Client:     https://2bready.systemsolution.online/portal"
echo "    TP Portal:  https://2bready.systemsolution.online/tp-portal"
echo "============================================"
