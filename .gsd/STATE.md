# State

## Position

Planning — Responsive Mobile Layout (all pages, 320px–768px)

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change
- Turn timer = 20s; expiration skips turn (no W.O.); W.O. only via surrender

## Blockers

(none)

## Last verification

PASS at 2026-07-24T12:30 — build clean, eslint clean (0 new errors, 7 pre-existing), all 7 grep checks green
