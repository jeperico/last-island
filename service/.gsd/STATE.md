# State

## Position
REQ-8: SSE Real-Time Communication — plan written, ready for implementation.

## Decisions
- 2026-06-30: Spring Boot 4.1 + Java 21 + PostgreSQL
- 2026-06-30: Server-authoritative architecture — no opponent state leaks
- 2026-06-30: All IDs are UUID
- 2026-06-30: Single ShipType enum with filiation field (10 values: 5 pirate + 5 marine)
- 2026-06-30: Shot.result = MISS/HIT/SUNK (stored, not derived)
- 2026-06-30: GamePhase enum: WAITING_OPPONENT, PLACING_SHIPS, IN_PROGRESS, FINISHED
- 2026-06-30: Auth = JWT (1h access + refresh token), BCrypt
- 2026-06-30: REQ-3: 6-digit friendly token, random first turn
- 2026-07-02: Removed one-active-game-per-player constraint — players can have concurrent games

## Blockers
(none)

## Last verification
PASS at 2026-07-06T15:48-03:00 — compile exit 0, 44 tests pass (10+7+11+16), all 11 SSE verification checks green
