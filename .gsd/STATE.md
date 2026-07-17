# State

## Position

Plan written — Redesign W.O. (walkover) page for CANCELLED games

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-17T17:32 — build ✓, lint 0 errors on page.tsx, CANCELLED block has wallpaper bg+glass card+🏳️+W.O.+opponentName message+Return button+resumeGlobalSoundtrack in phase effect
