# State

## Position

Plan written — Improve game waiting pages (WAITING_OPPONENT and Fleet deployed) UI

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-16T14:46 — build ✓, lint 0 errors, WAITING_OPPONENT shows avatar/name/rank/bounty/wins + waiting animation, Fleet deployed shows ship manifest with SHIP_DISPLAY_NAMES + size dots + Redeploy button, wallpaper backgrounds render on both screens
