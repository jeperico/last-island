# State

## Position

Plan written — Frontend Haki Profile/Skill Tree page (/haki route, API client, types, lobby nav link)

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-17T18:35 — client build clean (/haki route listed), eslint clean, 167/167 backend tests green, grep confirms HakiType/HakiProfileResponse/HakiUpgradeRequest wired across 6 files, /haki nav link present in lobby
