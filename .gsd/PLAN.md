# Responsive Mobile Layout — CSS/Tailwind Fixes

## Objective

Eliminate horizontal overflow and fix spacing/layout issues on mobile viewports (320px–768px) across all screens by making BoardGrid cells responsive, adding flex-wrap to board containers, and adjusting spacing/grid breakpoints.

## Files to touch

- `client/src/app/game/[token]/board-grid.tsx` — modify (responsive cell sizes)
- `client/src/app/game/[token]/game-over-panel.tsx` — modify (flex-wrap on boards container)
- `client/src/app/game/[token]/ship-placement.tsx` — modify (responsive grid cells + labels)
- `client/src/app/page.tsx` — modify (responsive gap, token truncation)
- `client/src/app/(auth)/register/page.tsx` — modify (responsive grid-cols)
- `client/src/components/battle-detail-modal.tsx` — modify (responsive stats grid)
- `client/src/components/ui/modal.tsx` — modify (full-screen on mobile)

## Steps

1. **BoardGrid responsive cells** (`board-grid.tsx`):
   - Change cell size from `h-8 w-8` to `h-7 w-7 sm:h-8 sm:w-8` (28px on mobile, 32px on sm+).
   - Change column label cells from `h-6 w-8` to `h-6 w-7 sm:w-8`.
   - Change row label from `h-8 w-6` to `h-7 w-6 sm:h-8`.
   - Result: board width on mobile = 10×28px + 24px = **304px** (fits 320px with 8px padding each side).
   - On sm+ (≥640px): stays at 344px (current behavior preserved).

2. **Game Over Panel boards wrapping** (`game-over-panel.tsx`):
   - On line 146, change `flex-1 flex items-center justify-center gap-4 p-4` to `flex-1 flex flex-wrap items-center justify-center gap-4 p-4`.
   - This ensures the two boards wrap to vertical stacking when viewport is too narrow.

3. **Ship Placement responsive grid** (`ship-placement.tsx`):
   - Apply same responsive sizing to placement grid cells: `h-7 w-7 sm:h-8 sm:w-8`.
   - Apply to column labels: `h-6 w-7 sm:w-8` (match board-grid pattern).
   - Apply to row labels: `h-7 w-6 sm:h-8`.
   - Apply to top-left spacer: adjust to match column label height.

4. **Dashboard responsive gap** (`page.tsx`):
   - Change `gap-[80px]` to `gap-8 lg:gap-[80px]` on line 296.
   - Add `truncate` class to game token text elements if any token strings are displayed unbounded (check game cards around line 505).

5. **Register page responsive form grid** (`register/page.tsx`):
   - Change `grid grid-cols-2 gap-3` to `grid grid-cols-1 sm:grid-cols-2 gap-3` for the name/email inputs section.
   - Keep the filiation selector as `grid-cols-2` (those buttons are large enough and the 2-col layout is intentional for the binary choice).

6. **Battle Detail Modal responsive stats** (`battle-detail-modal.tsx`):
   - Change `grid grid-cols-4 divide-x` to `grid grid-cols-2 sm:grid-cols-4 divide-x` for the stats bar.
   - This gives each stat ~150px on mobile (2×2 grid) vs ~80px (4×1 row).

7. **Modal full-screen on mobile** (`modal.tsx`):
   - Add responsive classes to the modal content wrapper: on mobile (<sm), use nearly full viewport. Change `className ?? "max-w-md"` default behavior to include `sm:max-w-md` pattern so that on very small screens the modal expands naturally within the `p-4` outer padding. Specifically, ensure the `p-4` wrapper on mobile leaves only 16px margin on each side (already the case — just verify no min-width is constraining it). If the outer div already handles this via `w-full` + `p-4`, no change needed beyond confirming.

## Verification

```bash
cd client && npm run build
cd client && npm run lint
```

Manual verification (Chrome DevTools):
- Set viewport to 320px width → no horizontal scrollbar on any page
- Set viewport to 375px width → boards render fully visible, cells tappable
- Dashboard: sections stack vertically with ~32px gap (not 80px)
- Game Over Panel: boards stack vertically on <640px
- Battle Detail Modal: stats show as 2×2 grid on mobile, boards stack
- Register page: form fields stack to single column on mobile
- Ship Placement: grid fits within viewport, no horizontal overflow
- Verify cell size at 28px (h-7 w-7) is still usable for tapping

## Rollback

```bash
git checkout -- client/src/app/game/\[token\]/board-grid.tsx \
  client/src/app/game/\[token\]/game-over-panel.tsx \
  client/src/app/game/\[token\]/ship-placement.tsx \
  client/src/app/page.tsx \
  "client/src/app/(auth)/register/page.tsx" \
  client/src/components/battle-detail-modal.tsx \
  client/src/components/ui/modal.tsx
```
