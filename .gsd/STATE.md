# State

## Position

Idle — ready for next task

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

PASS at 2026-07-24T12:12 — backend 170/176 pass (6 pre-existing HakiConquerorsServiceTest failures unrelated), frontend build clean
