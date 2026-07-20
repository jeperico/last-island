# Design System — Last Island

## Philosophy

Last Island uses a **dark nautical / One Piece** aesthetic — a "deep ocean" visual language. Everything is dark-only with no light mode, no `prefers-color-scheme` media query, and no toggle. The palette evokes the Grand Line at night: deep navy backgrounds, ocean-blue primary accents, and amber/treasure-gold secondary highlights. All thematic references (rank names, button copy, section headers) draw from One Piece lore.

---

## Color Palette

All colors are defined as CSS custom properties in `globals.css` and exposed to Tailwind via `@theme inline`.

### Base

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0a1628` | Page background |
| `--foreground` | `#e8e6e3` | Default body text |

### Primary (Ocean / Grand Line Blue)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#2563eb` | Buttons, links, active indicators |
| `--color-primary-hover` | `#3b82f6` | Hover state for primary elements |
| `--color-primary-ring` | `rgba(37, 99, 235, 0.3)` | Focus rings |

### Secondary (Treasure / Straw Hat Amber)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-secondary` | `#f59e0b` | Bounty values, selected character glow |
| `--color-secondary-hover` | `#fbbf24` | Hover state for secondary |

### Surfaces (Deep Ocean Layers)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-surface` | `#0f1d32` | Card backgrounds, panels |
| `--color-surface-secondary` | `#132640` | Nested cards, hover states, icon backgrounds |
| `--color-surface-elevated` | `#1a3050` | Elevated panels (middle column of game-over) |

### Border

| Token | Value | Usage |
|-------|-------|-------|
| `--color-border` | `#1e3a5f` | Card borders, dividers |
| `--color-border-light` | `#162d4a` | Subtle dividers (leaderboard rows) |

### Text Levels

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text-primary` | `#e8e6e3` | Headings, names, important text |
| `--color-text-secondary` | `#94a3b8` | Labels, secondary info |
| `--color-text-muted` | `#64748b` | Metadata, timestamps, low-priority |

