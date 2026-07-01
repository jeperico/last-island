---
name: last-island-design-system
description: One Piece Naval Battle design system for Last Island. Use when creating, refactoring, or reviewing any UI component, page, or style. Defines the parchment-based color palette, OP-themed typography, faction theming (Pirate vs Marine), component patterns, and accessibility rules. Load this skill before any client/ visual work.
---

# Last Island Design System — One Piece Naval Battle

## Design Philosophy

The UI evokes a **pirate captain's sea chart desk** — sun-bleached parchment, ink illustrations, brass instruments, and the salt-stained maps of the Grand Line. Light and warm, with dramatic faction contrasts.

Principles:
1. **Parchment first** — backgrounds are warm cream/tan, not dark. Depth via paper texture layering.
2. **Ink & quill** — text and line art feel hand-drawn. Borders are imperfect, slightly rough.
3. **Full One Piece** — wanted posters, Log Pose, Den Den Mushi, Jolly Rogers, bounty boards. Lean in.
4. **Faction duality** — Pirates are warm (red sails, gold, Jolly Roger) vs Marines are cold (navy, silver, Justice).
5. **Readable above all** — stylized fonts for flavor, clean sans-serif for data. Never sacrifice clarity for theme.

---

## Color Palette

### Parchment Base (Light Theme)

| Token | Hex | Usage |
|-------|-----|-------|
| `--parchment-light` | `#fdf6e3` | Page background |
| `--parchment` | `#f5ead0` | Card backgrounds, elevated surfaces |
| `--parchment-dark` | `#e8d5a3` | Borders, dividers, muted areas |
| `--parchment-shadow` | `#c4a96e` | Drop shadows, aged edges |
| `--ink` | `#2c1810` | Primary text, headings |
| `--ink-muted` | `#5c4033` | Secondary text, labels |
| `--ink-light` | `#8b7355` | Placeholders, disabled text |

### Sea & Water

| Token | Hex | Usage |
|-------|-----|-------|
| `--sea-deep` | `#1a4c6e` | Water cells on board, ocean accents |
| `--sea-mid` | `#2980b9` | Active water, hover states |
| `--sea-light` | `#85c1e9` | Splash effects, miss indicators |
| `--sea-foam` | `#d4efff` | Subtle highlights, wave crests |

### Gold & Treasure (Primary CTA)

| Token | Hex | Usage |
|-------|-----|-------|
| `--gold` | `#d4a531` | Primary buttons, bounty numbers, highlights |
| `--gold-bright` | `#f5c842` | Hover state, active glow |
| `--gold-dim` | `#9b7b1e` | Pressed state, aged gold |
| `--gold-bg` | `#fff8dc` | Gold-tinted panel backgrounds |

### Faction — Pirate (Warm)

| Token | Hex | Usage |
|-------|-----|-------|
| `--pirate-red` | `#c0392b` | Pirate sails, danger, Jolly Roger accent |
| `--pirate-crimson` | `#922b21` | Hover, pressed |
| `--pirate-wood` | `#6d4c2a` | Ship hulls, wood textures |
| `--pirate-flag-bg` | `#1a1a1a` | Jolly Roger background circle |
| `--pirate-straw` | `#f39c12` | Straw Hat reference accent |

### Faction — Marine (Cold)

| Token | Hex | Usage |
|-------|-----|-------|
| `--marine-navy` | `#1a3c5e` | Marine ship accents, badges |
| `--marine-blue` | `#2c5f8a` | Hover, links |
| `--marine-steel` | `#7f8c8d` | Ship hull fill |
| `--marine-white` | `#fdfefe` | Justice text, insignia |
| `--marine-gold` | `#b8860b` | Marine epaulettes, rank icons |

### Game State

| Token | Hex | Usage |
|-------|-----|-------|
| `--hit` | `#e74c3c` | Cannonball hit — explosion red |
| `--hit-glow` | `#ff6b5a` | Hit animation bloom |
| `--miss` | `#5dade2` | Splash — water blue |
| `--miss-fade` | `#aed6f1` | Miss after settle |
| `--sunk` | `#6c3483` | Sent to Davy Jones — purple |
| `--victory` | `#27ae60` | Victory green |
| `--defeat` | `#922b21` | Defeat crimson |

---

## Typography

### Font Stack

```css
--font-display: 'Pirata One', cursive;             /* Logo, page titles, wanted posters */
--font-heading: 'Cinzel Decorative', serif;        /* Section headings, faction names */
--font-body: 'Crimson Text', 'Georgia', serif;     /* Body text — readable serif */
--font-ui: 'Inter', system-ui, sans-serif;         /* Buttons, inputs, small UI labels */
--font-mono: 'JetBrains Mono', monospace;          /* Grid coords, tokens, code */
```

### Usage Rules

