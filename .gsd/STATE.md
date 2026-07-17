# State

## Position

Plan written — Conqueror's Haki backend (activation endpoint, cooldown, X-pattern Lv3, Armament eat-skip interaction, SSE, tests)

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-17T18:26 — 167/167 tests green (22 HakiConquerorsServiceTest + 24 BoardServiceFireShotTest + 20 HakiBattleServiceTest + 23 HakiArmamentServiceTest), compile clean, client build clean, all Conqueror's rules verified (skip 3/5, cooldown 1/2, X-pattern 4 diagonals, armament eat-skip, one-haki-per-turn, duplicate-shot skip, win condition)
