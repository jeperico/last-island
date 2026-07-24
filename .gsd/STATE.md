# State

## Position

Plan ready — Reveal opponent ships on game-over panel when game is FINISHED

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-24T11:48 — backend 171/177 pass (6 pre-existing HakiConquerorsServiceTest failures unrelated), frontend build clean, eslint clean, all 5 grep checks confirm wiring