| Font | Where |
|------|-------|
| Pirata One | Game title "Last Island", wanted poster headers, Game Over screen title |
| Cinzel Decorative | Section headings ("Grand Line", "Deploy Your Fleet", "Battle Log") |
| Crimson Text | Paragraphs, descriptions, card body text |
| Inter | Button labels, form inputs, nav items, status badges, small metadata |
| JetBrains Mono | Board coordinates (A1–J10), game tokens, API responses |

### Scale

| Token | Size | Weight | Font |
|-------|------|--------|------|
| `display` | 3rem / 48px | 400 | Pirata One |
| `title` | 2rem / 32px | 700 | Cinzel Decorative |
| `heading` | 1.375rem / 22px | 600 | Cinzel Decorative |
| `subheading` | 1.125rem / 18px | 600 | Crimson Text |
| `body` | 1rem / 16px | 400 | Crimson Text |
| `ui` | 0.875rem / 14px | 500 | Inter |
| `small` | 0.8125rem / 13px | 400 | Inter |
| `tiny` | 0.6875rem / 11px | 600 | Inter |
| `mono` | 0.8125rem / 13px | 400 | JetBrains Mono |

---

## One Piece UI Elements

### Wanted Poster Cards

Used for: game lobby listings, player profiles, game over result.

```
┌─────────────────────────────┐  ← Rough parchment border, slightly rotated (1-2deg random)
│  ╔═══════════════════════╗  │
│  ║   [Player Avatar]     ║  │  ← Jolly Roger or Marine cap silhouette
│  ╚═══════════════════════╝  │
│                             │
│  WANTED                     │  ← "WANTED" in Pirata One, stamped red (or "MARINE" blue)
│  ─────────────────────      │
│  Monkey D. Luffy            │  ← Player name, Cinzel
│                             │
│  DEAD OR ALIVE              │  ← Only for Pirates, in small caps
│                             │
│  ฿ 3,000,000,000           │  ← Bounty (player score), gold, Pirata One
│                             │
│  ── WORLD GOVERNMENT ──     │  ← Footer flavor text
└─────────────────────────────┘
```

**Tailwind approach**: Use `bg-[--parchment]`, `border-2 border-[--parchment-dark]`, `shadow-lg`, `rotate-[0.5deg]` randomly. Inner image area with `border-4 border-[--ink]`.

### Log Pose Navigation

Used for: breadcrumbs, game phase indicator, step progress.

Visual: A compass rose with needle pointing to current phase. Phases arranged in a circular or linear path.

```
[ Register ] → [ Grand Line ] → [ Deploy Fleet ] → [ Battle ] → [ Result ]
     ○              ○                 ●               ○            ○
                                    ▲ needle
```

### Den Den Mushi Notifications

Used for: toast messages, turn alerts, system notifications.

Visual: Small snail (Den Den Mushi) icon + speech bubble. Color coded:
- Info: Sea blue snail
- Success: Green snail (victory)
- Warning: Gold snail
- Error: Red snail (hit/danger)
- Turn alert: Pulsing gold snail with "PURUPURUPURU" text

### Bounty Board (Scoreboard)

Used for: leaderboard, game stats, player rankings.

Visual: Wooden board texture (`--pirate-wood` bg), multiple wanted posters pinned at angles. Ranking = bounty amount.

### Sea Chart Grid (Battle Board)

The 10×10 grid styled as a sea chart:
- Background: faded parchment with subtle latitude/longitude lines
- Grid lines: thin ink strokes
- Column headers: compass directions (or just A–J in mono)
- Row headers: 1–10 in mono
- Compass rose decorative element in one corner (non-interactive)
- Water cells: subtle blue wash (`--sea-deep` at 20% opacity)

---

## Component Patterns

### Buttons

```css
/* Primary — Gold treasure button */
.btn-primary {
  background: var(--gold);
  color: var(--ink);
  border: 2px solid var(--gold-dim);
  border-radius: 6px;
  font-family: var(--font-ui);
  font-weight: 600;
  box-shadow: 0 3px 0 var(--gold-dim), 0 4px 8px rgba(0,0,0,0.15);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.btn-primary:hover { background: var(--gold-bright); transform: translateY(-1px); }
.btn-primary:active { transform: translateY(2px); box-shadow: none; }

/* Secondary — Ink outline */
.btn-secondary {
  background: transparent;
  color: var(--ink);
  border: 2px solid var(--ink-muted);
  border-radius: 6px;
}
.btn-secondary:hover { border-color: var(--gold); color: var(--gold-dim); }

/* Danger — Pirate red */
.btn-danger { background: var(--pirate-red); color: white; border: 2px solid var(--pirate-crimson); }
```

### Cards / Panels

```css
.card {
  background: var(--parchment);
  border: 2px solid var(--parchment-dark);
  border-radius: 8px;
  box-shadow: 2px 3px 8px rgba(0,0,0,0.1), inset 0 0 20px rgba(196,169,110,0.1);
  /* Inner glow simulates aged paper */
}
```

### Input Fields

