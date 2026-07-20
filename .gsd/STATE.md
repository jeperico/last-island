# State

## Position

Plan written — Add Haki Tutorial Modal on Home Page

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-20T11:29 — build clean, eslint 0 errors (2 pre-existing warnings), all 8 grep checks green (localStorage key ≥1, hakiPointsAvailable ≥1, HakiTutorialModal ≥2, getHakiProfile ≥2, bg-surface-elevated ≥1, /haki link ≥1, Modal ≥2, per-branch colors ≥3)
