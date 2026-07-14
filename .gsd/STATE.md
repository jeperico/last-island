# State

## Position

Planning complete — K-factor Elo-style Bounty System with One Piece Themed Ranks

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-14T15:38 — service-build ✓, service-test 73/73 ✓ (incl. BountyServiceTest 9/9), client-build ✓, client-lint 7 pre-existing issues (none introduced)
