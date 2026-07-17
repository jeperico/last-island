# Eliminate GET refetch after player's own shot in BattleScreen

## Objective

Replace the redundant `getGame()` refetch in the non-game-over branch of `handleFire` with an optimistic local state update derived from the `ShotResponse`, keeping the refetch only for game-over scenarios.

## Files to touch

- modify `client/src/app/game/[token]/battle-screen.tsx`

## Steps

1. In `handleFire` (around line 116–118), replace the `else` branch that calls `getGame(gameToken)` + `onGameStateUpdate(updatedState)` with an optimistic state derivation:
   - Compute `newCurrentTurn`: if `response.result === "MISS"`, switch to the other player's name (the one that isn't `user.name` from `gameState.bluePlayerName` / `gameState.redPlayerName`); on HIT/SUNK, keep `gameState.currentTurnPlayerName` (same player fires again).
   - Build the new shot as `ShotCellResponse`: `{ row, col, result: response.result, sunkShipType: response.sunkShipType }`.
   - Compute `updatedShotsFired` by appending the new shot to `gameState.opponentBoard.shotsFired`.
   - Call `onGameStateUpdate` with a spread of `gameState` overriding: `currentTurnPlayerName: newCurrentTurn`, `turnStartedAt: new Date().toISOString()`, `opponentBoard: { ...gameState.opponentBoard, shotsFired: updatedShotsFired }`.
   - Call `setOptimisticShots([])` to clear the optimistic array (shot is now baked into state).

2. Keep the `if (response.gameOver)` branch exactly as-is — it still calls `getGame(gameToken)` and `onGameStateUpdate(updatedState)`.

3. Remove the now-unused `getGame` import **only if** it's not used elsewhere in this file. Check: `handleSurrender` also uses `getGame`, so the import stays.

4. Verify the `useCallback` dependency array still includes all referenced values (add nothing new — `user.name`, `gameState` are already captured via closure or existing deps; `user` is already in scope from props but not in the dep array — check if it needs adding for `user.name`). If `user` is not in the deps, add it.

## Verification

```bash
cd client && npm run build
cd client && npx eslint src/app/game/\[token\]/battle-screen.tsx
```

Manual checks:
- Fire a MISS → board shows blue marker, turn badge switches to "Opponent's Turn", countdown timer resets, NO GET request in Network tab
- Fire a HIT → board shows red marker, turn badge stays "Your Turn", countdown timer resets, NO GET request
- Fire the winning SUNK → refetch fires, game-over panel appears with bounty delta and stats
- SSE opponent shot still triggers refetch from parent (unaffected)

## Rollback

```bash
git checkout -- client/src/app/game/\[token\]/battle-screen.tsx
```
