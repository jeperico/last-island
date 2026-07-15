# State

## Position

Plan written — Frontend: Remove Marine/filiation concept from client (Phase 2)

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-15T16:10 — build ✓, lint 0 new errors (5 pre-existing), grep 0 filiation/marine matches, register has no allegiance fieldset, ShipPlacement uses PIRATE_FLEET directly, leaderboard has no tabs
