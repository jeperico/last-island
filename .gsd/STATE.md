# State

## Position

Plan written — Refactor Ship Placement Component Visual Design (single file: client/src/app/game/[token]/ship-placement.tsx)

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-20T11:21 — build clean, eslint clean, business logic 25 matches, backdrop-blur-md present, bg-surface ×8, text tokens ×11, props interface intact, SurrenderModal rendered, gradient accent present, 10×10 grid with onClick/onMouseEnter/onMouseLeave, 4 distinct cell states, R keyboard shortcut, 5-ship fleet map
