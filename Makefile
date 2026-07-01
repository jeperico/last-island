SHELL := /bin/bash
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

.PHONY: build run test install status

build: ## Compile the Spring Boot service
	cd service && mvn compile -q

run: ## Run the service with dev profile
	cd service && export $$(cat ../$(ENV_FILE) | grep -v '^\#' | xargs) && ./mvnw spring-boot:run -Dspring-boot.run.profiles=$(ENV)

test: ## Run tests
	@TMP_LOG=$$(mktemp /home/perico/work/last-island/.test-output.XXXXXX); \
	cleanup() { rm -f "$$TMP_LOG"; }; \
	trap cleanup EXIT INT TERM; \
	use_color=true; \
	if [[ -n "$$NO_COLOR" ]] || [[ -n "$$CI" ]] || [[ -n "$$GITHUB_ACTIONS" ]] || [[ "$$TERM" == "dumb" ]]; then \
		use_color=false; \
	fi; \
	if [[ "$$use_color" == "true" ]]; then \
		RED=$$(tput setaf 1 2>/dev/null || echo ""); \
		GREEN=$$(tput setaf 2 2>/dev/null || echo ""); \
		YELLOW=$$(tput setaf 3 2>/dev/null || echo ""); \
		CYAN=$$(tput setaf 6 2>/dev/null || echo ""); \
		BOLD=$$(tput bold 2>/dev/null || echo ""); \
		RESET=$$(tput sgr0 2>/dev/null || echo ""); \
	else \
		RED=""; GREEN=""; YELLOW=""; CYAN=""; BOLD=""; RESET=""; \
	fi; \
	if [[ -n "$$VERBOSE" ]]; then \
		echo "$${CYAN}$${BOLD}▶ Running tests (verbose)...$${RESET}"; \
		cd service && mvn clean test 2>&1 | tee "$$TMP_LOG"; \
		EXIT_CODE=$${PIPESTATUS[0]}; \
	else \
		echo -n "$${CYAN}$${BOLD}▶ Running tests...$${RESET} "; \
		START=$$(date +%s%N); \
		cd service && mvn clean test > "$$TMP_LOG" 2>&1 & \
		MVN_PID=$$!; \
		SPINNER='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'; \
		i=0; \
		while kill -0 $$MVN_PID 2>/dev/null; do \
			NOW=$$(date +%s%N); \
			ELAPSED=$$(( (NOW - START) / 1000000000 )); \
			printf "\r$${CYAN}$${BOLD}▶ Running tests...$${RESET} $${YELLOW}%s$${RESET} %ds" "$${SPINNER:i++%$${#SPINNER}:1}" "$$ELAPSED"; \
			sleep 0.1; \
		done; \
		wait $$MVN_PID; \
		EXIT_CODE=$$?; \
		NOW=$$(date +%s%N); \
		ELAPSED=$$(( (NOW - START) / 1000000000 )); \
		printf "\r"; \
	fi; \
	echo ""; \
	SUMMARY=$$(grep "Tests run:" "$$TMP_LOG" | tail -1); \
	if [[ $$EXIT_CODE -eq 0 ]]; then \
		echo "$${GREEN}$${BOLD}✔ Tests passed$${RESET} ($${ELAPSED}s)"; \
		if [[ -n "$$SUMMARY" ]]; then \
			echo "  $${SUMMARY}"; \
		fi; \
		echo ""; \
		echo "$${CYAN}Suites:$${RESET}"; \
		grep -E "Tests run:.*Time elapsed" "$$TMP_LOG" | while IFS= read -r line; do \
			echo "  $${GREEN}✓$${RESET} $$line"; \
		done; \
	else \
		echo "$${RED}$${BOLD}✘ Tests failed$${RESET} (exit $$EXIT_CODE, $${ELAPSED}s)"; \
		if [[ -n "$$SUMMARY" ]]; then \
			echo "  $${SUMMARY}"; \
		fi; \
		echo ""; \
		FAILURES=$$(grep -E "ERROR.*<<<" "$$TMP_LOG"); \
		if [[ -n "$$FAILURES" ]]; then \
			echo "$${RED}Failed tests:$${RESET}"; \
			echo "$$FAILURES" | while IFS= read -r line; do \
				echo "  $${RED}✗$${RESET} $$line"; \
			done; \
		fi; \
		echo ""; \
		echo "$${YELLOW}─── Last 200 lines of output ───$${RESET}"; \
		tail -200 "$$TMP_LOG"; \
		echo "$${YELLOW}────────────────────────────────$${RESET}"; \
	fi; \
	cleanup; \
	exit $$EXIT_CODE

install: ## Install (skip tests)
	cd service && mvn clean install -DskipTests -q

status: ## Show project status
	@use_color=true; \
	if [[ -n "$$NO_COLOR" ]] || [[ "$$TERM" == "dumb" ]]; then \
		use_color=false; \
	fi; \
	if [[ "$$use_color" == "true" ]]; then \
		CYAN=$$(tput setaf 6 2>/dev/null || echo ""); \
		BOLD=$$(tput bold 2>/dev/null || echo ""); \
		RESET=$$(tput sgr0 2>/dev/null || echo ""); \
	else \
		CYAN=""; BOLD=""; RESET=""; \
	fi; \
	echo "$${CYAN}$${BOLD}── Docker Containers ──$${RESET}"; \
	docker compose --env-file $(ENV_FILE) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  (docker not available)"; \
	echo ""; \
	echo "$${CYAN}$${BOLD}── Git ──$${RESET}"; \
	echo "  Branch: $$(git branch --show-current)"; \
	echo "  Last commit: $$(git log --oneline -1)"

# --- Help ---

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
