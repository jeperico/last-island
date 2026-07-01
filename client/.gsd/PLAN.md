# Design System & UI Refactoring Plan

## Objective

Create a component-based design system for the Last Island client and refactor all existing screens to use it. The goal is to eliminate duplicated inline styles, establish consistent design tokens, build reusable UI primitives, and improve accessibility—all without adding external component libraries.

## Constraints

- Zero new dependencies (no shadcn, radix, headless-ui). Pure Tailwind CSS 4 + custom components.
- Keep Next.js App Router conventions (server vs client components where appropriate).
- Dark mode support via `prefers-color-scheme` and CSS variables (already started).
- Desktop-first but responsive (min viable mobile at 640px).
- Accessibility: all interactive elements keyboard-navigable, ARIA labels, focus rings.
- One Piece theming is v2; this plan establishes the token layer that theming will override later.

---

## Part 1: Design Tokens (`globals.css`)

Extend the existing 2-variable CSS to a full token system using Tailwind CSS 4's `@theme` directive.

### Color Tokens

```
--color-primary: blue-600 / blue-500 (dark)
--color-primary-hover: blue-700 / blue-600 (dark)
--color-primary-ring: blue-500/20

--color-surface: white / gray-900
--color-surface-secondary: gray-50 / gray-800
--color-surface-elevated: white / gray-800 (cards, modals)

--color-border: gray-300 / gray-600
--color-border-light: gray-200 / gray-700

--color-text-primary: gray-900 / gray-100
--color-text-secondary: gray-600 / gray-400
--color-text-muted: gray-500 / gray-500

--color-success: green-600 / green-400
--color-success-bg: green-50 / green-900/20
--color-success-border: green-300 / green-700

--color-danger: red-700 / red-400
--color-danger-bg: red-50 / red-900/20
--color-danger-border: red-300 / red-700

--color-warning: amber-800 / amber-400
--color-warning-bg: amber-100 / amber-900/30

--color-info: blue-700 / blue-400
```

### Spacing / Layout Tokens

```
--space-page-x: 1rem (sm: 1.5rem, lg: 2rem)
--space-page-y: 2rem
--space-section-gap: 2rem
--radius-sm: 0.25rem
--radius-md: 0.5rem
--radius-lg: 0.75rem
--radius-full: 9999px
```

### Typography Scale

Use Tailwind defaults but standardize usage:
- Page title: `text-2xl font-bold`
- Section title: `text-lg font-semibold`
- Subsection: `text-sm font-semibold`
- Body: `text-sm`
- Caption: `text-xs`

---

## Part 2: Component Library (`src/components/ui/`)

### File Structure

```
src/components/ui/
├── button.tsx          # Primary, secondary, ghost, danger, icon variants
├── input.tsx           # Text input with label, error state, helper text
├── select.tsx          # Styled select (filiation picker, etc.)
├── card.tsx            # Surface container with border/shadow
├── alert.tsx           # Error/success/warning/info banners (dismissible)
├── badge.tsx           # Status pills (turn indicator, game phase)
├── spinner.tsx         # Loading spinner (small/medium)
├── skeleton.tsx        # Content placeholder during loading
├── page-header.tsx     # Title + actions row
├── empty-state.tsx     # "No data" illustrations
├── game-grid.tsx       # Extracted from board-grid.tsx (cell rendering)
└── index.ts            # Barrel export
```

### Component Specifications

#### `Button` (`button.tsx`)
```
Props: variant (primary|secondary|ghost|danger), size (sm|md|lg), disabled, loading, fullWidth, children, onClick, type
Variants:
  primary → bg-primary text-white hover:bg-primary-hover focus:ring
  secondary → border-border text-secondary hover:bg-surface-secondary
  ghost → text-secondary hover:bg-surface-secondary (no border)
  danger → bg-red-600 text-white hover:bg-red-700
Loading state: show spinner, disable pointer events
Sizes: sm (px-3 py-1.5 text-xs), md (px-4 py-2 text-sm), lg (px-6 py-3 text-sm)
```

#### `Input` (`input.tsx`)
```
Props: label, id, type, error, helperText, required, className, ...inputProps
Structure: <label> + <input> + error/helper text
Shared styles: rounded-md border-border px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary-ring
Error state: border-danger, red helper text below
```

#### `Card` (`card.tsx`)
```
Props: children, className, padding (none|sm|md|lg)
Base: rounded-lg border-border bg-surface-elevated [shadow-sm optional]
Used for: game list items, stats panel, auth form wrapper
```

