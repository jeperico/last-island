# REQ-5: Ship Placement Screen

## Objective

Implement a fully interactive ship placement screen on the `/game/[token]` page that detects the `PLACING_SHIPS` phase, lets the user place 5 filiation-specific ships on a 10×10 grid via click-to-place with orientation toggle, validates placements client-side, submits to the backend, and handles post-placement states.

## Files to touch

- **modify** `src/lib/api/types.ts` — fix ShipType union, ShipPlacementDto field name, add GameStateResponse, fix BoardResponse and ShipResponse to match backend
- **modify** `src/lib/api/games.ts` — change `getGame` return type to new `GameStateResponse`
- **modify** `src/lib/api/index.ts` — export new types (GameStateResponse, MyBoardResponse, OpponentBoardResponse)
- **create** `src/lib/game/ship-config.ts` — fleet definitions (type→size mapping, filiation→fleet lookup)
- **create** `src/lib/game/placement-logic.ts` — pure functions: getShipCells, isValidPlacement, hasOverlap
- **create** `src/lib/game/index.ts` — barrel export for game lib
- **create** `src/app/game/[token]/ship-placement.tsx` — the main ship placement UI component
- **modify** `src/app/game/[token]/page.tsx` — replace placeholder with phase-detecting game page that renders ShipPlacement for PLACING_SHIPS

## Steps

