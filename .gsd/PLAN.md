# Cancel Fleet Deployment

## Objective

Allow a player who has placed ships to cancel their deployment (undo), as long as the opponent hasn't placed ships yet. Clears the board server-side and returns the player to the placement screen with ships pre-placed at their previous positions.

## Files to touch

- **modify** `service/src/main/java/com/last_island/api/domain/board/service/BoardService.java`
- **modify** `service/src/main/java/com/last_island/api/domain/board/controller/BoardController.java`
- **modify** `service/src/main/java/com/last_island/api/domain/haki/repository/HakiBattleStateRepository.java`
- **modify** `service/src/main/java/com/last_island/api/infrastructure/sse/GameEventEmitter.java`
- **create** `service/src/test/java/com/last_island/api/domain/board/service/BoardServiceCancelDeploymentTest.java`
- **modify** `client/src/lib/api/board.ts`
- **modify** `client/src/lib/api/index.ts`
- **modify** `client/src/types/game-events.ts`
- **modify** `client/src/lib/game/use-game-events.ts`
- **modify** `client/src/app/game/[token]/page.tsx`

## Steps

### Backend

1. **Add `deleteByBoardId` to HakiBattleStateRepository** — Add method signature `void deleteByBoardId(UUID boardId);` to the repository interface. Spring Data derives the query automatically.

2. **Add `cancelDeployment` to BoardService** — New public method `cancelDeployment(String token, UUID userId)`:
   - Fetch game by token (active). 404 if not found.
   - Validate user is a participant. 403 if not.
   - Validate phase == PLACING_SHIPS. 409 if not ("Battle is no longer in placement phase").
   - Identify player's board and opponent's board.
   - Validate opponent's board has NO ships (`opponentBoard.getShips().isEmpty()`). 409 if not ("Opponent has already deployed their fleet — too late to cancel").
   - Validate player's board HAS ships (nothing to cancel otherwise). 409 if not.
   - Clear player's ships: `board.getShips().clear()`.
   - Delete HakiBattleState for this board: `hakiBattleStateRepository.deleteByBoardId(board.getId())`.
   - Save game: `gameRepository.save(game)`.
   - Emit SSE `DEPLOYMENT_CANCELLED` to opponent (after commit).

3. **Add SSE event emission** — In `GameEventEmitter.java`, add `emitDeploymentCancelled(String token, UUID opponentId)` that sends event type `DEPLOYMENT_CANCELLED` with no payload (or minimal payload like `{ "player_name": "..." }`).

4. **Add endpoint to BoardController** — `POST /games/{token}/cancel-deployment`. Extract user from `AuthenticatedUser` principal. Call `boardService.cancelDeployment(token, user.getId())`. Return 200 with no body (or a simple success message).

5. **Write unit tests** — `BoardServiceCancelDeploymentTest.java`:
   - Happy path: player has ships, opponent has none → ships cleared, HakiBattleState deleted.
   - Opponent already placed: → 409.
   - Player has no ships: → 409.
   - Game not in PLACING_SHIPS: → 409.
   - User not participant: → 403.

### Frontend

6. **Add API function** — In `client/src/lib/api/board.ts`, add `cancelDeployment(gameToken: string)` → `POST /api/games/${gameToken}/cancel-deployment`. Export from index.

7. **Add SSE event type** — In `client/src/types/game-events.ts`, add `DEPLOYMENT_CANCELLED` event type with no data payload (or empty object).

8. **Wire SSE handler** — In `client/src/lib/game/use-game-events.ts`, add listener for `DEPLOYMENT_CANCELLED` that calls a new callback prop `onDeploymentCancelled`.

9. **Update game page** — In `client/src/app/game/[token]/page.tsx`:
   - Replace the existing "🔄 Redeploy Fleet" button with a "Cancel Deployment" button that calls `cancelDeployment(token)`.
   - On success: set `hasPlacedShips = false`, set `isRedeploying = true`, and pre-populate the ship placements from the `myBoard.ships` data (map ship positions back to placement entries).
   - Handle `onDeploymentCancelled` SSE event (from opponent): if we were showing "opponent ready" indicator, reset it to "opponent not ready".
   - Pass initial placements to `ShipPlacement` component via a new optional prop `initialPlacements`.

10. **Update ShipPlacement component** — Accept optional `initialPlacements` prop (Map of ShipType → {row, col, orientation}). If provided, initialize `placements` state with it so all ships appear pre-placed on the grid ready to re-deploy.

## Verification

```bash
# Backend builds and tests pass
make service-test

# Frontend builds without errors
make client-build

# New endpoint exists
grep -n "cancel-deployment" service/src/main/java/com/last_island/api/domain/board/controller/BoardController.java

# Service method exists
grep -n "cancelDeployment" service/src/main/java/com/last_island/api/domain/board/service/BoardService.java

# HakiBattleState cleanup
grep -n "deleteByBoardId" service/src/main/java/com/last_island/api/domain/haki/repository/HakiBattleStateRepository.java

# SSE event
grep -n "DEPLOYMENT_CANCELLED\|emitDeploymentCancelled" service/src/main/java/com/last_island/api/infrastructure/sse/GameEventEmitter.java

# Test file exists
test -f service/src/test/java/com/last_island/api/domain/board/service/BoardServiceCancelDeploymentTest.java

# Frontend API
grep -n "cancelDeployment" client/src/lib/api/board.ts

# Frontend SSE
grep -n "DEPLOYMENT_CANCELLED" client/src/types/game-events.ts

# Frontend page wiring
grep -n "cancelDeployment\|initialPlacements" client/src/app/game/[token]/page.tsx
```

## Rollback

```bash
git checkout -- service/src/main/java/com/last_island/api/domain/board/service/BoardService.java \
  service/src/main/java/com/last_island/api/domain/board/controller/BoardController.java \
  service/src/main/java/com/last_island/api/domain/haki/repository/HakiBattleStateRepository.java \
  service/src/main/java/com/last_island/api/infrastructure/sse/GameEventEmitter.java \
  client/src/lib/api/board.ts \
  client/src/lib/api/index.ts \
  client/src/types/game-events.ts \
  client/src/lib/game/use-game-events.ts \
  client/src/app/game/[token]/page.tsx \
  client/src/app/game/[token]/ship-placement.tsx

rm -f service/src/test/java/com/last_island/api/domain/board/service/BoardServiceCancelDeploymentTest.java
```
