# Requirements

## v1 (current)
- [x] REQ-1: Project scaffolding (Next.js 15 + TypeScript + Tailwind CSS 4 + Vercel config)
- [x] REQ-2: Auth pages — Register and Login forms, JWT token handling
- [x] REQ-3: Auth state management — persist tokens, attach to requests, refresh flow
- [x] REQ-4: Game lobby — create game, join game by friendly token, list available games
- [x] REQ-5: Ship placement screen — place 5 ships on 10×10 grid (sizes 5,4,3,3,2), orientation toggle, validation feedback
- [x] REQ-6: Battle screen — own board (showing ships + incoming shots) + opponent board (fog of war, click to shoot)
- [x] REQ-7: Turn-based flow — indicate whose turn it is, disable shooting when not your turn
- [x] REQ-8: Shot feedback — display MISS/HIT/SUNK results on opponent board
- [x] REQ-9: Win/loss detection — show game result when match ends
- [x] REQ-11: API client layer — typed service functions for all backend endpoints

## v2 (next)
- [ ] REQ-10: SSE integration — real-time turn notifications via EventSource (events: OPPONENT_JOINED, SHIPS_PLACED, SHOT_RECEIVED, GAME_OVER)
- [ ] REQ-12: One Piece theming (ship skins, rank badges, sound effects)
- [ ] REQ-13: Reconnection handling (rejoin mid-game after disconnect)
- [ ] REQ-14: Game history / replay viewer
- [ ] REQ-15: Responsive mobile layout

## Phase traceability
| Req    | Phase   | Status    |
|--------|---------|-----------|
| REQ-1  | v1      | done      |
| REQ-2  | v1      | done      |
| REQ-3  | v1      | done      |
| REQ-4  | v1      | done      |
| REQ-5  | v1      | done      |
| REQ-6  | v1      | done      |
| REQ-7  | v1      | done      |
| REQ-8  | v1      | done      |
| REQ-9  | v1      | done      |
| REQ-10 | v2      | pending   |
| REQ-11 | v1      | done      |
| REQ-12 | v2      | pending   |
| REQ-13 | v2      | pending   |
| REQ-14 | v2      | pending   |
| REQ-15 | v2      | pending   |
