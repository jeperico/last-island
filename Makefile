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

# --- Service (Java/Spring Boot) ---

.PHONY: service-build service-run service-test service-install

service-build: ## Compile the Spring Boot service
	cd service && mvn compile -q

service-run: ## Run the API (dev profile, :8081)
	cd service && export $$(cat ../$(ENV_FILE) | grep -v '^\#' | xargs) && mvn spring-boot:run -Dspring-boot.run.profiles=$(ENV)

service-test: ## Run service tests with pretty output
	@TMP_LOG=$$(mktemp /tmp/.lastisland-test.XXXXXX); \
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
		echo "$${CYAN}$${BOLD}▶ Running service tests (verbose)...$${RESET}"; \
		cd service && mvn clean test 2>&1 | tee "$$TMP_LOG"; \
		EXIT_CODE=$${PIPESTATUS[0]}; \
	else \
		echo -n "$${CYAN}$${BOLD}▶ Running service tests...$${RESET} "; \
		START=$$(date +%s%N); \
		cd service && mvn clean test > "$$TMP_LOG" 2>&1 & \
		MVN_PID=$$!; \
		SPINNER='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'; \
		i=0; \
		while kill -0 $$MVN_PID 2>/dev/null; do \
			NOW=$$(date +%s%N); \
			ELAPSED=$$(( (NOW - START) / 1000000000 )); \
			printf "\r$${CYAN}$${BOLD}▶ Running service tests...$${RESET} $${YELLOW}%s$${RESET} %ds" "$${SPINNER:i++%$${#SPINNER}:1}" "$$ELAPSED"; \
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

service-install: ## Install service (skip tests)
	cd service && mvn clean install -DskipTests -q

# --- Client (Next.js) ---

.PHONY: client-install client-run client-build client-lint

client-install: ## Install client dependencies
	cd client && npm install

client-run: ## Run the frontend (dev mode, :3000)
	cd client && npm run dev

client-prod: ## Build + run client in production mode (:3000)
	cd client && npm run build && npm start

client-ngrok: ## Expose client via ngrok tunnel (run client-prod first)
	/snap/bin/ngrok http 3000

client-build: ## Build client for production
	cd client && npm run build

client-lint: ## Lint client code
	cd client && npm run lint

# --- Audio ---

.PHONY: normalize-audio

normalize-audio: ## Normalize all mp3 files to -16 LUFS (requires ffmpeg)
	@command -v ffmpeg >/dev/null 2>&1 || { echo "Error: ffmpeg is required but not installed."; exit 1; }; \
	echo "Normalizing audio files to -16 LUFS..."; \
	find client/public -name '*.mp3' -print0 | while IFS= read -r -d '' f; do \
		echo "  ⟳ $$f"; \
		ffmpeg -nostdin -y -i "./$$f" -af loudnorm=I=-16:TP=-1.5:LRA=11 -loglevel error "./$${f%.mp3}_norm.mp3" && \
		mv "./$${f%.mp3}_norm.mp3" "./$$f"; \
	done; \
	echo "Done ✔"

# --- Open IDEs ---

.PHONY: opc ops

opc: ## Open client in VS Code
	cd client && code .

ops: ## Open service in IntelliJ IDEA
	cd service && idea .

# --- Shortcuts ---

.PHONY: run build test install

run: ## Run both service + client (use with make -j2 run)
	@echo "Use: make service-run  OR  make client-run"
	@echo "For both: make -j2 service-run client-run"

build: service-build client-build ## Build service + client

test: service-test ## Run all tests

install: service-install client-install ## Install all dependencies

# --- Status ---

.PHONY: status

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
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
