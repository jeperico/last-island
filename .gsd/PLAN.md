# Improve game waiting pages (WAITING_OPPONENT and Fleet deployed) UI

## Objective

Redesign the WAITING_OPPONENT and 'Fleet deployed' waiting screens with richer content — player avatar/stats, fleet manifest, and better visual hierarchy — while keeping the existing layout constraints and One Piece nautical theme.

## Files to touch

- modify `client/src/app/game/[token]/page.tsx`

## Steps

1. Add imports at the top of the file:
   - `AvatarIcon` from `@/components/ui`
   - `formatBounty` from `@/lib/format`
   - `SHIP_DISPLAY_NAMES, SHIP_SIZES` from `@/lib/game/ship-config`

2. Redesign the **WAITING_OPPONENT** section (inside `renderPhaseContent`):
   - Keep the outer `div` structure, wallpaper background, and `-z-10` layer unchanged
   - Replace the single card with a wider card (`max-w-md`) containing:
     - **Player identity section**: `AvatarIcon` (size `lg`) with the user's avatar and rank, the player name in `text-lg font-bold`, rank text below in `text-text-secondary text-sm`, and bounty formatted with `formatBounty` + ₿ suffix in `text-primary`
     - **Divider**: a `border-t border-border` with some vertical margin
     - **Waiting message section**: Keep the ⛵ emoji (smaller, `text-4xl`) with bounce animation, the "Scanning the horizon…" title (`text-lg`), and the description text
     - **Status pill**: Keep the pulsing dot + "Searching for opponents…" at the bottom
   - Add a subtle stats row between the avatar and divider: wins count and bounty in a `flex gap-6` row with labels

3. Redesign the **Fleet deployed** section (PLACING_SHIPS, hasPlacedShips=true, isRedeploying=false):
   - Keep the outer `div` structure, wallpaper background unchanged
   - Replace the single card with a wider card (`max-w-md`) containing:
     - **Header**: 🧭 emoji (text-3xl, animate-pulse) + "Fleet deployed, Captain!" title side by side in a row
     - **Fleet manifest**: A compact list of deployed ships from `gameState.myBoard.ships`, each row showing ship name (from `SHIP_DISPLAY_NAMES`) and size dots (filled circles representing cells). Use `text-text-secondary` for names and `bg-primary` circles for size visualization. Wrap in a bordered section with `bg-surface-secondary/50 rounded-lg p-3`
     - **Status pill**: Keep the pulsing dot + "Opponent preparing fleet…" text
     - **Redeploy button**: Keep the existing ghost-style button with 🔄 icon, unchanged

4. Ensure no new TypeScript errors or lint violations:
   - All referenced props from `GameStateResponse` exist (`bluePlayerAvatar`, `bluePlayerRank`, `bluePlayerBounty`, `bluePlayerWins`, `myBoard.ships`)
   - Use `user.name`, `user.rank`, `user.bounty`, `user.wins` from the auth context where appropriate
   - Guard `myBoard` access with existing `gameState.myBoard !== null` checks

## Verification

```bash
cd client && npm run build
cd client && npx eslint src/app/game/\[token\]/page.tsx --max-warnings 999
```

Manual checks:
- Verify WAITING_OPPONENT shows avatar, name, rank, bounty, wins, and the waiting animation
- Verify Fleet deployed shows the ship manifest with names and size dots, plus the Redeploy button
- Verify wallpaper background still renders correctly on both screens
- Verify existing behavior (SSE transitions, redeploy flow) is unaffected

## Rollback

```bash
git checkout -- client/src/app/game/\[token\]/page.tsx
```
