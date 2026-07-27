# Responsive Mobile Layout — All Pages

## Objective

Make the Last Island frontend fully usable on 320px–768px viewports by fixing the 6 identified mobile layout issues across battle-screen, character-select, settings, ship-placement, sound-toggle, and home page.

## Files to touch

- modify: `client/src/app/game/[token]/battle-screen.tsx` — stack boards vertically on mobile, wrap turn indicator, hide/collapse HakiBar on mobile
- modify: `client/src/app/game/[token]/haki-bar.tsx` — add responsive width (`w-full md:w-48`) and horizontal compact layout for mobile
- modify: `client/src/app/game/[token]/board-grid.tsx` — add smaller cell size for very small screens (`h-6 w-6` below sm)
- modify: `client/src/app/game/[token]/ship-placement.tsx` — change `w-fit` to `w-full max-w-fit`, reduce padding on mobile, use smaller cells
- modify: `client/src/components/character-select.tsx` — switch from 6 horizontal panels to a 2×3 grid on mobile (`md:flex md:h-[100vh]` for desktop, grid for mobile)
- modify: `client/src/app/settings/page.tsx` — make avatar selector 2 rows of 3 on mobile (grid layout below md)
- modify: `client/src/components/sound-toggle.tsx` — move to `bottom-3 right-3` to avoid overlapping game-page back link
- modify: `client/src/app/page.tsx` — reduce podium padding/avatar size on very small screens

## Steps

1. **Battle screen — stack boards & collapse HakiBar on mobile**
   - In `battle-screen.tsx`, change the outer flex container (line ~489) from `flex items-start justify-center gap-4` to `flex flex-col md:flex-row items-center md:items-start justify-center gap-4`.
   - Move HakiBar inside a wrapper with `hidden md:block` for the sidebar version. Add a mobile-only compact HakiBar strip above the boards: `block md:hidden w-full`.
   - Change boards flex container (line ~519) to `flex flex-col sm:flex-row flex-wrap items-center sm:items-start justify-center gap-4 sm:gap-5`.
   - Wrap the turn indicator in `flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2` so items wrap gracefully on narrow screens.

2. **HakiBar — add horizontal compact mode for mobile**
   - Add a `compact` boolean prop (default false).
   - When `compact=true`, render abilities in a single horizontal row (`flex flex-row gap-2 w-full`) with smaller icons and no labels — just colored pip indicators + ability icons.
   - Desktop version keeps `w-48 flex-col` layout unchanged.
   - Alternatively, if compact mode is too complex: simply hide on mobile (`hidden md:block`) and show a minimal ability indicator row inline in the battle screen for mobile.

3. **Board grid — smaller cells for narrow viewports**
   - Change cell classes from `h-7 w-7 sm:h-8 sm:w-8` to `h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8`.
   - Change column labels from `w-7 sm:w-8` to `w-6 sm:w-7 md:w-8` and heights to match.
   - Change row labels from `h-7 sm:h-8 w-6` to `h-6 sm:h-7 md:h-8 w-5 sm:w-6`.
   - This makes mobile board width: 20px (row label) + 10×24px = 260px — fits comfortably on 320px screens.

4. **Ship placement — prevent overflow on 320px screens**
   - Change outer container from `w-fit` to `w-full max-w-fit`.
   - Reduce outer padding from `p-5` to `p-3 sm:p-5`.
   - Cell sizing will inherit from board-grid change (step 3 if shared) or apply same `h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8` pattern to placement grid cells.
   - Change surrender button from `absolute bottom-2` to `relative mt-3 sm:absolute sm:bottom-2 sm:left-1/2 sm:-translate-x-1/2` (inline on mobile, absolute on desktop).