### Semantic (State)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#4ade80` | Victory, positive states |
| `--color-success-bg` | `rgba(20, 83, 45, 0.3)` | Success background tint |
| `--color-success-border` | `#166534` | Success border |
| `--color-danger` | `#f87171` | Defeat, errors, destructive |
| `--color-danger-bg` | `rgba(127, 29, 29, 0.3)` | Danger background tint |
| `--color-danger-border` | `#991b1b` | Danger border |
| `--color-warning` | `#fbbf24` | Warnings (Ace's fire) |
| `--color-warning-bg` | `rgba(120, 53, 15, 0.3)` | Warning background tint |

### Podium (Medal Colors)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-gold` | `#fbbf24` | 1st place |
| `--color-silver` | `#94a3b8` | 2nd place |
| `--color-bronze` | `#cd7f32` | 3rd place |
| `--color-gold-bg` | `rgba(251, 191, 36, 0.15)` | Gold highlight bg |
| `--color-silver-bg` | `rgba(148, 163, 184, 0.15)` | Silver highlight bg |
| `--color-bronze-bg` | `rgba(205, 127, 50, 0.15)` | Bronze highlight bg |

### Accent

| Token | Value | Usage |
|-------|-------|-------|
| `--color-ocean` | `#38bdf8` | Decorative accent (sky blue) |
| `--color-navy` | `#0a1628` | Same as background (alias) |

---

## Typography

- **Font stack**: Geist Sans via Next.js (`--font-geist-sans`), with `Arial, Helvetica, sans-serif` fallback on body
- **Monospace**: Geist Mono (`--font-geist-mono`) for code/tabular numbers
- **No decorative fonts** — system sans-serif only
- **Weight conventions**:
  - `font-bold` — headings, player names, page titles
  - `font-semibold` — section headings, rank badges, bounty values
  - `font-medium` — list item names, buttons
  - Default (400) — body text, descriptions
- **Size conventions**:
  - `text-2xl font-bold` — page title (h1)
  - `text-lg font-semibold` — section headings (h2)
  - `text-sm` — list item text, button labels
  - `text-xs` — metadata, timestamps, rank subtitles
  - `text-[10px]` — very small metadata (win rate in leaderboard)

---

## Spacing & Layout

| Pattern | Classes | Usage |
|---------|---------|-------|
| Page container | `max-w-7xl` | Content width cap |
| Page padding | `px-4 py-8` | Outer page wrapper |
| Grid gaps | `gap-8 lg:gap-20` | Two-column dashboard |
| Card padding | `p-5` or `p-6` | Standard card inner padding |
| Section spacing | `space-y-6` | Between cards in settings |
| Section margin | `mt-8` | Between sections (Battle Log below Leaderboard) |
| List item padding | `px-4 py-2.5` or `px-3 py-3` | Leaderboard rows, battle log entries |

### Border Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `0.25rem` | Small chips |
| `--radius-md` | `0.5rem` | Buttons (`rounded-md`) |
| `--radius-lg` | `0.75rem` | Back link, icon wrappers (`rounded-lg`) |
| `--radius-full` | `9999px` | Avatars, pills, toggle (`rounded-full`) |
| (Tailwind) | `rounded-xl` | Cards, panels |

---

## Layout Patterns

### Two-Column Dashboard Grid

```
grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-20
```

Left column: Leaderboard + Battle Log. Right column: Battle Station (game actions).

Mobile reordering: right column uses `order-first lg:order-0` so action buttons appear first on small screens.

### Full-Viewport Overlays

Character-select and game-over panels take up the full viewport:
- Character-select: `fixed top-0 left-0 w-[100vw] h-[100vh] z-50`
- Game-over: `fixed inset-0 z-50` with centered modal `w-[90vw] max-w-7xl h-[90vh] max-h-[900px]`

### Centered Single-Column (Settings)

```
flex flex-col flex-1 items-center px-4 py-8
  → w-full max-w-7xl space-y-6
```

---

## Component Patterns

### Cards

```
rounded-xl border border-border bg-surface
```

Optional overflow hidden: `overflow-hidden` when containing flush child elements (podium grid, sound header).

Padding: `p-5` or `p-6` depending on content density.

### Buttons (via `Button` component)

Variants: `primary` | `secondary` | `ghost` | `danger`

Sizes: `sm` (px-3 py-1.5 text-xs) | `md` (px-4 py-2 text-sm) | `lg` (px-6 py-3 text-sm)

All buttons: `rounded-md transition-colors cursor-pointer`, inline spinner on `loading` state.

### Inputs (Range Sliders)

```
w-full h-2 bg-surface-secondary rounded-full appearance-none cursor-pointer accent-primary
```

### Badges (via `Badge` component)

Variants: `success` | `danger` — used for battle log results (VICTORY/DEFEAT).

### Panels with Rank-Tier Glow

Game lobby cards use `tierStyles[tier]` to show border + glow per rank tier on the card itself.

---

## Rank Tier Visual System

Six visual tiers map from rank names to progressively more dramatic border/glow treatments:

| Tier | Ranks | Border | Glow | Animation |
|------|-------|--------|------|-----------|
| `default` | ROOKIE, SEAMAN | `border-2 border-border` | — | — |
| `rising` | SUPER_ROOKIE, CAPTAIN | `border-2 border-blue-500` | — | — |
| `elite` | SUPERNOVA, COMMODORE | `border-2 border-yellow-500` | `shadow-[0_0_10px_rgba(234,179,8,0.6)]` | — |
| `legendary` | SHICHIBUKAI, VICE_ADMIRAL | `border-[3px] border-purple-500` | `shadow-[0_0_14px_rgba(168,85,247,0.7)]` | — |
| `mythical` | YONKO, ADMIRAL | `border-[3px] border-red-500` | `animate-[shadow-rotate_3s_linear_infinite]` | Rotating red glow |
| `king` | PIRATE_KING, FLEET_ADMIRAL | `border-[3px] border-white` | `animate-[shadow-rotate-king_2s_linear_infinite]` | Rotating white glow |

### Usage

```ts
import { getRankTier, tierStyles } from "@/components/ui";

const tier = getRankTier(user.rank);    // → RankTier
const style = tierStyles[tier];         // → { border, glow, animate }
```

Apply to elements: `${style.border} ${style.glow}` (animate field is unused in current tierStyles — animation is embedded in glow via `animate-[...]`).

### Leaderboard Footer Rank Backgrounds

The pinned "your position" footer uses rank-tier-specific background tinting:

```ts
const rankBg: Record<string, string> = {
  default: "bg-surface-secondary/50",
  rising: "bg-blue-950/40 border-t-blue-500/30",
  elite: "bg-yellow-950/30 border-t-yellow-500/30",
  legendary: "bg-purple-950/30 border-t-purple-500/30",
  mythical: "bg-red-950/30 border-t-red-500/30",
  king: "bg-white/5 border-t-white/30",
};
```

### Game-Over Panel Rank Glow

The full-body player columns use ring-inset styles with increasing intensity:

```ts
"ring-4 ring-inset ring-blue-500/60"                                          // rising
"ring-4 ring-inset ring-yellow-500/60 shadow-[inset_0_0_50px_...]"           // elite
"ring-[5px] ring-inset ring-purple-500/70 shadow-[inset_0_0_60px_...]"       // legendary
"ring-[6px] ring-inset ring-red-500/80 shadow-[inset_0_0_80px_...]"          // mythical
"ring-[6px] ring-inset ring-white/90 shadow-[inset_0_0_100px_...]"           // king
```

---

## Avatar System

### Image Paths

| Type | Path Pattern | Usage |
|------|-------------|-------|
| Profile (square) | `/avatars/{key}/profile.jpg` | AvatarIcon, leaderboard, settings grid |
| Full-body | `/avatars/{key}/full-body.jpg` | Character-select panels, game-over columns |
| Background 01 | `/avatars/{key}/{key}-bg-01.jpg` | Settings hero card (rotated, 10% opacity) |
| Background 02 | `/avatars/{key}/{key}-bg-02.jpg` | Leaderboard podium cells |

Key is always lowercase: `avatar.toLowerCase()`.

### Fallback SVG

When image fails to load, AvatarIcon falls back to an inline data URI SVG (dark circle with ☠️ emoji).

### AvatarIcon Sizes

| Size | Image class | Wrapper class |
|------|-------------|---------------|
| `sm` | `w-8 h-8` | `w-8 h-8` |
| `md` | `w-12 h-12` | `w-14 h-14` |
| `lg` | `w-16 h-16` | `w-[4.5rem] h-[4.5rem]` |

Wrapper is slightly larger than image at md/lg to accommodate glow layer.

### AvatarIcon Props

```ts
interface AvatarIconProps {
  avatar: string | null;
  rank?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  highlight?: "gold" | "none";
}
```

`highlight="gold"` overrides rank styling with a gold border/glow (used for winner displays).

---

## Overlay & Modal Patterns

### Portal Rendering

All overlays use `createPortal(content, document.body)` to escape layout constraints.

### Backdrop

```
fixed inset-0 z-50 ... bg-black/70
```

Game-over uses `bg-black/70` backdrop with click-to-close. Character-select uses solid `bg-black`.

### Animation

Entry: `character-select-in 300ms ease-out forwards` (scale 0.9→1, opacity 0→1)
Exit: `character-select-out 250ms ease-in forwards` (scale 1→0.9, opacity 1→0)

Applied via inline `style={{ animation: ... }}`.

### Escape Key Handler

```ts
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") handleClose();
  }
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, []);
```

### Body Scroll Lock

```ts
useEffect(() => {
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => { document.body.style.overflow = prev; };
}, []);
```

### Close Button (×)

```
absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full
bg-surface-secondary/80 text-text-secondary hover:text-text-primary hover:bg-surface-secondary
transition-colors cursor-pointer
```

Uses `aria-label="Close"`.

---

## Character Select Pattern

- Full viewport black background (`bg-black`)
- Flex row of panels (`flex w-full h-[100vh] gap-0.5`)
- Each panel: `flex-1 relative overflow-hidden` with `clipPath` polygon for angled edges
- Background image: `absolute inset-0 bg-cover bg-top` with brightness/grayscale transitions:
  - Selected: `brightness-110 scale-105`
  - Unselected (with selection): `brightness-50 grayscale-[30%]`
  - Unselected (no selection): hover → `group-hover:scale-105`
- Selected panel border: `border-2 border-secondary shadow-[0_0_30px_rgba(245,158,11,0.6)]`
- Bottom gradient info overlay: `bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-16`
- Character name: `text-text-primary font-bold uppercase text-sm tracking-wide`
- Quote: `text-text-secondary text-xs italic`
- Uses `aria-pressed` and `aria-label` for accessibility
- Confirm button appears at `absolute bottom-24 left-1/2 -translate-x-1/2 z-20`

---

## Leaderboard Pattern

### Top-3 Podium

```
grid grid-cols-3 gap-px bg-border-light
```

Each cell has:
- Avatar background image (bg-02) via `absolute inset-0` with `bg-contain bg-center bg-no-repeat`, rotated -90deg, 200% scale
- Gradient overlay: `bg-gradient-to-t from-black/80 to-black/30`
- AvatarIcon (lg), name, bounty, stats — all `relative z-10` above the bg
- Current user highlight: `ring-2 ring-inset ring-primary/50`

### Scrollable List (positions 4+)

```
max-h-52 overflow-y-auto custom-scrollbar divide-y divide-border-light
```

Each row: avatar (sm) + name/rank + bounty/stats. Current user: `bg-primary/5 border-l-2 border-l-primary`.

Hover: `hover:bg-surface-secondary`.

### Pinned Footer (Current User)

Always visible below the scrollable list. Uses rank-tier background tinting (see Rank Tier section). Shows position number in `text-primary`.

---

## Loading States

### Spinner Component

Circular border spinner using `animate-spin rounded-full border-primary border-t-transparent`.

Sizes: `sm` (h-4 w-4 border-2) | `md` (h-6 w-6 border-2) | `lg` (h-8 w-8 border-[3px])

Uses `role="status" aria-label="Loading"`.

### Skeleton Component

Pulsing placeholder: `animate-pulse rounded-md bg-surface-secondary`.

Accepts `width`, `height`, and `className` props. Used for content whose shape is known ahead of time.

### Conditional Rendering Pattern

```tsx
const [loadingX, setLoadingX] = useState(false);

{loadingX && <Skeleton ... />}
{!loadingX && data && <ActualContent />}
```

Full-page loading state for auth-gated pages:

```tsx
if (isLoading || !user) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
```

---

## Animations

### Keyframes (defined in globals.css)

| Name | Effect | Duration |
|------|--------|----------|
| `character-select-in` | scale(0.9)→scale(1), opacity 0→1 | 300ms ease-out |
| `character-select-out` | scale(1)→scale(0.9), opacity 1→0 | 250ms ease-in |
| `shadow-rotate` | Rotating red box-shadow (4 positions) | 3s linear infinite |
| `shadow-rotate-king` | Rotating white box-shadow (4 positions) | 2s linear infinite |

### Transition Classes

- `transition-colors` — color/background changes (buttons, links)
- `transition-all duration-150` — battle log items (border + background)
- `transition-all duration-300` — character panels (scale + brightness + grayscale)
- `transition-transform` — toggle switch knob

### Hover Transforms

- `scale-105` — character panel hover/selected zoom
- `brightness-110` — selected character brightness boost
- `brightness-50 grayscale-[30%]` — unselected dimming
- `group-hover:scale-105` — unselected panel subtle zoom on hover

---

## Scrollbar Styling

Custom scrollbar class for long lists:

```css
.custom-scrollbar::-webkit-scrollbar { width: 12px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-primary); border-radius: 9999px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-primary-hover); }

.custom-scrollbar { scrollbar-width: thin; scrollbar-color: var(--color-primary) transparent; }
```

Used on: leaderboard list (`max-h-52 overflow-y-auto custom-scrollbar`), games list (`max-h-80 overflow-y-auto ... custom-scrollbar`).

---

## Accessibility

- `aria-label` on icon buttons (close ×, settings ⚙️, haki 👁)
- `aria-pressed` on selectable character panels
- `role="status" aria-label="Loading"` on Spinner
- `aria-hidden="true"` on Skeleton (decorative placeholder)
- `cursor-pointer` on all interactive elements
- `truncate` on names/text that may overflow
- Focus states: buttons use `focus:ring-2 focus:ring-primary-ring focus:outline-none`
- Disabled state: `opacity-50 pointer-events-none` (visual + interaction block)

---

## Dark Theme Enforcement

- `--background: #0a1628` always applied — no media query override
- No `prefers-color-scheme` rule in globals.css
- No light/dark toggle in UI
- Body: `background: var(--background); color: var(--foreground);`
- Print styles (`@media print`) override to white for readability — the only exception
