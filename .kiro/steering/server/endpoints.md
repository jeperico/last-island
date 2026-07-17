# Core-API Endpoints Context

## Base URL

- Dev: `http://localhost:8081/api/v1`
- Context path: `/api/v1` (configured in `application.properties`)

## Public Endpoints (No Auth)

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account (name, email, password) |
| POST | `/auth/login` | Login (email, password) → sets cookies |
| POST | `/auth/refresh` | Refresh access token (reads refresh_token cookie) |
| POST | `/auth/logout` | Clear auth cookies |

### Infrastructure
| Path | Description |
|------|-------------|
| `/swagger-ui/**` | Swagger UI |
| `/v3/api-docs/**` | OpenAPI spec |

## Authenticated Endpoints (JWT Required)

### Auth / Profile
| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/me` | Get current user profile |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/leaderboard` | Get leaderboard (top players + current user rank) |
| PUT | `/users/me` | Update profile (avatar) |

### Games
| Method | Path | Description |
|--------|------|-------------|
| POST | `/games` | Create a new game (returns token) |
| POST | `/games/{token}` | Join an existing game by token |
| GET | `/games` | List available games (paginated) |
| GET | `/games/{token}` | Get full game state for current player |
| GET | `/games/history` | Get battle log (paginated game results) |
| POST | `/games/{token}/place-ships` | Place fleet on the board |
| POST | `/games/{token}/shots` | Fire a shot at opponent |
| POST | `/games/{token}/cancel` | Cancel a game (only in WAITING_OPPONENT) |
| POST | `/games/{token}/surrender` | Surrender the battle |
| POST | `/games/{token}/haki/observation` | Use Observation Haki to reveal cells |
| GET | `/games/{token}/events` | SSE stream — real-time game events |

### Lobby
| Method | Path | Description |
|--------|------|-------------|
| GET | `/lobby/events` | SSE stream — lobby updates (new games, joins) |

### Haki
| Method | Path | Description |
|--------|------|-------------|
| GET | `/haki/profile` | Get Haki skill tree profile |
| POST | `/haki/upgrade` | Spend Haki points to level up a skill |

## SSE Endpoints

Both SSE endpoints produce `text/event-stream`:
- `/games/{token}/events` — game-scoped events (opponent joined, ships placed, shot fired, game ended, turn change)
- `/lobby/events` — global lobby events (game created, game started/filled)

Supports `Last-Event-ID` header for reconnection replay.

## Conventions

- All list endpoints return `PageResponse<T>` with pagination metadata.
- Snake_case JSON (`spring.jackson.property-naming-strategy=SNAKE_CASE`).
- Error responses use consistent format: `{ status, error, message, timestamp }`.
- Auth is cookie-based (HttpOnly JWT) — no `Authorization` header needed from browser.
- Game resources are scoped by token (6-char alphanumeric).
- Player identity resolved from JWT in cookie.
