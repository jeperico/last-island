# State

## Position

Plan written — Design System Steering Doc + Kiro Skill (documentation only, no code changes)

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-20T10:26 — all 8 checks green: both files exist, color-primary(6), tierStyles(4), createPortal(1), YAML frontmatter(2), getRankTier(5), next build clean
