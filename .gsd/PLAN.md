# Restructure Dashboard into 60/40 Two-Column Grid Layout

## Objective

Rewrite `client/src/app/page.tsx` into a responsive 60/40 two-column grid layout with an Olympic podium leaderboard, compact battle log, and action-first games column, while preserving all existing data-fetching logic and the blue ocean theme.

## Files to touch

- `client/src/app/page.tsx` — modify (full rewrite of JSX, keep hooks/state/handlers intact)
- `client/src/styles/globals.css` — modify (add gold/silver/bronze color tokens for podium)

## Steps

1. **Add podium color tokens to `globals.css`**
   - In `:root`, add:
     - `--color-gold: #fbbf24;`
     - `--color-silver: #94a3b8;`
     - `--color-bronze: #cd7f32;`
   - In `@theme inline`, expose them:
     - `--color-gold: var(--color-gold);`
     - `--color-silver: var(--color-silver);`
     - `--color-bronze: var(--color-bronze);`

2. **Restructure page layout (page.tsx)**
   - Replace the single `max-w-2xl` wrapper with a full-width `max-w-7xl` container.
   - Keep the `PageHeader` (welcome + logout) spanning full width above the grid.
   - Keep the `Alert` for errors spanning full width below header.
   - Add a two-column grid: `grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6`.
   - Left column (`<div>`): Leaderboard section + Battle Log section.
   - Right column (`<div className="order-first lg:order-none">`): Games section (action-first on mobile).

3. **Right column — Games section**
   - Section title: "⚓ Battle Station"
   - Big `Button` (variant="primary", fullWidth, large size feel) — "Start Battle" calling `handleCreateGame`.
   - Active games list: change `listGames` call from `size: 10` to `size: 5`, remove pagination state/handlers/buttons, wrap the game cards in `max-h-[320px] overflow-y-auto` container.
   - Each game card: keep existing Card layout but make it more compact (padding="sm").
   - At the bottom: small join-by-token form (Input + Button), same as existing `onJoin` logic but visually smaller (text-sm label, compact spacing).

4. **Left column — Leaderboard section**
   - Section title: "🏆 Leaderboard" with All/Pirates/Marines tab buttons below (keep existing tab logic).
   - **Top 3 podium**: When `leaderboard.entries` has ≥1 entries, render positions 1-3 as a flex row with 3 podium cards:
     - Layout: flex with items arranged as [2nd] [1st] [3rd] visually (1st elevated with `mt-0`, 2nd/3rd with `mt-6`).
     - Each podium card: centered column with:
       - `<img src="/skull-icon.png" alt="avatar" className="w-12 h-12 rounded-full" />` with a colored ring glow (`ring-2 ring-gold` / `ring-silver` / `ring-bronze`).
       - Position medal emoji (🥇/🥈/🥉).
       - Player name (truncated, `text-sm font-semibold`).
       - Filiation emoji (🏴‍☠️ / ⚓).
       - Win count (`text-xs text-text-muted`).
     - Card background: `bg-surface-elevated` with a subtle colored top border or glow matching medal.
   - **Entries 4-10**: Compact list below the podium:
     - Each entry: single row with `flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-surface-secondary`.
     - Show: position number (text-sm, bold), filiation emoji, name, wins aligned right.
     - Current user highlighted with `bg-surface-secondary ring-1 ring-primary`.
   - **Current user outside top 10**: Show the `currentUserEntry` divider as before but in compact style.
   - Fix existing bug: change `ring-accent-primary` → `ring-primary` (token doesn't exist).

5. **Left column — Battle Log section (below leaderboard)**
   - Section title: "⚔️ Battle Log"
   - Compact rows: no `Card` wrapper per entry. Instead use `flex items-center gap-2 py-2 border-b border-border-light` per row.
   - Each row: Badge (VICTORY/DEFEAT, size small), opponent name (`text-sm`), date (`text-xs text-text-muted`), a "→" indicator as a placeholder for future modal.
   - Add `cursor-pointer hover:bg-surface-secondary rounded` to each row (placeholder for modal click).
   - If empty or loading, keep the existing EmptyState/Skeleton but make skeletons shorter (`height="2rem"`).

6. **Mobile responsiveness**
   - The grid is `grid-cols-1 lg:grid-cols-[3fr_2fr]`.
   - Right column (Games) has `order-first lg:order-none` to appear first on mobile.
   - All sections remain full-width stacked on mobile.

7. **Clean up removed code**
   - Remove `currentPage`, `setCurrentPage`, `handlePrevPage`, `handleNextPage` state/functions (no more pagination).
   - Update the `listGames` call to use `{ page: 0, size: 5 }` (always first page, 5 items).
   - Remove `PageResponse` generic wrapping if no longer needed — actually keep it, just don't paginate UI.

## Verification

```bash
make client-build
make client-lint
```

- `client-build` must pass (no TypeScript errors).
- `client-lint` must not introduce new errors beyond the 3 pre-existing issues.
- Manual check: verify `skull-icon.png` is referenced with correct path `/skull-icon.png` (exists in `client/public/`).
- No backend changes — `make service-test` not required but can optionally confirm 51/51 still pass.

## Rollback

```bash
git checkout -- client/src/app/page.tsx client/src/styles/globals.css
```