#### `Alert` (`alert.tsx`)
```
Props: variant (error|success|warning|info), children, dismissible, onDismiss
Structure: rounded border px-4 py-2 text-sm + dismiss button
Maps to: error banners (login, register, lobby, battle, placement)
```

#### `Badge` (`badge.tsx`)
```
Props: variant (success|warning|neutral|danger), children
Used for: turn indicator, game phase labels, player status
"Your Turn" → success badge, "Opponent's Turn" → warning badge (animated pulse)
```

#### `Spinner` (`spinner.tsx`)
```
Props: size (sm|md|lg)
Animated SVG circle or border-spin div
Used in: button loading state, page loading
```

#### `Skeleton` (`skeleton.tsx`)
```
Props: width, height, className
Animated placeholder rectangle with pulse
Used for: game list loading, board loading
```

#### `PageHeader` (`page-header.tsx`)
```
Props: title, subtitle?, actions? (ReactNode)
Layout: flex justify-between items-center mb-6/8
Used in: lobby (Welcome, username + logout), game screens (title + back button)
```

#### `EmptyState` (`empty-state.tsx`)
```
Props: title, description, action? (button)
Centered layout with muted text
Used for: "No games available", "Waiting for opponent"
```

---

## Part 3: Refactoring Plan by Screen

### Step 1: Foundation (globals.css + tokens + barrel exports)

**Files:**
- modify: `src/app/globals.css` — add full token set under `:root` and `@media (prefers-color-scheme: dark)`
- create: `src/components/ui/index.ts` — barrel export
- create: `src/components/ui/button.tsx`
- create: `src/components/ui/input.tsx`
- create: `src/components/ui/alert.tsx`
- create: `src/components/ui/card.tsx`
- create: `src/components/ui/badge.tsx`
- create: `src/components/ui/spinner.tsx`
- create: `src/components/ui/skeleton.tsx`
- create: `src/components/ui/page-header.tsx`
- create: `src/components/ui/empty-state.tsx`

### Step 2: Auth Pages (login + register)

**Current problems:**
- Inline error banner (6 lines repeated)
- Inline input styling (repeated 5 times across both pages)
- Submit button styling duplicated
- Auth layout card is inline styled

**Refactoring:**
- modify: `src/app/(auth)/layout.tsx` — use `<Card>` wrapper
- modify: `src/app/(auth)/login/page.tsx`:
  - Replace error div → `<Alert variant="error">`
  - Replace inputs → `<Input label="..." />`
  - Replace submit button → `<Button variant="primary" fullWidth loading={loading}>`
  - Replace footer link → keep but standardize text style
- modify: `src/app/(auth)/register/page.tsx`:
  - Same pattern as login
  - Filiation radio group → could be custom or keep native (keep for now, style consistently)

### Step 3: Lobby Page (`page.tsx`)

**Current problems:**
- Page header (welcome + logout) is ad-hoc flex
- Error banner duplicated
- "Create Game" button is inline styled
- "Join by Token" input+button is inline
- Game list items are inline cards
- Pagination buttons are inline

**Refactoring:**
- modify: `src/app/page.tsx`:
  - Replace header → `<PageHeader title={...} actions={<Button variant="secondary" size="sm" onClick={logout}>Logout</Button>} />`
  - Replace error → `<Alert variant="error" dismissible>`
  - Replace "Create Game" → `<Button variant="primary" fullWidth loading={creatingGame}>`
  - Replace join input + button → `<Input>` + `<Button>`
  - Replace game list items → `<Card>` with consistent padding
  - Replace pagination buttons → `<Button variant="secondary" size="sm">`
  - Add `<EmptyState>` for no-games scenario
  - Add `<Skeleton>` for loading state (instead of plain text)

### Step 4: Game Page — Waiting Phase

**Current problems:**
- "Waiting for opponent" is a plain h1+p, no visual emphasis
- No way to copy token easily

**Refactoring:**
- modify: `src/app/game/[token]/page.tsx`:
  - Replace waiting UI → `<EmptyState title="..." description="...">` + token display in `<Badge>` or mono span
  - Add copy-to-clipboard button for token

### Step 5: Ship Placement Screen

**Current problems:**
- Error banner duplicated
- Ship selection buttons are complex inline conditional classes
- Deploy/Reset buttons are inline styled
- Grid cells are inline styled with manual color logic

