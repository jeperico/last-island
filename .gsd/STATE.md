# State

## Position

Plan written — Frontend: Remove 'Join by Token' functionality

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-15T16:38 — build ✓, lint 0 new errors (4 pre-existing errors same as before), grep 0 matches for joinGameSchema/JoinGameFormData/join-game/Battle Token/Enter game token/Share the token/Join by Token, handleJoinFromList+joinGame still present in lobby, WAITING_OPPONENT shows only "Waiting for an opponent from the Grand Line…"
