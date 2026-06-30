# === Last Island — Docker & Dev Commands ===

ENV ?= dev
ENV_FILE = .env.$(ENV)

# --- Docker ---

.PHONY: up down restart logs ps clean

up: ## Start PostgreSQL (ENV=dev|prod)
	docker compose --env-file $(ENV_FILE) up -d

down: ## Stop containers
	docker compose --env-file $(ENV_FILE) down

restart: ## Restart containers
	docker compose --env-file $(ENV_FILE) restart

logs: ## Tail container logs
	docker compose --env-file $(ENV_FILE) logs -f

ps: ## Show running containers
	docker compose --env-file $(ENV_FILE) ps

clean: ## Stop and remove volumes (DESTROYS DATA)
	docker compose --env-file $(ENV_FILE) down -v

# --- Database ---

.PHONY: db-shell db-health

db-shell: ## Open psql shell in the container
	docker exec -it lastisland-db psql -U lastisland -d lastisland_$(ENV)

db-health: ## Check DB health status
	docker inspect --format='{{.State.Health.Status}}' lastisland-db

# --- Service ---

.PHONY: build run test

build: ## Compile the Spring Boot service
	cd service && mvn compile -q

run: ## Run the service with dev profile
	cd service && mvn spring-boot:run -Dspring-boot.run.profiles=$(ENV)

test: ## Run tests
	cd service && mvn test

# --- Help ---

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
