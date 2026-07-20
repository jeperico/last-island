# Refactor Ship Placement Component — Visual Richness Upgrade

## Objective

Rewrite the JSX/CSS layer of `client/src/app/game/[token]/ship-placement.tsx` to match the project's dark nautical design system quality, transforming a plain functional layout into a visually rich sea-chart deployment screen — without touching any business logic.

## Files to touch

- `client/src/app/game/[token]/ship-placement.tsx` — modify (visual-only rewrite of JSX classes and layout structure)

## Steps

1. **Upgrade the outer container** — Keep `bg-surface/80 backdrop-blur-sm rounded-2xl p-6` but upgrade to `backdrop-blur-md` (matches waiting/deployed cards). Add `border border-border` for definition. Add an internal teal accent strip at the top: `<div className="h-1 w-full bg-gradient-to-r from-primary/30 via-ocean/20 to-transparent rounded-t-2xl absolute top-0 left-0" />` (make outer container `relative overflow-hidden`).

2. **Redesign the title/header** — Replace plain `text-xl font-bold text-foreground` with:
   - Emoji prefix: `⚓` or `🗺️`
   - `text-2xl font-bold text-text-primary` (proper token, larger)
   - Add subtitle: `<p className="text-sm text-text-muted">Position your fleet on the sea chart</p>`
   - Center-align with `text-center`

3. **Reduce gap between ship panel and grid** — Change `gap-24` to `gap-8 md:gap-12` (gap-24 is excessive; battle-screen uses gap-8).

4. **Redesign the ship panel as a fleet manifest** —
   - Wrap in an elevated card: `rounded-xl border border-border bg-surface-elevated p-4`
   - Section header: `<h2 className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">🚢 Fleet Manifest</h2>`
   - Add `divide-y divide-border-light` on the ship list container (remove space-y-2, use `divide-y` with no gap)
   - Each ship button: `px-3 py-2.5 first:rounded-t-lg last:rounded-b-lg` (no individual border/rounded, rely on parent divide-y)
   - Selected state: `bg-primary/15 border-l-2 border-l-primary` with `shadow-[0_0_8px_rgba(37,99,235,0.3)]`
   - Placed state: `bg-success-bg border-l-2 border-l-success`
   - Default state: `hover:bg-surface-secondary/60`
   - Ship name: `text-sm font-medium text-text-primary`
   - Hull segments: keep the small squares but use `bg-primary` for selected, `bg-success` for placed, `bg-text-muted` for unplaced. Add `rounded-[2px]` for slightly rounder dots.
   - Placed checkmark: `text-success text-xs font-bold` (✓ already there, just restyle)
   - Show ship size as `text-xs text-text-muted` badge: e.g., `(5)` next to name

5. **Redesign the orientation toggle** — Make it feel like a tactical control:
   - Wrap in its own mini-card: `mt-4 rounded-lg border border-border bg-surface-secondary/50 p-3`
   - Label above: `<span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Orientation</span>`
   - Button content: larger arrow icon, `text-sm font-medium text-text-primary`
   - Keyboard badge: `<kbd className="ml-2 rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] font-mono text-text-muted border border-border-light">R</kbd>`

6. **Enhance grid cells** — Richer cell states with ocean feel:
   - Empty: `bg-sky-950/50 hover:bg-sky-900/60 border-sky-900/40` (deeper ocean)
   - Placed: `bg-teal-500/50 border-teal-400/40 shadow-[inset_0_0_4px_rgba(45,212,191,0.3)]` (solid vessel glow)
   - Preview-valid: `bg-green-500/40 border-green-400/50 shadow-[0_0_6px_rgba(74,222,128,0.4)]` (glow effect)
   - Preview-invalid: `bg-red-500/40 border-red-400/50 shadow-[0_0_4px_rgba(248,113,113,0.3)]`
   - All cells: `rounded-[2px]` for very subtle rounding, `transition-all duration-100` for smooth state changes
   - Grid border overall: wrap the grid in a container with `border border-border rounded-lg p-1 bg-surface-secondary/30` to create a "chart frame"

7. **Grid labels enhancement** — Change `text-text-secondary` to `text-text-muted text-[10px] font-mono` for a coordinate/chart feel.

8. **Action buttons area** — Group buttons in a mini-card container:
   - Wrap in `mt-5 rounded-lg border border-border bg-surface-secondary/30 p-3`
   - Keep existing Button component usage (primary, secondary variants)
   - Add a subtle label above: `<span className="text-xs text-text-muted font-medium mb-2 block">Actions</span>` (or remove if too busy — implementer discretion)
   - Tighten to `gap-2` for the row, keep `w-full` on Deploy

9. **Surrender button** — Replace custom inline styles with Button component usage:
   - Use `<Button variant="ghost" size="sm" onClick={() => setSurrenderOpen(true)} className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs opacity-70 hover:opacity-100">🏳️ Surrender</Button>`
   - This matches battle-screen's surrender pattern and leverages the existing component

10. **Text token migration** — Replace all instances of `text-foreground` with appropriate design-system tokens:
    - Headings → `text-text-primary`
    - Labels → `text-text-secondary`
    - Metadata → `text-text-muted`

## Verification

```bash
# 1. Build — no TS/compilation errors
cd client && npx next build

# 2. Lint — no lint errors in the modified file
cd client && npx eslint src/app/game/\\[token\\]/ship-placement.tsx

# 3. Business logic preserved (should be ≥10 matches)
grep -c "handleCellClick\|handleShipSelect\|handleRandomize\|handleReset\|handleDeploy\|handleSurrender\|getCellState\|occupiedCells\|cellToShipMap\|hoverPreview" client/src/app/game/\\[token\\]/ship-placement.tsx

# 4. Frosted glass pattern exists
grep "backdrop-blur" client/src/app/game/\\[token\\]/ship-placement.tsx

# 5. Design-system surface tokens used
grep "bg-surface" client/src/app/game/\\[token\\]/ship-placement.tsx

# 6. Ship config imports unchanged
grep "SHIP_DISPLAY_NAMES\|SHIP_SIZES\|PIRATE_FLEET" client/src/app/game/\\[token\\]/ship-placement.tsx

# 7. Proper text hierarchy tokens used (should be ≥3 matches)
grep -c "text-text-primary\|text-text-secondary\|text-text-muted" client/src/app/game/\\[token\\]/ship-placement.tsx

# 8. Props interface intact
grep "onPlacementComplete\|gameToken" client/src/app/game/\\[token\\]/ship-placement.tsx

# 9. SurrenderModal still rendered
grep "SurrenderModal" client/src/app/game/\\[token\\]/ship-placement.tsx

# 10. Accent strip or gradient accent present
grep "bg-gradient-to" client/src/app/game/\\[token\\]/ship-placement.tsx

# 11. Manual: open a game in browser, navigate to placement screen, verify ships are selectable, placeable, grid responds to hover, randomize works, deploy works
```

## Rollback

```bash
git checkout -- client/src/app/game/\\[token\\]/ship-placement.tsx
```