5. **Character select — mobile-friendly layout**
   - Keep the desktop layout (`flex h-[100vh]`) for `md:` and above.
   - On mobile (`< md`), switch to a `grid grid-cols-2 grid-rows-3 h-[100dvh]` layout.
   - Remove clip-path on mobile (apply clip-path only with `md:` via inline style conditional or a Tailwind arbitrary class).
   - Each character panel on mobile gets `aspect-[3/4]` with the background image visible and character name overlay at bottom.
   - Use a `useMediaQuery` hook or just CSS: add classes like `grid grid-cols-2 gap-1 h-[100dvh] md:flex md:h-[100vh] md:gap-0.5`.

6. **Settings avatar selector — 2×3 grid on mobile**
   - Change container from `flex gap-1 h-48 sm:h-56` to `grid grid-cols-3 gap-1 h-80 sm:h-56 sm:grid-cols-6 sm:flex sm:gap-1`.
   - Or more simply: wrap in a container that is `grid grid-cols-3 gap-1 md:flex md:gap-1 h-48 sm:h-56`.
   - On mobile (grid-cols-3), each panel is ~33% width ≈ 110px — names are visible and characters recognizable.
   - Remove clip-path on mobile (only apply for `md:`+ via conditional class).

7. **Sound toggle — reposition to avoid overlap**
   - Change from `fixed top-3 left-3 z-50` to `fixed bottom-3 right-3 z-50`.
   - This avoids conflict with both the game-page back link (top-left) and any future top-bar elements.

8. **Home page podium — minor size reduction on xs**
   - Reduce AvatarIcon size on mobile for the podium: use a size prop that goes to `"md"` below sm and `"lg"` at sm+. If AvatarIcon doesn't support responsive sizes, wrap in a container with `scale-90 sm:scale-100`.
   - Reduce podium padding from `p-4 py-5` to `p-2 py-3 sm:p-4 sm:py-5` for the #1 position.

## Verification

```bash
# Build must pass with no errors
cd client && npx next build

# ESLint must pass (0 new errors allowed)
cd client && npx next lint

# Confirm HakiBar gets mobile treatment (hidden or responsive)
grep -n "hidden md:block\|md:w-48\|compact" client/src/app/game/[token]/haki-bar.tsx client/src/app/game/[token]/battle-screen.tsx

# Confirm boards stack vertically on mobile
grep -n "flex-col.*sm:flex-row\|flex-col.*md:flex-row" client/src/app/game/[token]/battle-screen.tsx

# Confirm board-grid has 3-tier cell sizing
grep -n "h-6 w-6 sm:h-7\|w-6 sm:w-7" client/src/app/game/[token]/board-grid.tsx

# Confirm character-select has mobile grid
grep -n "grid-cols-2\|grid-cols-3" client/src/components/character-select.tsx

# Confirm ship-placement container is not w-fit alone
grep -n "w-full\|max-w-fit\|p-3 sm:p-5" client/src/app/game/[token]/ship-placement.tsx

# Confirm sound toggle moved to bottom-right
grep -n "bottom-3 right-3" client/src/components/sound-toggle.tsx

# Confirm settings avatar selector has grid on mobile
grep -n "grid-cols-3\|grid.*gap" client/src/app/settings/page.tsx
```

Manual verification (Chrome DevTools):
- 375×667 (iPhone SE): Battle screen boards stack, HakiBar collapsed/horizontal, no horizontal scroll
- 320×568 (iPhone SE 1st gen): Ship placement grid fits, character select usable as 2×3 grid
- 390×844 (iPhone 14): All pages fit, sound toggle in bottom-right doesn't overlap

## Rollback

```bash
git checkout -- client/src/app/game/[token]/battle-screen.tsx \
  client/src/app/game/[token]/haki-bar.tsx \
  client/src/app/game/[token]/board-grid.tsx \
  client/src/app/game/[token]/ship-placement.tsx \
  client/src/components/character-select.tsx \
  client/src/app/settings/page.tsx \
  client/src/components/sound-toggle.tsx \
  client/src/app/page.tsx
```
