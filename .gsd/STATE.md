# State

## Position

Plan written — Refactor Haki Skill Tree Page Visual Design (single file: client/src/app/haki/page.tsx)

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-20T11:02 — all 9 checks green: next build clean, useRequireAuth(2), getRankTier+tierStyles+AvatarIcon(6), from-blue/red/purple(3), formatBounty(2), descriptions(6), Awakened+shadow glow(2), business logic intact(10 hits), backdrop-blur-md(1)
