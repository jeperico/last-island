# State

## Position

Plan written — Frontend: Audio system (sound manager, laugh/scream/soundtrack triggers, mute setting)

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-15T11:17 — client-build ✓, client-lint 9 issues (all pre-existing, none introduced), all 21 MP3 placeholders exist, sound wiring confirmed in 6 source files
