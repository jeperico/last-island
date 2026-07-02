# Redesign game-over results into a single cohesive printable page

## Objective

Refactor the FINISHED phase into one unified GameOverPanel component that renders the victory/defeat banner, both boards side-by-side, stats comparison card, and a print-friendly layout — replacing the current split of GameOverPanel + BattleScreen(readOnly).

## Files to touch

- `src/app/game/[token]/game-over-panel.tsx` — **modify** (major rewrite: add board rendering, restructure layout)
- `src/app/game/[token]/page.tsx` — **modify** (simplify FINISHED phase: pass board data to GameOverPanel, remove BattleScreen readOnly usage)
- `src/app/globals.css` — **modify** (add @media print rules at end of file)

## Steps

1. **Extend GameOverPanel props to accept board data**
   - Add new props: `myBoard: MyBoardResponse | null`, `opponentBoard: OpponentBoardResponse | null`
   - Import `BoardGrid` and `CellState` from `./board-grid`
   - Import `getShipCells`, `cellKey` from `@/lib/game`
   - Import `GameStateResponse`, `MyBoardResponse`, `OpponentBoardResponse`, `ShotCellResponse` types from `@/lib/api/types`

2. **Add board cell-building logic inside GameOverPanel**
   - Add local helper `buildMyBoardCells(myBoard: MyBoardResponse): Map<string, CellState>` — same logic as battle-screen.tsx lines 175–200 (mark ship cells from `myBoard.ships` using `getShipCells`, overlay `shotsReceived` as hit/miss/sunk)
   - Add local helper `buildOpponentBoardCells(shotsFired: ShotCellResponse[]): Map<string, CellState>` — same logic as battle-screen.tsx lines 207–222 (map each shot to hit/miss/sunk)

3. **Restructure GameOverPanel layout (top to bottom)**
   - Increase max-width from `max-w-lg` (32rem) to `max-w-4xl` (~56rem) to accommodate boards side-by-side
   - **Section 1 — Banner:** Keep existing Victory/Defeat heading (emoji + colored text) + opponent subtitle. Add class `print:text-black` for print readability.
   - **Section 2 — Boards:** New flex row: `<div className="flex flex-wrap items-start justify-center gap-6 w-full">` containing two `<BoardGrid>` components:
     - "My Fleet" board: `<BoardGrid title="My Fleet" cells={myBoardCells} />` (only if `myBoard` is non-null)
     - "Enemy Waters" board: `<BoardGrid title="Enemy Waters" cells={opponentBoardCells} />` (only if `opponentBoard` is non-null)
   - Add wrapper class `game-results-boards` for print CSS targeting
   - **Section 3 — Stats card:** Keep existing stats card structure (duration banner, VS layout, stat rows with emoji icons, winner banner). No changes needed to the StatRow sub-component.
   - **Section 4 — Navigation:** Keep "Back to Grand Line" link but wrap it with class `print:hidden` so it disappears when printing.

4. **Simplify FINISHED phase in page.tsx**
   - Remove the conditional `<BattleScreen ... readOnly />` block (lines 228–236)
   - Pass `myBoard={gameState.myBoard}` and `opponentBoard={gameState.opponentBoard}` as new props to `<GameOverPanel>`
   - Keep all existing stat-computation logic (myShots, myHits, etc.) in page.tsx — pass as before
   - Remove `BattleScreen` import if it's no longer used by any other phase (check: it IS still used for IN_PROGRESS phase, so keep the import)
   - The outer wrapper div stays: `<div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">`

5. **Add @media print styles to globals.css**
   - Append at end of file:
   ```css
   /* ─── Print styles ─────────────────────────────────────────────────────────── */
   @media print {
     body {
       background: white !important;
       color: black !important;
       -webkit-print-color-adjust: exact;
       print-color-adjust: exact;
     }

     /* Hide non-essential UI */
     .print\\:hidden,
     nav,
     footer,
     button,
     [data-print-hide] {
       display: none !important;
     }

     /* Boards: ensure they fit side-by-side on paper */
     .game-results-boards {
       gap: 1rem !important;
     }

     /* Scale down board cells for print (A4 friendly) */
     .game-results-boards .board-cell {
       width: 1.25rem !important;
       height: 1.25rem !important;
     }

     /* Remove dark backgrounds from cards */
     .game-results-boards,
     [class*="bg-surface"],
     [class*="bg-\\[var"] {
       background: white !important;
       border-color: #ccc !important;
     }

     /* Ensure content stays on one page */
     * {
       break-inside: avoid;
     }
   }
   ```

6. **Add `board-cell` class to BoardGrid cells for print targeting**
   - In `board-grid.tsx`: add `board-cell` to the cell div's className (the `h-8 w-8` element). This is a minimal non-breaking addition — just concatenate the class.

7. **Add print:hidden utility to the "Back to Grand Line" link**
   - In game-over-panel.tsx: add `print:hidden` class to the Link wrapper/container.

## Verification

```bash
cd /home/perico/work/last-island/client

# 1. Type-check — no errors
npx tsc --noEmit

# 2. Production build — compiles successfully
npm run build

# 3. Lint — no new warnings
npm run lint
```

### Manual checks (reviewer)
- Load a FINISHED game → single cohesive page shows: banner, both boards side-by-side, stats card, "Back to Grand Line" button
- Boards display correct cell states (ships on my board, hits/misses/sunks on opponent board)
- Print preview (Ctrl+P): white background, boards fit on one page, "Back to Grand Line" button hidden, stats card readable
- Responsive check at 375px width: boards wrap vertically (flex-wrap), no horizontal overflow
- No visual regressions on IN_PROGRESS phase (BattleScreen still renders normally)

## Rollback

```bash
cd /home/perico/work/last-island/client
git checkout HEAD -- src/app/game/[token]/game-over-panel.tsx src/app/game/[token]/page.tsx src/app/game/[token]/board-grid.tsx src/app/globals.css
```
