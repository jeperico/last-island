# Change game expiration timers

## Objective

Reduce turn timeout to 60s, game timeout to 5 minutes, add a 5-minute PLACING_SHIPS phase timeout, and update frontend timer default + all affected tests.

## Files to touch

- modify `service/src/main/java/com/last_island/api/domain/game/service/GameExpirationService.java` — change constants, add PLACING_SHIPS timeout constant + handler call
- modify `service/src/main/java/com/last_island/api/domain/game/repository/GameRepository.java` — add `findExpiredPlacingShipsGames` query
- modify `service/src/test/java/com/last_island/api/domain/game/service/GameExpirationServiceTest.java` — update test values + add PLACING_SHIPS expiration test
- modify `client/src/components/ui/countdown-timer.tsx` — change default `turnDurationSeconds` from 120 to 60

## Steps

1. **Change backend constants** in `GameExpirationService.java`:
   - `TURN_TIMEOUT_SECONDS = 120` → `60`
   - `GAME_TIMEOUT_MINUTES = 30` → `5`
   - Add `private static final int PLACING_SHIPS_TIMEOUT_MINUTES = 5;`

2. **Add repository query** in `GameRepository.java`:
   - Add `findExpiredPlacingShipsGames(@Param("placingDeadline") LocalDateTime placingDeadline)` with JPQL: `SELECT g FROM Game g WHERE g.phase = 'PLACING_SHIPS' AND g.isActive = true AND g.updatedAt < :placingDeadline`
   - Rationale: `updatedAt` is set by `@PreUpdate` when `joinGame()` saves the game with phase=PLACING_SHIPS, so it accurately marks when placement started.

3. **Add PLACING_SHIPS expiration handling** in `GameExpirationService.checkExpirations()`:
   - Compute `LocalDateTime placingDeadline = LocalDateTime.now().minusMinutes(PLACING_SHIPS_TIMEOUT_MINUTES);`
   - Call `gameRepository.findExpiredPlacingShipsGames(placingDeadline)` and iterate with `handleGameExpiration(game)` (same cancel behaviour as game-timeout — sets CANCELLED, no bounty/GameResult).

4. **Update frontend timer default** in `client/src/components/ui/countdown-timer.tsx`:
   - Change `turnDurationSeconds = 120` → `turnDurationSeconds = 60`

5. **Update test timing values** in `GameExpirationServiceTest.java`:
   - `buildInProgressGame()` helper: change `minusMinutes(10)` → `minusMinutes(2)` for `startedAt`, change `minusSeconds(60)` → `minusSeconds(30)` for `turnStartedAt` (so helper games are NOT expired under the new 5-min/60s thresholds)
   - Turn-expired test: change `minusSeconds(121)` → `minusSeconds(61)`
   - Game-expired test: change `minusMinutes(31)` → `minusMinutes(6)`, change `minusSeconds(60)` → `minusSeconds(30)` for `turnStartedAt`
   - Combined (both queries) test: change `minusMinutes(31)` → `minusMinutes(6)`, change `minusSeconds(121)` → `minusSeconds(61)`
   - Add new test `checkExpirations_placingShipsExpired_setsPhaseToCancel()`:
     - Build a game with `phase = PLACING_SHIPS`, `updatedAt` set to `minusMinutes(6)`, `redBoard` present
     - Mock `findExpiredPlacingShipsGames` to return it, other queries return empty
     - Assert game phase becomes `CANCELLED` and `endedAt` is set

6. **Add mock setup for new query** in existing tests:
   - Add `when(gameRepository.findExpiredPlacingShipsGames(any())).thenReturn(Collections.emptyList())` to all existing tests that call `checkExpirations()` (or use `lenient()` if Mockito strict mode complains).

## Verification

```bash
cd service && mvn test
cd client && npm run build
cd client && npm run lint
grep -rn "120" service/src/main/java/com/last_island/api/domain/game/service/GameExpirationService.java
grep -rn "= 30" service/src/main/java/com/last_island/api/domain/game/service/GameExpirationService.java
grep -rn "120" client/src/components/ui/countdown-timer.tsx
```

Expected: all tests green (77+1 new = 78 minimum), client builds cleanly, no lint errors, no grep hits for old timeout values.

## Rollback

```bash
git checkout -- service/src/main/java/com/last_island/api/domain/game/service/GameExpirationService.java
git checkout -- service/src/main/java/com/last_island/api/domain/game/repository/GameRepository.java
git checkout -- service/src/test/java/com/last_island/api/domain/game/service/GameExpirationServiceTest.java
git checkout -- client/src/components/ui/countdown-timer.tsx
```
