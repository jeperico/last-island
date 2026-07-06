# Requirements

## v1 (current)
- [x] REQ-1: Domain modeling — define bounded contexts, entities, value objects, and enums for the game
- [x] REQ-2: User registration and login (Spring Security + PostgreSQL)
- [x] REQ-3: Game creation and matchmaking (create/join a match)
- [x] REQ-4: Ship placement with validation (fleet rules, no overlaps, within bounds)
- [x] REQ-5: Turn-based shooting mechanics (alternating turns, shot resolution: MISS/HIT/SUNK)
- [x] REQ-6: Fog of war enforcement — server never exposes opponent board
- [x] REQ-7: Win condition detection (all opponent ships sunk)
- [x] REQ-8: SSE real-time communication (game events push via Server-Sent Events)
- [x] REQ-9: Flyway migrations for all domain tables
- [x] REQ-10: Automated tests covering domain rules (placement, shooting, win condition)
- [ ] REQ-11: Deploy publicly accessible

## v2 (next)
- [ ] REQ-12: One Piece theming (ship names, UI flavor)
- [ ] REQ-13: Game history / replay
- [ ] REQ-14: Reconnection handling (player drops mid-game)

## Phase traceability
| Req    | Phase    | Status   | Commit  |
|--------|----------|----------|---------|
| REQ-1  | done     | complete | bf21f92 |
| REQ-2  | done     | complete | 8aa07d4 |
| REQ-3  | done     | complete | f7c9c4c |
| REQ-4  | done     | complete | 7b0b49d |
| REQ-5  | done     | complete | f2734fa |
| REQ-6  | done     | complete | 193eca4 |
| REQ-7  | done     | complete | 193eca4 |
| REQ-8  | done     | complete | 7552f20 |
| REQ-9  | done     | complete | 335ad6e |
| REQ-10 | done     | complete | 737f1b9 |
| REQ-11 | next     | pending  | —       |
Ye