```css
.input {
  background: var(--parchment-light);
  border: 2px solid var(--parchment-dark);
  border-radius: 4px;
  color: var(--ink);
  font-family: var(--font-body);
  padding: 0.625rem 0.875rem;
}
.input:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(212,165,49,0.2);
  outline: none;
}
.input::placeholder { color: var(--ink-light); font-style: italic; }
```

### Board Cells

```css
.cell { 
  background: var(--parchment-light); 
  border: 1px solid var(--parchment-dark);
  transition: background 150ms ease;
}
.cell-water { background: color-mix(in srgb, var(--sea-deep) 15%, var(--parchment-light)); }
.cell-ship { background: var(--pirate-wood); /* or --marine-steel */ }
.cell-hit { background: var(--hit); /* + explosion SVG overlay */ }
.cell-miss { background: var(--sea-light); /* + splash ripple SVG */ }
.cell-sunk { background: var(--sunk); opacity: 0.8; /* + skull crossbones icon */ }
.cell:hover:not(.cell-hit):not(.cell-miss) { 
  background: color-mix(in srgb, var(--sea-mid) 30%, var(--parchment-light));
  cursor: crosshair; 
}
```

---

## Animations & Transitions

| Element | Animation | Duration |
|---------|-----------|----------|
| Cell hover | bg-color shift + scale(1.05) | 150ms ease |
| Hit | Flash white → red + shake(2px) | 300ms |
| Miss | Ripple expand (scale 0→1, opacity 1→0) | 400ms |
| Sunk | Cells reveal sequentially (stagger 50ms) + purple pulse | 600ms total |
| Turn change | Gold border pulse on active player panel | 1s infinite |
| Wanted poster enter | Slide up + fade in + slight rotation settle | 300ms ease-out |
| Page transition | Fade in from 0.9 opacity | 200ms |
| Den Den Mushi toast | Bounce in from bottom-right | 400ms spring |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Spacing & Layout

- **Page max-width**: `1100px` centered, `padding-inline: 1.5rem`
- **Board cell size**: `42px` desktop, `34px` tablet, `28px` mobile
- **Card padding**: `1.5rem`
- **Section gap**: `2.5rem`
- **Element gap** (within cards): `0.75rem`
- **Border radius**: `4px` (inputs), `8px` (cards, buttons), `12px` (modals), `full` (avatars)

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Desktop | ≥1024px | Both boards side-by-side, full wanted-poster lobby |
| Tablet | 768–1023px | Boards stacked, lobby in 2-col grid |
| Mobile | <768px | Single board with tab switcher, lobby as list |

---

## Accessibility

- Focus ring: `2px solid var(--gold)` with `2px offset`, visible on all interactive elements via `:focus-visible`
- Board cells: `role="gridcell"` + `aria-label="C4: Water"` / `"C4: Hit"` / `"C4: Your ship Thousand Sunny"`
- Hit/miss conveyed by shape (explosion vs splash SVG) + text label, never color alone
- Minimum contrast: 4.5:1 (body text on parchment: `#2c1810` on `#fdf6e3` = 12.5:1 ✓)
- Screen reader announcements for: turn changes, shot results, game over
- All decorative elements (compass rose, wave borders) are `aria-hidden="true"`

---

## Tailwind CSS 4 Integration

All tokens go into `globals.css` using `@theme inline`:

```css
@import "tailwindcss";

@theme inline {
  --color-parchment-light: #fdf6e3;
  --color-parchment: #f5ead0;
  --color-parchment-dark: #e8d5a3;
  --color-ink: #2c1810;
  --color-ink-muted: #5c4033;
  --color-gold: #d4a531;
  --color-gold-bright: #f5c842;
  --color-sea-deep: #1a4c6e;
  --color-hit: #e74c3c;
  --color-miss: #5dade2;
  --color-sunk: #6c3483;
  /* ... etc */
  --font-display: 'Pirata One', cursive;
  --font-heading: 'Cinzel Decorative', serif;
  --font-body: 'Crimson Text', Georgia, serif;
  --font-ui: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

Usage in components: `className="bg-parchment text-ink font-display text-4xl"`

---

## File Organization

```
client/src/
├── app/
│   ├── globals.css          ← @theme tokens + base styles
│   ├── layout.tsx           ← Google Fonts imports (Pirata One, Cinzel, Crimson Text, Inter)
│   ├── page.tsx             ← Lobby / Grand Line
│   ├── (auth)/              ← Register + Login (pirate recruitment / marine enrollment)
│   └── game/[token]/        ← Battle room
│       ├── page.tsx         ← Game phase router
│       ├── board-grid.tsx   ← Sea chart grid component
│       ├── ship-placement.tsx
│       ├── battle-screen.tsx
│       └── game-over-panel.tsx
├── components/              ← Shared themed components (create as needed)
│   ├── wanted-poster.tsx
│   ├── den-den-mushi.tsx    ← Toast/notification component
│   ├── compass-rose.tsx     ← Decorative + phase indicator
│   └── bounty-badge.tsx     ← Score/rank display
└── lib/                     ← API, auth, game logic (no theming here)
```
