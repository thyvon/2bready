#!/bin/bash
set -euo pipefail

# 2bReady — Rollback Script
# Usage: ./scripts/rollback.sh [commit]
#
# Examples:
#   ./scripts/rollback.sh         # rollback to previous commit
#   ./scripts/rollback.sh abc123  # rollback to specific commit

COMPOSE_PROD="docker compose -f docker-compose.prod.yml --env-file .env.production"

# Default to previous commit
TARGET="${1:-$(git rev-parse HEAD~1)}"

echo "============================================"
echo "  2bReady Rollback"
echo "  Target: ${TARGET}"
echo "============================================"
echo ""

# 1. Show what we're rolling back to
echo "Target commit:"
git log --oneline -1 "$TARGET"
echo ""

# 2. Confirm
read -p "Rollback to this commit? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# 3. Checkout and deploy
echo ""
echo "Checking out ${TARGET}..."
git checkout "$TARGET"

echo ""
echo "Building and deploying..."
$COMPOSE_PROD up -d --build

# 4. Health check
echo ""
echo "Running health check..."
sleep 5

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://2bready.systemsolution.online/health 2>/dev/null || echo "000")

if [ "$HEALTH" = "200" ]; then
    echo "  Health check: OK (HTTP 200)"
else
    echo "  WARNING: Health check returned HTTP ${HEALTH}"
    echo "  Check logs with: make logs"
fi

echo ""
echo "============================================"
echo "  Rollback complete!"
echo ""
echo "  Now on: $(git log -1 --pretty=format:'%h %s')"
echo ""
echo "  To return to main later:"
echo "    git checkout main"
echo "    make prod"
echo "============================================"
