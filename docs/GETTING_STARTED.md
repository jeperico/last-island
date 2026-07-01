# Getting Started

Local development setup for Last Island V1.

## TL;DR

```bash
# Terminal 1 — Database + API
make up              # start PostgreSQL
make service-run     # start Spring Boot API on :8081

# Terminal 2 — Frontend
make client-install   # install dependencies
make client-run       # start Next.js on :3000
```

Open http://localhost:3000 to play.

## Prerequisites

- Java 21 (JDK)
- Maven 3.9+
- Node.js 20+ & npm
- Docker & Docker Compose
- PostgreSQL client (optional, for `make db-shell`)

## 1. Clone & Setup

```bash
git clone <repo-url> last-island
cd last-island
```

Copy the environment example and adjust if needed:

```bash
cp .env.example .env.dev
```

Default `.env.dev` values:

```env
DB_HOST=localhost
DB_PORT=5433
DB_NAME=lastisland_dev
DB_USER=lastisland
DB_PASSWORD=dev_password
JWT_SECRET=dev-secret-key-must-be-at-least-256-bits-long-for-hs256-signing
```

## 2. Start the Database

```bash
make up
```

This starts a PostgreSQL 16 container on port **5433** (mapped from 5432 inside the container).

Verify it's healthy:

```bash
make db-health
# → healthy
```

## 3. Run the Service

```bash
make service-run
```

This starts the Spring Boot API on **http://localhost:8081/api/v1** with the `dev` profile.

On first start, Flyway automatically runs all migrations (V1–V4).

## 4. Run the Client

In a separate terminal:

```bash
make client-install
make client-run
```

This starts the Next.js 16 frontend on **http://localhost:3000**.

The client connects to the API at `http://localhost:8081/api/v1`.

## 5. Verify It Works

Swagger UI: http://localhost:8081/api/v1/swagger-ui.html

Or with curl:

```bash
# Register a user
curl -s -X POST http://localhost:8081/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monkey D. Luffy",
    "email": "luffy@strawhat.io",
    "password": "gomu-gomu-no",
    "filiation": "PIRATE"
  }' | jq

# Response includes accessToken + refreshToken + user profile
```

## 6. Play a Game (Quick Flow)

```bash
# 1. Register two players
TOKEN_1=$(curl -s -X POST http://localhost:8081/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Luffy","email":"luffy@op.io","password":"12345678","filiation":"PIRATE"}' | jq -r '.accessToken')

TOKEN_2=$(curl -s -X POST http://localhost:8081/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Akainu","email":"akainu@op.io","password":"12345678","filiation":"MARINE"}' | jq -r '.accessToken')

# 2. Player 1 creates a battle
GAME_TOKEN=$(curl -s -X POST http://localhost:8081/api/v1/games \
  -H "Authorization: Bearer $TOKEN_1" | jq -r '.token')

echo "Game token: $GAME_TOKEN"

# 3. Player 2 joins
curl -s -X POST "http://localhost:8081/api/v1/games/$GAME_TOKEN" \
  -H "Authorization: Bearer $TOKEN_2" | jq '.phase'
# → "PLACING_SHIPS"

# 4. Both players place ships (example for Pirate fleet)
curl -s -X POST "http://localhost:8081/api/v1/games/$GAME_TOKEN/place-ships" \
  -H "Authorization: Bearer $TOKEN_1" \
  -H "Content-Type: application/json" \
  -d '{
    "ships": [
      {"type":"THOUSAND_SUNNY","row":0,"col":0,"orientation":"HORIZONTAL"},
      {"type":"MOBY_DICK","row":2,"col":0,"orientation":"HORIZONTAL"},
      {"type":"RED_FORCE","row":4,"col":0,"orientation":"HORIZONTAL"},
      {"type":"POLAR_TANG","row":6,"col":0,"orientation":"HORIZONTAL"},
      {"type":"STRIKER","row":8,"col":0,"orientation":"HORIZONTAL"}
    ]
  }' | jq '.gamePhase'

curl -s -X POST "http://localhost:8081/api/v1/games/$GAME_TOKEN/place-ships" \
  -H "Authorization: Bearer $TOKEN_2" \
  -H "Content-Type: application/json" \
  -d '{
    "ships": [
      {"type":"BUSTER_CALL","row":0,"col":0,"orientation":"HORIZONTAL"},
      {"type":"WARSHIP","row":2,"col":0,"orientation":"HORIZONTAL"},
      {"type":"BATTLESHIP","row":4,"col":0,"orientation":"HORIZONTAL"},
      {"type":"CRUISER","row":6,"col":0,"orientation":"HORIZONTAL"},
      {"type":"CUTTER","row":8,"col":0,"orientation":"HORIZONTAL"}
    ]
  }' | jq '.gamePhase'
# → "IN_PROGRESS"

# 5. Fire shots (check whose turn it is via GET game state)
curl -s "http://localhost:8081/api/v1/games/$GAME_TOKEN" \
  -H "Authorization: Bearer $TOKEN_1" | jq '.currentTurnPlayerName'

# Fire!
curl -s -X POST "http://localhost:8081/api/v1/games/$GAME_TOKEN/shots" \
  -H "Authorization: Bearer $TOKEN_1" \
  -H "Content-Type: application/json" \
  -d '{"row":0,"col":0}' | jq
# → { "result": "HIT" or "MISS", ... }
```

## Available Make Commands

```bash
make help
```

| Command | Description |
|---------|-------------|
| `make up` | Start PostgreSQL container |
| `make down` | Stop containers |
| `make service-run` | Run the API (dev profile, :8081) |
| `make service-test` | Run service tests with pretty output |
| `make service-build` | Compile the service |
| `make client-install` | Install client dependencies |
| `make client-run` | Run the frontend (dev mode, :3000) |
| `make client-build` | Build client for production |
| `make client-lint` | Lint client code |
| `make build` | Build service + client |
| `make test` | Run all tests |
| `make install` | Install all dependencies |
| `make status` | Show containers + git info |
| `make db-shell` | Open psql in the container |
| `make logs` | Tail container logs |
| `make clean` | Stop + destroy volumes |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register a new pirate/marine |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh JWT token |
| GET | /auth/me | Get profile |
| POST | /games | Create a battle |
| POST | /games/{token} | Join a battle |
| GET | /games | List open battles (lobby) |
| GET | /games/{token} | Get game state (fog of war) |
| POST | /games/{token}/place-ships | Deploy fleet |
| POST | /games/{token}/shots | Fire a cannonball |

All endpoints except auth require `Authorization: Bearer <token>` header.

## Troubleshooting

**Port 5433 already in use:**
```bash
make clean   # removes the container + volume
make up      # starts fresh
```

**Flyway migration error after enum refactor:**
```bash
make clean   # wipe DB
make up      # fresh DB, migrations will rerun on next `make run`
```

**Tests fail:**
```bash
VERBOSE=1 make test   # shows full Maven output
```
