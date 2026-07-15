# State

## Position

Plan written — Frontend: Redesign game-over screen as VS-style results modal

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-15T15:23 — client-build ✓, client-lint 0 new errors (4 pre-existing warnings in changed files), createPortal used, all GameStateResponse fields consumed, formatBounty shared across 3 files
