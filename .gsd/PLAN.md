# Frontend: Redesign game-over screen as VS-style results modal

## Objective

Replace the current card-based GameOverPanel with a dramatic VS-style fullscreen modal that showcases both players' full-body character art, stats, bounty changes, and boards in a cinematic three-column layout.

## Files to touch

- `client/src/lib/format.ts` — **create** — shared `formatBounty` utility
- `client/src/app/game/[token]/game-over-panel.tsx` — **modify** (full rewrite) — VS-style modal with portal, 3-column layout
- `client/src/app/game/[token]/page.tsx` — **modify** — simplify FINISHED phase block: pass `gameState`, `user`, `onClose` instead of derived primitives; remove wrapping div with bg wallpaper (modal handles its own overlay)
- `client/src/app/page.tsx` — **modify** — import shared `formatBounty` from `@/lib/format` instead of local definition
- `client/src/app/settings/page.tsx` — **modify** — import shared `formatBounty` from `@/lib/format` instead of local definition

## Steps

1. **Create `client/src/lib/format.ts`** — extract a shared `formatBounty(n: number): string` function:
   - `>= 1_000_000_000` → `"${(n/1e9).toFixed(1)}B"`
   - `>= 1_000_000` → `"${Math.round(n/1e6)}M"`
   - else → `n.toLocaleString()`
   - No ₿ suffix (callers add it contextually).

2. **Rewrite `game-over-panel.tsx`** with the following structure:
   - **Props**: `{ gameState: GameStateResponse; user: UserResponse; onClose: () => void }`
   - **Data derivation** (inside component):
     - `isBlue = user.name === gameState.bluePlayerName`
     - Map my/opponent name, avatar, rank, bounty, wins, accuracy from blue/red fields
     - `isWinner = gameState.winnerName === user.name`
     - `bountyDelta = gameState.bountyDelta ?? 0` — winner gets `+delta`, loser gets `-delta`
     - `mySunkCount` = count of opponent board shots with result `"SUNK"` (unique ship kills)
     - `oppSunkCount` = count of my board shots received with result `"SUNK"`
     - Compute previous bounty: `myBounty - bountyDelta` (winner), `myBounty + bountyDelta` (loser)
   - **Rendering** — use `createPortal(content, document.body)`:
     - Fixed overlay: `fixed inset-0 z-50 flex items-center justify-center`
     - Semi-transparent backdrop: `bg-black/70` (lets page bg wallpaper peek through)
     - Modal panel: `w-[90vw] max-w-7xl h-[90vh] max-h-[900px]` with `rounded-xl overflow-hidden border border-border`
     - Entry animation: reuse `character-select-in` keyframes (fade + scale)
     - Escape key handler + body scroll lock (same pattern as character-select.tsx)
   - **Three-column grid** (`grid grid-cols-[1fr_2fr_1fr] h-full`):
     - **Left column (my player)**:
       - Full-body background image: `backgroundImage: url(/avatars/${avatar}/full-body.jpg)`, `bg-cover bg-center`
       - Dark gradient overlay at bottom for text readability
       - Fallback for null avatar: solid dark panel (`bg-surface-elevated`) with centered name
       - Bottom-aligned stats overlay: 👑 (if winner), name, rank (formatted with `replace(/_/g, " ")`), bounty, wins, accuracy
       - Winner crown + green glow border at bottom; loser gets subtle red border
     - **Right column (opponent)**:
       - Mirror of left column with opponent data
     - **Middle column**:
       - **Top score card** (centered, `bg-surface-secondary/90 rounded-lg p-4`):
         - Ships sunk comparison: `{mySunkCount} ⚔️ {oppSunkCount}` with label "Ships Sunk"
         - Bounty change line: `₿ {prevBounty} → {currentBounty} (+/-delta)` — green for gain, red for loss
       - **Bottom boards section** (`flex gap-4 justify-center items-center`):
         - Reuse existing `BoardGrid` component with `title="My Fleet"` and `title="Enemy Waters"`
         - Board cell building logic: keep `buildMyBoardCells` and `buildOpponentBoardCells` helpers inside the file (same as current)
         - Boards may need CSS `scale(0.85)` or `transform: scale(0.8)` wrapper if they overflow the center column — use `overflow-hidden` with flex shrink
       - **Close button** at bottom center: styled button "Return to Grand Line" → calls `onClose`
   - **Close button (×)** in top-right corner of modal (absolute positioned)

