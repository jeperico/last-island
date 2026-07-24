# Reveal Opponent Ships on Game-Over Panel When FINISHED

## Objective

When the game phase is FINISHED, include all opponent ship positions in `OpponentBoardResponse` so the game-over panel can render the full enemy fleet (unhit cells as "ship" type).

## Files to touch

- modify `service/src/main/java/com/last_island/api/domain/board/dto/OpponentBoardResponse.java` — add `List<ShipResponse> ships` field
- modify `service/src/main/java/com/last_island/api/domain/board/mapper/BoardMapper.java` — add overload `toOpponentBoardResponse(Board board, boolean revealShips)` that populates ships when true; original method delegates with `false`
- modify `service/src/main/java/com/last_island/api/domain/game/mapper/GameMapper.java` — pass `game.getPhase() == GamePhase.FINISHED` to the new BoardMapper overload
- modify `service/src/test/java/com/last_island/api/domain/game/service/GameServiceTest.java` — add test `getGame_whenFinished_returnsOpponentBoardWithShips`
- modify `client/src/interfaces/api.ts` — add optional `ships?: ShipResponse[]` to `OpponentBoardResponse`
- modify `client/src/app/game/[token]/game-over-panel.tsx` — update `buildOpponentBoardCells` signature and logic to mark unhit ship cells as `{ type: "ship" }`; add `ShipResponse` import; update call site

## Steps

1. **OpponentBoardResponse.java** — Add a fourth field `List<ShipResponse> ships` to the record. Import `ShipResponse`.

2. **BoardMapper.java** — Add overload:
   ```java
   public static OpponentBoardResponse toOpponentBoardResponse(Board board, boolean revealShips) {
       List<ShotCellResponse> shotsFired = board.getShots().stream()
               .map(shot -> toShotCellResponse(shot, board))
               .toList();
       List<ShipResponse> ships = revealShips
               ? board.getShips().stream().map(BoardMapper::toShipResponse).toList()
               : null;
       return new OpponentBoardResponse(board.getId(), board.getOwner().getName(), shotsFired, ships);
   }
   ```
   Update the existing no-arg overload to delegate: `return toOpponentBoardResponse(board, false);`

3. **GameMapper.java** — At the call site (~line 136), change:
   ```java
   OpponentBoardResponse opponentBoardResponse = opponentBoard != null
           ? BoardMapper.toOpponentBoardResponse(opponentBoard, game.getPhase() == GamePhase.FINISHED)
           : null;
   ```

4. **GameServiceTest.java** — Add a new test method `getGame_whenFinished_returnsOpponentBoardWithShips` that:
   - Sets up a game with `GamePhase.FINISHED`
   - Adds ships to the opponent board
   - Calls `gameService.getGame(token, userId)`
   - Asserts `response.opponentBoard().ships()` is non-null, has expected size, and matches the ships placed

5. **client/src/interfaces/api.ts** — Add `ships?: ShipResponse[];` to the `OpponentBoardResponse` interface.

6. **game-over-panel.tsx** — 
   - Add `ShipResponse` to the import from `@/lib/api/types`
   - Change `buildOpponentBoardCells` signature to: `buildOpponentBoardCells(shotsFired: ShotCellResponse[], ships?: ShipResponse[])`
   - After the existing second-pass loop, add a third pass: if `ships` is defined, iterate each ship using `getShipCells(ship)`, and for each cell key NOT already in the map, set `{ type: "ship" }`
   - Update call site to pass `gameState.opponentBoard.ships`

## Verification

```bash
# 1. Backend tests pass
cd service && mvn test -q

# 2. Frontend builds clean
cd client && npm run build

# 3. No new lint errors in touched files
cd client && npx eslint src/app/game/\[token\]/game-over-panel.tsx src/interfaces/api.ts --no-error-on-unmatched-pattern

# 4. Confirm ships field in DTO
grep -n "ships" service/src/main/java/com/last_island/api/domain/board/dto/OpponentBoardResponse.java

# 5. Confirm revealShips param in BoardMapper
grep -n "revealShips" service/src/main/java/com/last_island/api/domain/board/mapper/BoardMapper.java

# 6. Confirm optional ships field in TS interface
grep -n "ships?" client/src/interfaces/api.ts

# 7. Confirm ship cell assignment in game-over-panel
grep -n 'type.*"ship"' client/src/app/game/\[token\]/game-over-panel.tsx

# 8. Confirm new test exists
grep -n "whenFinished_returnsOpponentBoardWithShips" service/src/test/java/com/last_island/api/domain/game/service/GameServiceTest.java
```

## Rollback

```bash
git checkout -- \
  service/src/main/java/com/last_island/api/domain/board/dto/OpponentBoardResponse.java \
  service/src/main/java/com/last_island/api/domain/board/mapper/BoardMapper.java \
  service/src/main/java/com/last_island/api/domain/game/mapper/GameMapper.java \
  service/src/test/java/com/last_island/api/domain/game/service/GameServiceTest.java \
  client/src/interfaces/api.ts \
  client/src/app/game/\[token\]/game-over-panel.tsx
```
