# State

## Position

Plan written — Backend: Add player stats and bounty delta to GameStateResponse

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-15T15:10 — service-build ✓, service-test 79/79 ✓, client-build ✓, client-lint 10 issues (all pre-existing), grep confirms 3/3 call sites set bountyDelta, manual checks ✓ (24 fields, migration valid)
