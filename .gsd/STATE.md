# State

## Position

Plan written — Add Player Profile Modal to Leaderboard

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-20T11:53 — banner fix verified: build clean, rotate=0, 300%=0, bg-cover bg-top present, all original functionality intact (Modal/AvatarIcon/getRankTier/tierStyles/formatBounty/grid — 13 matches)
