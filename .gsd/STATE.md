# State

## Position

Plan written — Armament Haki backend (assignment endpoint, passive trigger in fireShot, counter-fire, turn skip, tests)

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-17T18:06 — 143/143 tests green (23 HakiArmamentServiceTest + 22 BoardServiceFireShotTest + 20 HakiBattleServiceTest), compile clean, all armament rules verified (assignment, trigger, counter-fire adjacency, turn skip, no recursion)
