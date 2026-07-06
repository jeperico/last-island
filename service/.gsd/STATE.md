# State

## Position
REQ-8 SSE Real-Time Communication — implemented and committed (7552f20). All v1 backend features complete.

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
- 2026-07-06: Real-time push = SSE (SseEmitter) over WebSocket/STOMP. Rationale: game only needs unidirectional server→client push (commands stay as REST); zero new dependencies (SseEmitter built into spring-webmvc); EventSource auto-reconnects with Last-Event-ID; simpler mental model (CQRS-light: REST for writes, SSE for reads/events); auth via JWT query param on /events endpoint; scales to multi-instance later via Redis Pub/Sub. Trade-off accepted: no bidirectional streaming (not needed for turn-based game), auth token in URL (acceptable for 1h-expiry game tokens with locked CORS).

## Blockers
(none)

## Last verification
PASS at 2026-07-06T15:48-03:00 — compile exit 0, 44 tests pass (10+7+11+16), all 11 SSE verification checks green
