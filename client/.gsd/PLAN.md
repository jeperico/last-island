# REQ-9: Win/Loss Detection — Polish Game-Over Screen

## Objective

Enhance the existing FINISHED phase UI with a dedicated game-over results panel showing opponent name, game stats (duration, shots fired, accuracy), and hide the confusing turn indicator when BattleScreen renders in finished state.

## Files to touch

- modify `src/app/game/[token]/page.tsx` — Replace inline win/loss heading with a `GameOverPanel` component; pass computed stats
- create `src/app/game/[token]/game-over-panel.tsx` — Dedicated component: victory/defeat banner, opponent name, game stats (duration, shots fired, hits, accuracy per player), Back to Lobby button
- modify `src/app/game/[token]/battle-screen.tsx` — Accept optional `readOnly` prop; hide turn indicator and disable polling/firing when `readOnly` is true

## Steps

1. **Add `readOnly` prop to BattleScreen** — In `battle-screen.tsx`, add an optional `readOnly?: boolean` prop to the interface. When `readOnly` is true: skip the polling `useEffect` (already stops for FINISHED phase but make explicit), hide the turn indicator `<div>`, disable interactive on opponent board, hide the error/firing UI. This prevents the "Your Turn / Opponent's Turn" badge from showing in the finished state.

2. **Create `game-over-panel.tsx`** — A "use client" component accepting props: `isWinner: boolean`, `winnerName: string`, `opponentName: string`, `myShots: number`, `myHits: number`, `opponentShots: number`, `opponentHits: number`, `durationSeconds: number | null`. Renders:
   - Large victory ("Victory! 🏴‍☠️") or defeat ("Defeat…") heading with green/red styling
   - "vs {opponentName}" subtitle
   - Stats grid: game duration (formatted as Xm Ys), your shots/hits/accuracy, opponent shots/hits/accuracy
   - "Back to Lobby" button (Link to "/")
   - Follows existing dark mode pattern (`dark:` variants)

3. **Update FINISHED block in `page.tsx`** — Replace the current inline heading + Link with the new `GameOverPanel`. Compute stats from `gameState`:
   - `opponentName`: derive from bluePlayerName/redPlayerName (whichever is not `user.name`)
   - `myShots`: `gameState.opponentBoard.shotsFired.length`
   - `myHits`: `gameState.opponentBoard.shotsFired.filter(s => s.result === "HIT" || s.result === "SUNK").length`
   - `opponentShots`: `gameState.myBoard.shotsReceived.length`
   - `opponentHits`: `gameState.myBoard.shotsReceived.filter(s => s.result === "HIT" || s.result === "SUNK").length`
   - `durationSeconds`: if both `startedAt` and `endedAt` present, `(new Date(endedAt) - new Date(startedAt)) / 1000`, else null
   - Pass `readOnly` to BattleScreen in the FINISHED block

## Verification

```bash
# Type-check
npx tsc --noEmit

# Build
npm run build

# Lint
npm run lint

# Confirm game-over-panel exists and exports component
grep -n "export function GameOverPanel" src/app/game/[token]/game-over-panel.tsx

# Confirm readOnly prop added to BattleScreen
grep -n "readOnly" src/app/game/[token]/battle-screen.tsx

# Confirm turn indicator is hidden when readOnly
grep -n "readOnly" src/app/game/[token]/battle-screen.tsx | grep -i "turn\|indicator"

# Confirm stats are computed in FINISHED block
grep -n "myShots\|myHits\|opponentShots\|durationSeconds" src/app/game/[token]/page.tsx

# Confirm opponent name is displayed
grep -n "opponentName" src/app/game/[token]/game-over-panel.tsx

# Confirm GameOverPanel used in page.tsx FINISHED block
grep -n "GameOverPanel" src/app/game/[token]/page.tsx
```

## Rollback

```bash
git checkout HEAD -- src/app/game/[token]/page.tsx src/app/game/[token]/battle-screen.tsx
rm -f src/app/game/[token]/game-over-panel.tsx
```
