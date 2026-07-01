# REQ-6 + REQ-7 + REQ-8: Battle Screen with Turn Flow and Shot Feedback

## Objective

Implement the battle screen component rendered during `IN_PROGRESS` phase, featuring two side-by-side 10×10 grids (my board showing ships + incoming shots, opponent board with fog of war + fired shots), turn-based shooting via `fireShot` API, polling for opponent turns, and game-over detection when phase transitions to `FINISHED`.

## Files to touch

- **modify** `src/lib/api/types.ts` — add `gameOver` and `winnerName` to `ShotResponse`; add `sunkShipType` to `ShotCellResponse`
- **create** `src/app/game/[token]/battle-screen.tsx` — main battle component with both grids, turn logic, fire handler, polling
- **create** `src/app/game/[token]/board-grid.tsx` — reusable 10×10 grid component (renders cells with labels A-J / 1-10)
- **modify** `src/app/game/[token]/page.tsx` — import and render `BattleScreen` in the `IN_PROGRESS` phase block; add polling for IN_PROGRESS phase

## Steps

1. **Fix type mismatches in `src/lib/api/types.ts`**:
   - Add `gameOver: boolean` and `winnerName: string | null` fields to `ShotResponse` interface (after `sunkShipType`).
   - Add `sunkShipType: string | null` field to `ShotCellResponse` interface (after `result`).

2. **Create `src/app/game/[token]/board-grid.tsx`** — a reusable "use client" grid component:
   - Props: `title: string`, `cells: Map<string, CellState>`, `onCellClick?: (row: number, col: number) => void`, `disabled?: boolean`, `interactive?: boolean`.
   - `CellState` type: `{ type: 'empty' | 'ship' | 'hit' | 'miss' | 'sunk' }`.
   - Render column labels (1-10) across the top, row labels (A-J) down the left.
   - Render 10×10 grid of `h-8 w-8` cells with Tailwind styling:
     - `empty` (no ship, no shot): blue-100/blue-900 for water.
     - `ship` (my board only, no hit): green-400/green-600 for ship body.
     - `hit`: red-500 with "✕" text marker.
     - `miss`: gray-300/gray-600 with "○" text marker.
     - `sunk`: purple-600 with "✕" and distinct border/background.
   - If `interactive` is true and cell is `empty`, show hover cursor and call `onCellClick` on click.
   - If `disabled` is true, apply `pointer-events-none opacity-60` to the grid.
   - Dark mode support with `dark:` variants.

3. **Create `src/app/game/[token]/battle-screen.tsx`** — the main battle component:
   - Props: `gameState: GameStateResponse`, `user: UserResponse`, `gameToken: string`, `onGameStateUpdate: (state: GameStateResponse) => void`.
   - Derive `isMyTurn = gameState.currentTurnPlayerName === user.name`.
   - **My Board (left grid)**:
     - Build cell map: iterate `gameState.myBoard.ships` → use `getShipCells` to mark occupied cells as `ship`. Then overlay `gameState.myBoard.shotsReceived` → mark cells as `hit` (if cell has ship) or `miss`.
     - Render `BoardGrid` with `title="My Fleet"`, non-interactive (no click handler).
   - **Opponent Board (right grid)**:
     - Build cell map: all cells start as `empty`. Overlay `gameState.opponentBoard.shotsFired` → mark as `hit`, `miss`, or `sunk` based on `result`.
     - Render `BoardGrid` with `title="Enemy Waters"`, `interactive={true}`, `disabled={!isMyTurn || firing}`, `onCellClick={handleFire}`.
   - **Turn indicator** between/above grids:
     - If `isMyTurn`: green badge "Your Turn — Fire!" 
     - If not: amber badge "Opponent's Turn — Waiting…" with subtle pulse animation.
   - **Fire handler** (`handleFire(row, col)`):
     - Guard: if not my turn or already firing or cell already shot, return early.
     - Set `firing = true`, call `fireShot(gameToken, { row, col })`.
     - On success: optimistically add the shot to local opponent board state with the returned result. Check `response.gameOver` — if true, refetch game state (triggers FINISHED phase rendering in parent). If not game over, turn switches (set `isMyTurn = false`, start polling).
     - On error: show error message, reset `firing` state.
   - **Polling** (3s interval):
     - Active only when `!isMyTurn` (waiting for opponent).
     - Calls `getGame(gameToken)`, calls `onGameStateUpdate` with the new state.
     - Stops when turn changes back to me or phase changes to FINISHED.
   - **Error state**: red banner below grids for API errors (dismissible).
   - **Firing state**: show subtle loading indicator on the clicked cell while request is in-flight.

4. **Modify `src/app/game/[token]/page.tsx`**:
   - Import `BattleScreen` from `./battle-screen`.
   - Replace the `IN_PROGRESS` placeholder block with:
     ```tsx
     <BattleScreen
       gameState={gameState}
       user={user}
       gameToken={token}
       onGameStateUpdate={setGameState}
     />
     ```
   - Remove existing polling condition for `IN_PROGRESS` from the page-level polling effect (battle-screen handles its own polling).
   - Update the `FINISHED` block to also show final board states if `gameState.myBoard` and `gameState.opponentBoard` are present (show both grids in read-only mode with a winner banner above).

5. **Game-over handling in page.tsx FINISHED block**:
   - If `gameState.winnerName === user.name`: show victory message ("You won! 🎉").
   - Otherwise: show defeat message ("You lost. Better luck next time!").
   - Show a "Back to Lobby" button linking to `/`.

## Verification

```bash
# 1. Type check
npx tsc --noEmit

# 2. Build
npm run build

# 3. Lint
npm run lint

# 4. fireShot called in battle screen
grep -c "fireShot" src/app/game/\[token\]/battle-screen.tsx

# 5. Turn detection logic present
grep "isMyTurn\|currentTurnPlayerName" src/app/game/\[token\]/battle-screen.tsx

# 6. IN_PROGRESS renders BattleScreen
grep "IN_PROGRESS" src/app/game/\[token\]/page.tsx

# 7. ShotResponse updated with gameOver and winnerName
grep "gameOver\|winnerName" src/lib/api/types.ts

# 8. ShotCellResponse has sunkShipType
grep "sunkShipType" src/lib/api/types.ts

# 9. Opponent board disabling logic (pointer-events or disabled prop)
grep -E "disabled|pointer-events-none" src/app/game/\[token\]/board-grid.tsx

# 10. My board is non-interactive (no onCellClick in my board render)
grep -A2 "My Fleet" src/app/game/\[token\]/battle-screen.tsx
```

## Rollback

```bash
git checkout HEAD -- src/lib/api/types.ts src/app/game/\[token\]/page.tsx
rm -f src/app/game/\[token\]/battle-screen.tsx src/app/game/\[token\]/board-grid.tsx
```
