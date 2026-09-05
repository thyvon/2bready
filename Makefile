.PHONY: help prod prod-build prod-logs stop stop-all clean status \
       logs logs-api logs-web logs-client logs-tp logs-marketing \
       shell-api migrate migrate-fresh seed \
       cache-clear optimize generate-types

COMPOSE_PROD = docker compose -f docker-compose.prod.yml --env-file .env.production

help: ## Show this help
	@echo "Usage: make [command]"
	@echo ""
	@echo "Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

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
# FRONTEND
# ============================================

generate-types: ## Regenerate TypeScript types from API OpenAPI spec
	cd 2bready-web && npm run generate:types
