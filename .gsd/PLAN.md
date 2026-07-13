# Add Battle Log (Game History) Feature

## Objective

Add a GET `/api/games/history` endpoint returning last 10 finished games for the authenticated user (opponent name, result, date, shots fired, ships sunk, duration), a service + mapper layer, a unit test, and a Battle Log section on the home dashboard page.

## Files to touch

- **create** `service/src/main/java/com/last_island/api/domain/game/dto/BattleLogEntryResponse.java` — DTO record
- **modify** `service/src/main/java/com/last_island/api/domain/game/repository/GameResultRepository.java` — add fetch-join query
- **create** `service/src/main/java/com/last_island/api/domain/game/service/BattleLogService.java` — service with getBattleLog(userId) method
- **modify** `service/src/main/java/com/last_island/api/domain/game/mapper/GameMapper.java` — add `toBattleLogEntry` static method
- **modify** `service/src/main/java/com/last_island/api/domain/game/controller/GameController.java` — add GET `/history` endpoint
- **create** `service/src/test/java/com/last_island/api/domain/game/service/BattleLogServiceTest.java` — unit test
- **modify** `client/src/interfaces/api.ts` — add `BattleLogEntryResponse` interface
- **modify** `client/src/lib/api/games.ts` — add `getBattleLog()` function
- **modify** `client/src/lib/api/index.ts` — re-export `getBattleLog`
- **modify** `client/src/app/page.tsx` — add Battle Log section

## Steps

1. **Create `BattleLogEntryResponse.java`** — Java record with fields: `UUID gameId`, `String opponentName`, `String result` (VICTORY/DEFEAT), `String date` (ISO string of `endedAt`), `int shotsFired`, `long shipsSunk`, `String duration` (formatted from `Duration`).

2. **Modify `GameResultRepository.java`** — Add a JPQL query method:
   ```java
   @Query("""
       SELECT gr FROM GameResult gr
       JOIN FETCH gr.game g
       JOIN FETCH g.blueBoard bb
       JOIN FETCH bb.owner
       JOIN FETCH bb.ships
       JOIN FETCH bb.shots
       LEFT JOIN FETCH g.redBoard rb
       LEFT JOIN FETCH rb.owner
       LEFT JOIN FETCH rb.ships
       LEFT JOIN FETCH rb.shots
       WHERE gr.winner.id = :userId OR gr.loser.id = :userId
       ORDER BY g.endedAt DESC
       LIMIT 10
   """)
   List<GameResult> findTop10ByUserIdOrderByEndedAtDesc(@Param("userId") UUID userId);
   ```
   Note: If Hibernate complains about LIMIT in JPQL with fetch joins on collections (due to "in-memory" pagination warning), use `Pageable` with `PageRequest.of(0, 10)` instead and return `List<GameResult>` from the query (removing LIMIT clause). Test will confirm.

3. **Add `toBattleLogEntry` in `GameMapper.java`** — Static method taking `(GameResult gr, UUID userId)`:
   - Determine if user is winner → result = "VICTORY" or "DEFEAT".
   - Opponent = winner if user is loser, else loser → `opponent.getName()`.
   - Game from `gr.getGame()`.
   - Player's board = board whose owner matches userId.
   - Opponent's board = the other board.
   - `shotsFired` = `opponentBoard.getShots().size()` (shots received by opponent = shots fired by player).
   - `shipsSunk` = `opponentBoard.getShips().stream().filter(Ship::isSunk).count()`.
   - `duration` = format `game.getDuration()` as "Xm Ys" or null-safe.
   - `date` = `game.getEndedAt().toString()`.

4. **Create `BattleLogService.java`** — `@Service` class:
   - Inject `GameResultRepository`.
   - Method: `List<BattleLogEntryResponse> getBattleLog(UUID userId)` — calls repository, maps each result via `GameMapper.toBattleLogEntry`.

5. **Modify `GameController.java`** — Add:
   ```java
   @GetMapping("/history")
   public List<BattleLogEntryResponse> getBattleLog(@AuthenticationPrincipal AuthenticatedUser principal) {
       return battleLogService.getBattleLog(principal.getId());
   }
   ```
   Inject `BattleLogService` alongside existing constructor params.

6. **Create `BattleLogServiceTest.java`** — `@ExtendWith(MockitoExtension.class)`:
   - Mock `GameResultRepository`.
   - Test `getBattleLog` returns correct mapping for a victory scenario (user is winner, verify opponent name, result=VICTORY, shotsFired, shipsSunk, duration).
   - Test `getBattleLog` returns DEFEAT when user is loser.
   - Test empty list returns empty.

7. **Add `BattleLogEntryResponse` interface in `client/src/interfaces/api.ts`**:
   ```ts
   export interface BattleLogEntryResponse {
     gameId: string;
     opponentName: string;
     result: "VICTORY" | "DEFEAT";
     date: string;
     shotsFired: number;
     shipsSunk: number;
     duration: string | null;
   }
   ```

8. **Add `getBattleLog` in `client/src/lib/api/games.ts`**:
   ```ts
   export function getBattleLog(): Promise<BattleLogEntryResponse[]> {
     return apiGet<BattleLogEntryResponse[]>("/api/games/history");
   }
   ```

9. **Re-export in `client/src/lib/api/index.ts`** — add `getBattleLog` to the games export line and `BattleLogEntryResponse` to the type export.

10. **Modify `client/src/app/page.tsx`** — Add a "Battle Log" section after the "Available Games" section:
    - New state: `battleLog` (array), `loadingBattleLog` (boolean).
    - Fetch `getBattleLog()` in the same `useEffect` that loads games.
    - Render section with heading "⚔️ Battle Log".
    - Loading state: 3 `<Skeleton>` rows.
    - Empty state: `<EmptyState title="No battles yet" description="Your war record is empty, Captain!" />`.
    - Populated: list of `<Card>` items showing opponent name, `<Badge variant="success">VICTORY</Badge>` or `<Badge variant="danger">DEFEAT</Badge>`, date (formatted), stats line (shots fired, ships sunk, duration).

## Verification

```bash
make service-build
make service-test
make client-build
make client-lint
```

- `service-build` compiles without errors.
- `service-test` passes all tests including the new `BattleLogServiceTest`.
- `client-build` succeeds.
- `client-lint` shows no new errors (2 pre-existing acceptable).

## Rollback

```bash
git checkout -- service/src/main/java/com/last_island/api/domain/game/repository/GameResultRepository.java
git checkout -- service/src/main/java/com/last_island/api/domain/game/mapper/GameMapper.java
git checkout -- service/src/main/java/com/last_island/api/domain/game/controller/GameController.java
git checkout -- client/src/interfaces/api.ts
git checkout -- client/src/lib/api/games.ts
git checkout -- client/src/lib/api/index.ts
git checkout -- client/src/app/page.tsx
rm -f service/src/main/java/com/last_island/api/domain/game/dto/BattleLogEntryResponse.java
rm -f service/src/main/java/com/last_island/api/domain/game/service/BattleLogService.java
rm -f service/src/test/java/com/last_island/api/domain/game/service/BattleLogServiceTest.java
```