3. **Update `page.tsx` FINISHED phase block** (lines ~298–354):
   - Replace the entire FINISHED rendering with:
     ```tsx
     if (gameState.phase === "FINISHED") {
       return <GameOverPanel gameState={gameState} user={user} onClose={() => window.location.href = "/"} />;
     }
     ```
   - The background wallpaper div stays in the page naturally (it's behind the portal), so the modal backdrop reveals it.
   - Remove the `currentBounty` state and the `getProfile()` useEffect (lines 29, 70-72) — no longer needed since we use `gameState.bluePlayerBounty`/`redPlayerBounty` directly.
   - Remove unused imports that were only needed for old GameOverPanel props derivation (myShots, myHits, etc. are now derived inside the component).
   - Keep the `GameOverPanel` import (same file, new interface).

4. **Update `client/src/app/page.tsx`** (dashboard):
   - Replace the local `formatBounty` function (lines ~264-275) with:
     ```ts
     import { formatBounty } from "@/lib/format";
     ```
   - Adjust call sites: the dashboard version appends ` ₿` — update to `${formatBounty(n)} ₿` or keep the suffix at the call site.

5. **Update `client/src/app/settings/page.tsx`**:
   - Replace the local `formatBounty` function (lines ~38-48) with import from `@/lib/format`.
   - The settings page doesn't use ₿ suffix — just use `formatBounty(n)` directly.

6. **Compute sunk ship counts correctly**:
   - `mySunkCount`: Count distinct ships sunk on opponent board. Since each cell of a sunk ship has result `"SUNK"`, count unique ship positions. Simplest: divide total SUNK cells by ship size? No — just count the number of SUNK results and divide by... Actually, simpler: count how many cells have `result === "SUNK"` on opponent board, then map to unique ships. OR: just show total SUNK cells as "hits that sunk" — but design says "ships sunk". Best approach: for opponent board, count SUNK cells and divide by the known ship sizes... OR better: look at myBoard.ships — ships whose ALL cells are hit are sunk. For opponent, we don't have ship positions, but SUNK results fire per-ship (all cells of a ship become SUNK simultaneously). So count distinct groups... Actually simplest: count number of unique "SUNK events" = number of shots with result "SUNK" that represent a new sink. The backend returns all cells of a sunk ship as SUNK when the killing blow lands. So total SUNK cells / ship-size-per-ship is complex. **Simplest correct approach**: for myBoard, count ships where all cells have been hit (use ships array + shotsReceived). For opponentBoard, count how many distinct ship sizes were sunk — actually we can count the number of distinct contiguous SUNK groups... This is getting complex.
   
   **Decision**: Use a simpler "ships lost" metric: for my board, iterate `myBoard.ships` and count those where all cells match a hit/sunk shot. For opponent board, count unique sunk ships by grouping SUNK cells (adjacent SUNK cells = 1 ship). Alternative: just count the total `SUNK`-result shots and note that each individual SUNK shot corresponds to all cells of ONE ship turning SUNK simultaneously (backend marks all). So `sunkCells / shipSize` works per-ship, but we don't know sizes from opponent board. **Final approach**: 
   - My ships sunk (by opponent) = `myBoard.ships.filter(ship => isShipSunk(ship, myBoard.shotsReceived)).length`
   - Opponent ships sunk (by me) = count distinct SUNK groups in `opponentBoard.shotsFired`. Since all cells of a sunk ship share the same turn/shot-sequence, and ships have known standard sizes [5,4,3,3,2], count: total SUNK cells divided into known ship sizes descending. OR simpler: the standard fleet is 5 ships, so `5 - remaining` but we don't know remaining.
   
   **Simplest reliable approach**: 
   - My ships lost: iterate `myBoard.ships`, for each ship check if all its cells appear in `shotsReceived` with HIT or SUNK → count those.
   - Opponent ships sunk by me: Since we don't have opponent ship positions, count the number of SUNK-result cells in `opponentBoard.shotsFired`. Each ship when sunk marks ALL its cells as SUNK in one response. The fleet has ships of size [5,4,3,3,2]. So greedily subtract known sizes from total SUNK cells: `totalSunkCells` → count ships. E.g., 17 SUNK cells = all 5 ships (5+4+3+3+2=17). 12 SUNK cells = 5+4+3 = 3 ships. Actually just: `[5,4,3,3,2]`, sort descending, accumulate until sum exceeds total → count how many fit. This is reliable for standard fleet.

7. **Handle edge cases**:
   - `bountyDelta === null` → show "—" for bounty change (CANCELLED games shouldn't reach this screen, but defensive)
   - `avatar === null` → no background image, show solid `bg-surface-elevated` panel
   - Ensure `onClose` navigates to dashboard (use Next.js `useRouter().push("/")` instead of `window.location.href`)

## Verification

```bash
cd client && npm run build
cd client && npm run lint
grep -r "GameOverPanel" client/src
grep -r "formatBounty" client/src
```

Manual checks:
- Open a FINISHED game as winner → confirm VS modal appears with correct crown on winner side, green bounty delta
- Open same game as loser (other account) → confirm crown on opponent, red bounty delta  
- Verify full-body images render for all 6 avatars (luffy, zoro, robin, chopper, ace, doflamingo)
- Verify null-avatar fallback shows dark panel with name/stats only
- Press Escape → navigates back to dashboard
- Click "Return to Grand Line" button → navigates back to dashboard
- Verify boards render at readable size in center column (no overflow)
- Verify page background wallpaper visible through modal backdrop

## Rollback

```bash
git checkout HEAD -- client/src/app/game/\[token\]/game-over-panel.tsx client/src/app/game/\[token\]/page.tsx client/src/app/page.tsx client/src/app/settings/page.tsx
rm -f client/src/lib/format.ts
```
