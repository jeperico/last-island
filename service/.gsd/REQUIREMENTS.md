# Requirements

## v1 (current)
- [ ] REQ-1: Domain modeling — define bounded contexts, entities, value objects, and enums for the game
- [ ] REQ-2: User registration and login (Spring Security + PostgreSQL)
- [ ] REQ-3: Game creation and matchmaking (create/join a match)
- [ ] REQ-4: Ship placement with validation (fleet rules, no overlaps, within bounds)
- [ ] REQ-5: Turn-based shooting mechanics (alternating turns, shot resolution: MISS/HIT/SUNK)
- [ ] REQ-6: Fog of war enforcement — server never exposes opponent board
- [ ] REQ-7: Win condition detection (all opponent ships sunk)
- [ ] REQ-8: WebSocket real-time communication (game events, turn notifications)
- [ ] REQ-9: Flyway migrations for all domain tables
- [ ] REQ-10: Automated tests covering domain rules (placement, shooting, win condition)
- [ ] REQ-11: Deploy publicly accessible

## v2 (next)
- [ ] REQ-12: One Piece theming (ship names, UI flavor)
- [ ] REQ-13: Game history / replay
- [ ] REQ-14: Reconnection handling (player drops mid-game)

## Phase traceability
| Req   | Phase | Status  |
|-------|-------|---------|
| REQ-1 | plan  | pending |
