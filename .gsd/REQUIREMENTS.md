# Requirements

## v1 (done)

- [x] REQ-1: Domain modeling (entities, enums, relationships, Flyway migrations)
- [x] REQ-2: User auth (register/login with JWT, Spring Security)
- [x] REQ-3: Game creation + matchmaking (friendly token join)
- [x] REQ-4: Ship placement with validation (fleet rules, no overlaps, within bounds)
- [x] REQ-5: Turn-based shooting (alternating turns, MISS/HIT/SUNK resolution)
- [x] REQ-6: Fog of war + win condition detection
- [x] REQ-7: SSE real-time events (opponent joined, ships placed, shot received, game over)
- [x] REQ-8: Full client (lobby, placement, battle, game-over screens)
- [x] REQ-9: Design system + One Piece dark nautical theme
- [x] REQ-10: Unit tests (domain rules: placement, shooting, win condition, fog of war)

## v2 (next)

- [ ] REQ-11: Deploy publicly accessible (service + client)
- [ ] REQ-12: Reconnection handling (rejoin mid-game after disconnect)
- [ ] REQ-13: Game history / replay
- [ ] REQ-14: Responsive mobile layout
- [ ] REQ-15: Sound effects / rank badges
