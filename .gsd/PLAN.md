# Backend: Add player stats and bounty delta to GameStateResponse

## Objective

Extend GameStateResponse with player stats (rank, bounty, wins, accuracy) and bountyDelta so the upcoming VS-style game-over modal has all needed data from a single API call.

## Files to touch

- create: `service/src/main/resources/db/migration/V9__add_bounty_delta_to_games.sql`
- modify: `service/src/main/java/com/last_island/api/domain/game/entity/Game.java`
- modify: `service/src/main/java/com/last_island/api/domain/user/service/BountyService.java`
- modify: `service/src/main/java/com/last_island/api/domain/board/service/BoardService.java`
- modify: `service/src/main/java/com/last_island/api/domain/game/service/GameService.java`
- modify: `service/src/main/java/com/last_island/api/domain/game/service/GameExpirationService.java`
- modify: `service/src/main/java/com/last_island/api/domain/game/dto/GameStateResponse.java`
- modify: `service/src/main/java/com/last_island/api/domain/game/mapper/GameMapper.java`
- modify: `client/src/interfaces/api.ts`

## Steps

1. **Create Flyway migration `V9__add_bounty_delta_to_games.sql`**
   ```sql
   ALTER TABLE games ADD COLUMN bounty_delta BIGINT;
   ```

2. **Add `bountyDelta` field to `Game.java` entity**
   - Add `private Long bountyDelta;` field (nullable Long, not primitive long)
   - Lombok @Data handles getter/setter automatically

3. **Change `BountyService.updateBounties` return type from `void` to `long`**
   - Change signature: `public long updateBounties(User winner, User loser)`
   - Add `return gain;` at the end of the method (the `gain` variable already exists locally)

4. **Update `BoardService.java` call site (~line 282)**
   - Change `bountyService.updateBounties(attacker, loser);` to:
     ```java
     long bountyDelta = bountyService.updateBounties(attacker, loser);
     game.setBountyDelta(bountyDelta);
     ```
   - This is before the existing `gameRepository.save(game)` call

5. **Update `GameService.java` surrender call site (~line 238)**
   - Change `bountyService.updateBounties(winner, loser);` to:
     ```java
     long bountyDelta = bountyService.updateBounties(winner, loser);
     game.setBountyDelta(bountyDelta);
     ```
   - This is before the existing `gameRepository.save(game)` call

6. **Update `GameExpirationService.java` call site (~line 110)**
   - Change `bountyService.updateBounties(winner, loser);` to:
     ```java
     long bountyDelta = bountyService.updateBounties(winner, loser);
     game.setBountyDelta(bountyDelta);
     ```
   - This is before the existing `gameRepository.save(game)` call

7. **Add 9 new fields to `GameStateResponse.java` record**
   - Add after `redPlayerAvatar` and before `currentTurnPlayerName`:
     ```java
     String bluePlayerRank, String redPlayerRank,
     Long bluePlayerBounty, Long redPlayerBounty,
     Integer bluePlayerWins, Integer redPlayerWins,
     Integer bluePlayerAccuracy, Integer redPlayerAccuracy,
     Long bountyDelta
     ```
   - Full record constructor ordering: `id, token, phase, bluePlayerName, bluePlayerAvatar, redPlayerName, redPlayerAvatar, bluePlayerRank, redPlayerRank, bluePlayerBounty, redPlayerBounty, bluePlayerWins, redPlayerWins, bluePlayerAccuracy, redPlayerAccuracy, bountyDelta, currentTurnPlayerName, winnerName, startedAt, endedAt, turnStartedAt, createdAt, myBoard, opponentBoard`

8. **Update `GameMapper.toStateResponse` to populate new fields**
   - After the existing `blueOwner` extraction (already at line 72), extract stats:
     ```java
     String bluePlayerRank = blueOwner.getRank();
     Long bluePlayerBounty = blueOwner.getBounty();
     Integer bluePlayerWins = blueOwner.getWins();
     Integer bluePlayerAccuracy = blueOwner.getTotalShots() > 0
             ? blueOwner.getTotalHits() * 100 / blueOwner.getTotalShots()
             : null;
     ```
   - After the existing `redBoard != null` check (~line 77), extract red stats (null if redBoard is null):
     ```java
     String redPlayerRank = null;
     Long redPlayerBounty = null;
     Integer redPlayerWins = null;
     Integer redPlayerAccuracy = null;
     if (game.getRedBoard() != null) {
         User redOwner = game.getRedBoard().getOwner();
         redPlayerRank = redOwner.getRank();
         redPlayerBounty = redOwner.getBounty();
         redPlayerWins = redOwner.getWins();
         redPlayerAccuracy = redOwner.getTotalShots() > 0
                 ? redOwner.getTotalHits() * 100 / redOwner.getTotalShots()
                 : null;
     }
     ```
   - For bountyDelta: `Long bountyDelta = game.getBountyDelta();`
   - Update the `return new GameStateResponse(...)` call to include all 9 new arguments in the correct positional order

9. **Update frontend `GameStateResponse` interface in `client/src/interfaces/api.ts`**
   - Add after `redPlayerAvatar`:
     ```typescript
     bluePlayerRank: string | null;
     redPlayerRank: string | null;
     bluePlayerBounty: number | null;
     redPlayerBounty: number | null;
     bluePlayerWins: number | null;
     redPlayerWins: number | null;
     bluePlayerAccuracy: number | null;
     redPlayerAccuracy: number | null;
     bountyDelta: number | null;
     ```

## Verification

```bash
cd service && mvn clean test
```
- Expect: 79/79 tests pass (BountyService return type change — Mockito returns 0L by default for long, so existing mocks won't break)

```bash
cd client && npm run build
```
- Expect: build succeeds (new nullable fields don't break existing component usage)

```bash
cd client && npm run lint
```
- Expect: no new lint errors introduced (pre-existing issues acceptable)

```bash
grep -rn "updateBounties" service/src/main/java/
```
- Expect: all 3 call sites capture the return value and set it on game

Manual checks:
- `V9__add_bounty_delta_to_games.sql` contains a single valid ALTER TABLE statement
- GameStateResponse record field count = 24 (was 15, +9 new)
- GameMapper constructor call argument count matches record field count

## Rollback

```bash
git checkout -- service/src/main/java/ client/src/interfaces/api.ts
rm service/src/main/resources/db/migration/V9__add_bounty_delta_to_games.sql
```
