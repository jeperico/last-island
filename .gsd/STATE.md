# State

## Position

Implementing — Fix USSOP → USOPP spelling across codebase

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-21T09:42 — backend 164/170 pass (6 pre-existing HakiConquerorsServiceTest failures unrelated), frontend build clean, no USSOP in code (only V15/V16 migration WHERE clauses), USOPP confirmed in Avatar.java + character-select.tsx + settings/page.tsx + domain.md, asset dir usopp/ with 4 usopp-bg-*.jpg
