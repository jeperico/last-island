# State

## Position

Planning — Refactor img tags to Next.js Image component

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-21T08:44 — build clean, eslint clean (0 new errors, 7 pre-existing), no stale no-img-element disables, no <img> in target files, AvatarIcon has Image+fallback img+priority+sizesMap, next.config has avif, priority on header+podium avatars
