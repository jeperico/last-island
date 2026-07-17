# Core-API Usage Documentation Context

## Who Consumes This API

1. **Game Client (Next.js frontend)** — Authenticated SPA consuming `/api/v1/*` endpoints with cookie-based JWT.
2. **SSE Subscribers** — Same client maintains persistent SSE connections for real-time game and lobby events.

## Authentication Flow

1. User registers or logs in via `POST /auth/register` or `POST /auth/login`.
2. Backend validates credentials, issues JWT pair (HS256, self-signed).
3. Backend sets `access_token` and `refresh_token` as HttpOnly cookies (`SameSite=Lax`).
4. Browser automatically includes cookies on every subsequent request (`credentials: "include"`).
5. `JwtAuthenticationFilter` extracts token from cookie, validates signature, and sets `AuthenticatedUser` principal.
6. On 401, client calls `POST /auth/refresh` (reads refresh_token cookie) to get new tokens.

## Game Flow (End-to-End)

1. **Create game**: Player A calls `POST /games` → receives `token` (6 chars). Game enters `WAITING_OPPONENT`.
2. **Lobby notification**: SSE broadcasts `GAME_CREATED` to lobby subscribers.
3. **Join game**: Player B calls `POST /games/{token}` → game moves to `PLACING_SHIPS`.
4. **SSE subscribe**: Both players connect to `GET /games/{token}/events`.
5. **Place ships**: Each player calls `POST /games/{token}/place-ships` with 5 ships. When both placed → `IN_PROGRESS`.
6. **Battle**: Players alternate turns calling `POST /games/{token}/shots`. SSE notifies opponent of each shot.
7. **Haki (optional)**: During their turn, a player may use `POST /games/{token}/haki/observation` to reveal cells.
8. **Game over**: When all ships of one side are sunk → `FINISHED`. SSE sends `GAME_OVER` event.
9. **Bounty update**: Winner gains bounty, loser loses bounty. Ranks may change.

## SSE Event Types

### Game Events (`/games/{token}/events`)
| Event | Payload | Trigger |
|-------|---------|---------|
| `OPPONENT_JOINED` | opponent info | Player B joins |
| `SHIPS_PLACED` | — | Opponent finishes placing ships |
| `SHOT_FIRED` | shot result | Opponent fires a shot |
| `GAME_OVER` | winner info | Game ends |
| `TURN_CHANGE` | current turn | Turn switches |
| `GAME_CANCELLED` | — | Game cancelled |
| `OPPONENT_SURRENDERED` | — | Opponent surrenders |

### Lobby Events (`/lobby/events`)
| Event | Payload | Trigger |
|-------|---------|---------|
| `GAME_CREATED` | game summary | A new game is available to join |
| `GAME_STARTED` | token | A game was filled (no longer joinable) |

## API Collections

### Bruno (version-controlled)
Location: `docs/bruno/` — open with Bruno app, environments pre-configured.

## Swagger UI
Available at: `http://localhost:8081/api/v1/swagger-ui.html` (dev)

## Key Behaviors for Frontend Consumers

- **Pagination**: List endpoints accept `?page=0&size=10`. Response wraps content in `PageResponse`.
- **Snake case**: All JSON fields use snake_case.
- **Cookie auth**: No `Authorization` header needed — cookies are sent automatically.
- **Game scoping**: All game operations use the 6-char `token` in the URL path.
- **Player identity**: Resolved from JWT — no need to pass user ID.
- **SSE reconnection**: Send `Last-Event-ID` header to replay missed events.
- **Error format**: Consistent `{ "status": int, "error": string, "message": string, "timestamp": string }`.
- **Turn enforcement**: Only the current-turn player can fire shots. Others get 403.
- **Phase enforcement**: Actions are only valid in specific phases (e.g., place-ships only in PLACING_SHIPS).
