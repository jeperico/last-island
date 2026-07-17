# State

## Position

Plan written — Change game expiration timers (turn 60s, game 5min, placing 5min)

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-17T15:25 — 78/78 tests green, client build+lint clean (0 new errors), grep confirms no old timeout values (120/30) remain, TURN_TIMEOUT_SECONDS=60, GAME_TIMEOUT_MINUTES=5, PLACING_SHIPS_TIMEOUT_MINUTES=5, frontend default=60
