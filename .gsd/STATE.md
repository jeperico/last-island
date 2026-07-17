# State

## Position

Plan written — Eliminate GET refetch after player's own shot in BattleScreen

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-17T11:14 — build ✓, lint 0 errors, getGame only in game-over+surrender paths, optimistic update appends shot+switches turn correctly, useCallback deps complete