1. **Fix `src/lib/api/types.ts`**:
   - Replace `ShipType` union with: `"THOUSAND_SUNNY" | "MOBY_DICK" | "RED_FORCE" | "POLAR_TANG" | "STRIKER" | "BUSTER_CALL" | "WARSHIP" | "BATTLESHIP" | "CRUISER" | "CUTTER"`
   - Rename `ShipPlacementDto.shipType` → `type` (field name the backend expects)
   - Fix `ShipResponse` to: `{ type: ShipType; orientation: Orientation; row: number; col: number; size: number }`
   - Fix `BoardResponse` (placeShips return) to: `{ boardId: string; ownerName: string; ships: ShipResponse[]; gamePhase: GamePhase }`
   - Add `MyBoardResponse`: `{ boardId: string; ownerName: string; ships: ShipResponse[]; shotsReceived: ShotCellResponse[] }`
   - Add `ShotCellResponse`: `{ row: number; col: number; result: ShotResult }`
   - Add `OpponentBoardResponse`: `{ boardId: string; ownerName: string; shotsFired: ShotCellResponse[] }`
   - Add `GameStateResponse`: `{ id: string; token: string; phase: GamePhase; bluePlayerName: string; redPlayerName: string | null; currentTurnPlayerName: string | null; winnerName: string | null; startedAt: string | null; endedAt: string | null; createdAt: string; myBoard: MyBoardResponse | null; opponentBoard: OpponentBoardResponse | null }`
   - Keep existing `GameResponse` (used by lobby's `joinGame` which returns the simpler DTO) but rename to `JoinGameResponse` with fields: `{ token: string; phase: GamePhase }`

2. **Fix `src/lib/api/games.ts`**:
   - Change `getGame` return type from `GameResponse` to `GameStateResponse`
   - Change `joinGame` return type from `GameResponse` to `JoinGameResponse`

3. **Fix `src/lib/api/index.ts`**:
   - Add exports for `GameStateResponse`, `MyBoardResponse`, `OpponentBoardResponse`, `ShotCellResponse`, `JoinGameResponse`
   - Remove old `GameResponse` export (or keep as alias if needed)

4. **Fix `src/app/page.tsx`** (lobby):
   - Update `joinGame` usage — it returns `JoinGameResponse` now (only uses `.token`, so no logic change needed, just import name if it was explicit)

5. **Create `src/lib/game/ship-config.ts`**:
   - Define `SHIP_SIZES: Record<ShipType, number>` mapping each ship type to its size
   - Define `PIRATE_FLEET: ShipType[]` = `["THOUSAND_SUNNY", "MOBY_DICK", "RED_FORCE", "POLAR_TANG", "STRIKER"]`
   - Define `MARINE_FLEET: ShipType[]` = `["BUSTER_CALL", "WARSHIP", "BATTLESHIP", "CRUISER", "CUTTER"]`
   - Define `SHIP_DISPLAY_NAMES: Record<ShipType, string>` with human-friendly names (e.g., "Thousand Sunny", "Moby Dick")
   - Export `getFleetForFiliation(filiation: Filiation): ShipType[]`

6. **Create `src/lib/game/placement-logic.ts`**:
   - `getShipCells(row: number, col: number, size: number, orientation: Orientation): {row: number, col: number}[]` — returns array of cells the ship occupies
   - `isInBounds(row: number, col: number, size: number, orientation: Orientation): boolean` — bounds check (row∈[0,9], col∈[0,9], extends within grid)
   - `hasOverlap(cells: {row:number,col:number}[], occupiedCells: Set<string>): boolean` — check if any cell already taken
   - `cellKey(row: number, col: number): string` — "row,col" string for Set membership
   - All functions are pure, no dependencies.

7. **Create `src/lib/game/index.ts`** — barrel: re-export everything from ship-config and placement-logic.

8. **Rewrite `src/app/game/[token]/page.tsx`**:
   - Keep `"use client"`, `useRequireAuth()`, `useAuth()`, `useParams()`
   - On mount, call `getGame(token)` to fetch `GameStateResponse`
   - Based on `phase`:
     - `PLACING_SHIPS` + `myBoard.ships` is empty → render `<ShipPlacement>` component
     - `PLACING_SHIPS` + `myBoard.ships` is non-empty → show "Waiting for opponent to deploy fleet…" with a 5-second polling interval to re-check phase
     - `IN_PROGRESS` → show "Battle phase (coming soon)" placeholder
     - `FINISHED` → show "Game finished" placeholder
     - `WAITING_OPPONENT` → show "Waiting for opponent to join…"
   - Handle loading and error states

9. **Create `src/app/game/[token]/ship-placement.tsx`** ("use client" component):
   - Props: `gameToken: string`, `filiation: Filiation`, `onPlacementComplete: (gamePhase: GamePhase) => void`
   - State: `selectedShipType: ShipType | null`, `orientation: Orientation`, `placements: Map<ShipType, {row, col, orientation}>`, `hoveredCell: {row, col} | null`, `submitting: boolean`, `error: string | null`
   - Derive fleet from `getFleetForFiliation(filiation)`
   - Derive `occupiedCells: Set<string>` from current placements
   - Derive `allPlaced: boolean` when `placements.size === 5`
   - **Ship panel** (left sidebar): list each ship in fleet with name, size (dots or blocks), highlight if selected, dim if already placed. Click selects it (or removes from grid if already placed).
   - **Orientation indicator + toggle button**: shows current orientation, click or press `R` to toggle. Use `useEffect` with `keydown` listener for `R`.
   - **10×10 grid** (center): cells 0-9 × 0-9 with row/col labels (A-J / 1-10). Each cell:
     - If part of a placed ship → blue/teal background
     - If hovering with valid placement preview → green semi-transparent overlay on ship cells
     - If hovering with invalid placement → red semi-transparent overlay
     - On click: if `selectedShipType` set and valid → add to `placements` map and clear selection
     - On click existing placed ship cell → remove that ship from placements
   - `onMouseEnter` on cells updates `hoveredCell` for preview rendering
   - **Deploy Fleet button** (below grid): enabled when `allPlaced && !submitting`. On click:
     - Build `PlaceShipsRequest` from placements map
     - Call `placeShips(gameToken, request)`
     - On success: call `onPlacementComplete(response.gamePhase)`
     - On error: display error message in red banner
   - **Reset button**: clear all placements

10. **Tailwind styling**:
    - Grid cells: `w-8 h-8` (or `w-9 h-9`), border, hover effects
    - Ship panel: fixed-width sidebar, ship items as cards/pills
    - Responsive: flex-col on small screens, flex-row on medium+
    - Dark mode support using `dark:` classes
    - Color scheme: blue/teal for placed ships, green for valid hover, red for invalid hover, gray for empty cells

## Verification

```bash
# 1. Type-check passes
npx tsc --noEmit

# 2. Build passes (Turbopack)
npm run build

# 3. Lint passes
npm run lint

# 4. Old ShipType values removed
! grep -rn "CARRIER\|SUBMARINE\|DESTROYER" src/lib/api/types.ts

# 5. ShipPlacementDto uses 'type' not 'shipType'
grep -n '"type":\|type:' src/lib/api/types.ts | grep -q ShipPlacement || grep -n "type: ShipType" src/lib/api/types.ts

# 6. Ship placement component exists with grid
grep -q "10.*10\|GRID_SIZE\|grid" src/app/game/\\[token\\]/ship-placement.tsx

# 7. Phase detection in game page
grep -q "PLACING_SHIPS" src/app/game/\\[token\\]/page.tsx

# 8. Fleet config has all 10 ship types
grep -c "THOUSAND_SUNNY\|MOBY_DICK\|RED_FORCE\|POLAR_TANG\|STRIKER\|BUSTER_CALL\|WARSHIP\|BATTLESHIP\|CRUISER\|CUTTER" src/lib/game/ship-config.ts | grep -q "10"

# 9. Validation logic exists
grep -q "isInBounds\|hasOverlap" src/lib/game/placement-logic.ts

# 10. Deploy button calls placeShips
grep -q "placeShips" src/app/game/\\[token\\]/ship-placement.tsx
```

## Rollback

```bash
git checkout HEAD -- src/lib/api/types.ts src/lib/api/games.ts src/lib/api/index.ts src/app/game/\[token\]/page.tsx src/app/page.tsx
rm -f src/lib/game/ship-config.ts src/lib/game/placement-logic.ts src/lib/game/index.ts src/app/game/\[token\]/ship-placement.tsx
```
