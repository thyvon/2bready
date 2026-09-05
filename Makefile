.PHONY: help dev prod prod-build prod-logs stop stop-all clean status \
       logs logs-api logs-web logs-client logs-tp logs-marketing \
       shell-api shell-postgres shell-redis \
       migrate migrate-fresh seed \
       cache-clear optimize generate-key fix-permissions generate-types

COMPOSE_PROD = docker compose -f docker-compose.prod.yml --env-file .env.production

help: ## Show this help
	@echo "Usage: make [command]"
	@echo ""
	@echo "Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============================================
# DEVELOPMENT
# ============================================

dev: ## Start development environment (Sail + npm)
	cd 2bready-api && ./vendor/bin/sail up -d
	@echo "Development environment started!"
	@echo "  API: http://localhost:8080"
	@echo "  Web: http://localhost:3000"
	@echo "  Mailpit: http://localhost:8026"

# ============================================
# PRODUCTION
# ============================================

prod: ## Build and start production environment
	@test -f .env.production || (echo "Error: .env.production not found. Copy .env.production.example and fill in values." && exit 1)
	$(COMPOSE_PROD) up -d --build
	@echo ""
	@echo "Production environment started!"
	@echo "  Marketing:  https://2bready.systemsolution.online"
	@echo "  Admin:      https://2bready.systemsolution.online/admin"
	@echo "  Client:     https://2bready.systemsolution.online/portal"
	@echo "  TP Portal:  https://2bready.systemsolution.online/tp-portal"

prod-build: ## Rebuild production images (no cache)
	$(COMPOSE_PROD) build --no-cache

prod-logs: ## Tail production logs
	$(COMPOSE_PROD) logs -f

stop: ## Stop all production containers
	$(COMPOSE_PROD) down

stop-all: ## Stop all containers and remove volumes
	$(COMPOSE_PROD) down -v

clean: ## Remove all containers, images, and volumes
	$(COMPOSE_PROD) down -v --rmi all
	@echo "Cleaned up all Docker resources"

status: ## Show container status
	$(COMPOSE_PROD) ps

# ============================================
# LOGS
# ============================================

logs: ## Tail all production logs
	$(COMPOSE_PROD) logs -f

logs-api: ## Tail API logs only
	$(COMPOSE_PROD) logs -f api

logs-web: ## Tail admin-portal logs only
	$(COMPOSE_PROD) logs -f web

logs-client: ## Tail client-portal logs only
	$(COMPOSE_PROD) logs -f client

logs-tp: ## Tail tp-portal logs only
	$(COMPOSE_PROD) logs -f tp

logs-marketing: ## Tail marketing logs only
	$(COMPOSE_PROD) logs -f marketing

# ============================================
# SHELL ACCESS
# ============================================

shell-api: ## Access API container shell
	$(COMPOSE_PROD) exec api sh

shell-postgres: ## Access PostgreSQL shell
	$(COMPOSE_PROD) exec postgres psql -U $${DB_USERNAME} -d $${DB_DATABASE}

shell-redis: ## Access Redis CLI
	$(COMPOSE_PROD) exec redis redis-cli -a $${REDIS_PASSWORD}

# ============================================
# DATABASE
# ============================================

migrate: ## Run database migrations
	$(COMPOSE_PROD) exec api php artisan migrate --force

migrate-fresh: ## Fresh migrate + seed (DESTROYS ALL DATA)
	$(COMPOSE_PROD) exec api php artisan migrate:fresh --seed --force

seed: ## Run database seeders
	$(COMPOSE_PROD) exec api php artisan db:seed --force

# ============================================
# CACHE
# ============================================

cache-clear: ## Clear all caches
	$(COMPOSE_PROD) exec api php artisan cache:clear
	$(COMPOSE_PROD) exec api php artisan config:clear
	$(COMPOSE_PROD) exec api php artisan route:clear
	$(COMPOSE_PROD) exec api php artisan view:clear

optimize: ## Optimize for production
	$(COMPOSE_PROD) exec api php artisan config:cache
	$(COMPOSE_PROD) exec api php artisan route:cache
	$(COMPOSE_PROD) exec api php artisan view:cache

# ============================================
# UTILITIES
# ============================================

generate-key: ## Generate a new APP_KEY
	$(COMPOSE_PROD) exec api php artisan key:generate --force

fix-permissions: ## Fix storage/bootstrap/cache permissions
	$(COMPOSE_PROD) exec api chown -R www-data:www-data storage bootstrap/cache
	$(COMPOSE_PROD) exec api chmod -R 775 storage bootstrap/cache

generate-types: ## Regenerate TypeScript types from API OpenAPI spec
	cd 2bready-web && npm run generate:types
