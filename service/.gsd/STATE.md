# State

## Position
Idle — all v1 backend features complete and committed. 36 tests passing. Swagger docs available.

## Decisions
- 2026-06-30: Spring Boot 4.1 + Java 21 + PostgreSQL
- 2026-06-30: Server-authoritative architecture — no opponent state leaks
- 2026-06-30: All IDs are UUID
- 2026-06-30: Single ShipType enum with filiation field (10 values: 5 pirate + 5 marine)
- 2026-06-30: Shot.result = MISS/HIT/SUNK (stored, not derived)
- 2026-06-30: GamePhase enum: WAITING_OPPONENT, PLACING_SHIPS, IN_PROGRESS, FINISHED
- 2026-06-30: Auth = JWT (1h access + refresh token), BCrypt
- 2026-06-30: REQ-3: One active game per player, 6-digit friendly token, random first turn

## Blockers
(none)

## Last verification
PASS at 2026-07-01T14:46-03:00 — compile exit 0, 36 tests pass, OpenAPI configured, all endpoints documented