**Refactoring:**
- modify: `src/app/game/[token]/ship-placement.tsx`:
  - Replace error → `<Alert variant="error">`
  - Replace Deploy button → `<Button variant="primary" loading={submitting}>`
  - Replace Reset button → `<Button variant="secondary">`
  - Ship list items: create small composable or extract conditional class logic into a helper
  - Grid cell styling: extract to shared `getCellClassName()` utility or keep inline (grid is specialized enough)

### Step 6: Battle Screen

**Current problems:**
- Turn indicator is ad-hoc inline badge styling
- Error banner duplicated + dismiss button inline
- "Firing..." text is plain unstyled p
- Board grid has duplicated styling logic

**Refactoring:**
- modify: `src/app/game/[token]/battle-screen.tsx`:
  - Replace turn indicator → `<Badge variant="success">` / `<Badge variant="warning" pulse>`
  - Replace error banner → `<Alert variant="error" dismissible>`
  - Replace "Firing..." → `<Spinner size="sm" />` + text
- modify: `src/app/game/[token]/board-grid.tsx`:
  - Keep as specialized component (it's already extracted)
  - Use design tokens for cell colors instead of hardcoded Tailwind colors
  - Move color logic to use CSS custom properties for future theming

### Step 7: Game Over Panel

**Current problems:**
- Stats grid is inline table-like layout
- "Back to Lobby" link is styled as a button but uses `<Link>`
- Victory/Defeat headings have hardcoded colors

**Refactoring:**
- modify: `src/app/game/[token]/game-over-panel.tsx`:
  - Stats table: keep inline (it's specialized), but use token colors
  - Replace "Back to Lobby" → `<Button variant="primary" asChild>` pattern or just style the Link consistently
  - Victory/Defeat: use `--color-success` / `--color-danger` tokens

### Step 8: Layout & Global Polish

**Refactoring:**
- modify: `src/app/layout.tsx`:
  - Update metadata (title: "Last Island", description)
  - Consider adding a minimal nav bar (logo + user name) — optional for this iteration
- Remove unused public assets (next.svg, vercel.svg, globe.svg, etc.)

---

## Part 4: Implementation Order (Atomic Tasks)

Each of these is one GSD implement+review cycle:

1. **DS-01: Design Tokens + globals.css** — Extend CSS variables, add `@theme` tokens
2. **DS-02: Core primitives (Button, Input, Alert, Card)** — Create 4 base components
3. **DS-03: Secondary primitives (Badge, Spinner, Skeleton, PageHeader, EmptyState)** — Create 5 more
4. **DS-04: Auth pages refactor** — Convert login + register to use new components
5. **DS-05: Lobby page refactor** — Convert lobby to use components + loading skeletons
6. **DS-06: Game page — Waiting + Placement refactor** — Use Alert, Button, EmptyState
7. **DS-07: Battle + GameOver refactor** — Use Badge, Alert, tokens for board colors
8. **DS-08: Layout polish + cleanup** — Metadata, remove unused assets, consistent spacing

---

## Verification

After each step:

```bash
# TypeScript compiles
cd client && npx tsc --noEmit

# Build passes
npm run build

# Lint passes
npm run lint

# Visual check: all screens render without console errors
npm run dev
# Manual: visit /login, /register, /, /game/[token] (mock)
```

After all steps complete:
- No inline `bg-blue-600` / `border-red-300` etc. outside of components/ui/
- All repeated patterns (error banners, inputs, buttons) use shared components
- Dark mode works consistently across all screens
- All interactive elements have focus-visible outlines
- `src/components/ui/` exports at least 9 components

---

## Rollback

Each step touches different files. Rollback per-step:

```bash
git checkout -- src/components/ui/   # removes new components
git checkout -- src/app/             # reverts page changes
git checkout -- src/app/globals.css  # reverts token changes
```

Or full rollback:
```bash
git checkout -- .
```

---

## Files to Touch (Complete List)

### Create:
- `src/components/ui/index.ts`
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/alert.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/spinner.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/page-header.tsx`
- `src/components/ui/empty-state.tsx`

### Modify:
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/game/[token]/page.tsx`
- `src/app/game/[token]/ship-placement.tsx`
- `src/app/game/[token]/battle-screen.tsx`
- `src/app/game/[token]/board-grid.tsx`
- `src/app/game/[token]/game-over-panel.tsx`

### Delete:
- `public/next.svg`
- `public/vercel.svg`
- `public/globe.svg`
- `public/window.svg`
- `public/file.svg`
