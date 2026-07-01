---
name: board-grid-component
description: Design guide for the BoardGrid component — the 10x10 sea chart battle grid. Use when refactoring board-grid.tsx or battle-screen.tsx to apply One Piece naval theming.
---

# Board Grid — Sea Chart Component

## Overview

The BoardGrid is the core game element. It transforms from a generic colored grid into a **sea chart** — parchment background, ink grid lines, compass rose decoration, ship silhouettes, and animated hit/miss effects.

## Visual Design

### Grid Container

```
┌──────────────────────────────────────────┐
│  🧭 [Compass Rose]        YOUR WATERS    │  ← Header with decorative compass + title
│                                          │
│     1   2   3   4   5   6   7   8   9  10│  ← Column labels (JetBrains Mono)
│  A  ~   ~   ~   ⛵  ⛵  ⛵  ~   ~   ~   ~ │  ← Ship silhouette spans cells
│  B  ~   ~   ~   ~   ~   ~   ~   ~   ~   ~ │
│  C  ~   💥  ~   ~   ~   ~   ~   ~   ~   ~ │  ← Hit: explosion burst
│  D  ~   ~   ~   ~   ~   ~   ~   ~   ~   ~ │
│  E  ~   ~   ~   ○   ~   ~   ~   ~   ~   ~ │  ← Miss: splash ripple
│  ...                                       │
└──────────────────────────────────────────┘
```

### Cell States — Themed

| State | Background | Icon/Overlay | Border |
|-------|-----------|--------------|--------|
| Water (empty) | `bg-parchment-light` with 15% `sea-deep` wash | Subtle wave pattern (CSS) | `1px solid parchment-dark` |
| Ship (own board) | `bg-pirate-wood` (pirate) / `bg-marine-steel` (marine) | Ship silhouette SVG | `2px solid ink-muted` |
| Hit | `bg-hit` with radial gradient glow | Explosion burst SVG (`✕` fallback) | `2px solid hit-glow` |
| Miss | `bg-sea-light` | Splash ripple SVG (`○` fallback) | `1px solid sea-mid` |
| Sunk | `bg-sunk` at 85% opacity | Skull & crossbones icon + `✕` | `2px solid sunk` |
| Hover (interactive) | `bg-sea-mid` at 30% mix | Crosshair cursor | `1px dashed gold` |

### Ship Silhouettes

Instead of plain colored blocks, ships display as elongated silhouettes:

| Ship | Pirate | Marine |
|------|--------|--------|
| Size 5 | Galleon with Jolly Roger mast | Buster Call battleship |
| Size 4 | Whale-shaped hull (Moby Dick ref) | Large warship |
| Size 3 | Sloop with red sails | Cruiser/battleship |
| Size 2 | Small skiff (Striker ref) | Patrol cutter |

Implementation: SVG sprites positioned via `background-image` spanning the ship's cells. First cell = bow, last = stern.

### Compass Rose

A decorative SVG compass rose placed in the top-left corner of the grid container:
- Size: ~48px
- Color: `--ink-muted` stroke, `--gold-dim` for cardinal points
- `aria-hidden="true"` (purely decorative)
- On the **opponent board**, the compass needle pulses during your turn

### Wave Pattern (Water Cells)

Subtle CSS-only wave pattern for empty water cells:

```css
.cell-water {
  background: 
    linear-gradient(135deg, transparent 25%, rgba(26,76,110,0.05) 50%, transparent 75%),
    var(--color-parchment-light);
  background-size: 8px 8px;
}
```

## Refactored Component Structure

```tsx
// board-grid.tsx
export function BoardGrid({
  title,
  cells,
  onCellClick,
  disabled,
  interactive,
  faction,        // NEW: "PIRATE" | "MARINE" — determines ship colors
  showCompass,    // NEW: boolean — decorative compass rose
}: BoardGridProps) {
  return (
    <div className="relative flex flex-col items-center gap-3">
      {/* Compass rose decoration */}
      {showCompass && <CompassRose className="absolute -top-2 -left-2 w-12 h-12" />}
      
      {/* Title in Cinzel */}
      <h2 className="font-heading text-heading text-ink">{title}</h2>
      
      {/* Grid with parchment base */}
      <div className="bg-parchment rounded-lg border-2 border-parchment-dark p-2 shadow-md">
        {/* ... grid cells */}
      </div>
    </div>
  );
}
```

## Animations

### Hit Animation
```css
@keyframes hit-burst {
  0% { transform: scale(0.5); opacity: 0; background: white; }
  30% { transform: scale(1.2); opacity: 1; background: var(--color-hit-glow); }
  100% { transform: scale(1); opacity: 1; background: var(--color-hit); }
}
```

### Miss Animation
```css
@keyframes splash-ripple {
  0% { box-shadow: 0 0 0 0 rgba(93,173,226,0.6); }
  100% { box-shadow: 0 0 0 8px rgba(93,173,226,0); }
}
```

### Sunk Sequence
Cells of a sunk ship illuminate sequentially (50ms stagger) from bow to stern, then pulse purple.

## Accessibility

- Each cell: `role="gridcell"` with `aria-label="B4: Water"` / `"B4: Hit — Cannonball struck!"` / `"B4: Your ship Thousand Sunny"`
- Interactive cells: `tabIndex={0}`, keyboard Enter/Space to fire
- Hit/miss differentiated by shape (explosion vs circle) + label, not just color
- Turn indicator announced via `aria-live="polite"` region
- Compass rose: `aria-hidden="true"`

## Tailwind Classes Example

```tsx
// Water cell
"w-[42px] h-[42px] bg-parchment-light border border-parchment-dark 
 hover:bg-sea-mid/30 hover:border-dashed hover:border-gold cursor-crosshair
 transition-colors duration-150 flex items-center justify-center"

// Hit cell
"w-[42px] h-[42px] bg-hit border-2 border-hit-glow text-white 
 font-bold text-sm animate-hit-burst"

// Ship cell (pirate)
"w-[42px] h-[42px] bg-pirate-wood border-2 border-ink-muted"
```
