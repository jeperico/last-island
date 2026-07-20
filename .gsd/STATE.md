# State

## Position

Verified — Fix Awakened Observation Haki (pre-visualize + row/col toggle)

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change

## Blockers

(none)

## Last verification

PASS at 2026-07-20T15:26 — build clean (Next.js 16.2.9 Turbopack), awakenedAxis state present, isAwakenedObservation useMemo present, handleObservationConfirm sends revealRowIndex/revealColIndex based on axis, preview includes full row/col for awakened, hoveredCell auto-set to (4,4) on mode entry, axis toggle UI conditional on observationMode && isAwakenedObservation
