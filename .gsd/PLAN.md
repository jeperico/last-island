# Create Design System Steering Doc + Kiro Skill

## Objective

Codify the actual dark-nautical design system (extracted from game-over modal, character-select, settings, and leaderboard pages) into a canonical steering doc and an actionable Kiro skill for building/refactoring UI.

## Files to touch

- **create** `.kiro/steering/client/design-system.md` — comprehensive design system reference
- **create** `.kiro/skills/design/SKILL.md` — actionable skill for AI-assisted UI work

## Steps

1. **Create `.kiro/steering/client/design-system.md`** with these sections:
   - **Philosophy** — dark nautical/One Piece theme, "deep ocean" aesthetic, dark-only
   - **Color Palette** — exact CSS custom properties from `globals.css` organized by role: base (background, foreground), primary (blue/ocean), secondary (amber/treasure), surfaces (deep ocean layers), border, text levels, semantic (success/danger/warning), podium (gold/silver/bronze), accent (ocean/navy)
   - **Typography** — font stack (Geist Sans via Next.js, system fallback), no decorative fonts actually used, weight/size conventions observed across pages
   - **Spacing & Layout** — `max-w-7xl` page container, `px-4 py-8` page padding, `gap-8 lg:gap-20` grid gaps, card padding (`p-5`/`p-6`), section spacing (`space-y-6`, `mt-8`), border-radius tokens (radius-sm/md/lg/full)
   - **Layout Patterns** — two-column dashboard grid (`grid-cols-1 lg:grid-cols-[3fr_2fr]`), full-viewport overlays (character-select, game-over), centered single-column settings, `order-first lg:order-0` for mobile priority reordering
   - **Component Patterns** — cards (rounded-xl, border-border, bg-surface), buttons (variants via `Button` component), inputs (range sliders with accent-primary), badges (success/danger), panels with rank-tier glow
   - **Rank Tier Visual System** — the 6-tier system (default → rising → elite → legendary → mythical → king) with exact border, glow, and animation classes per tier; `getRankTier()` mapping; `tierStyles` record
   - **Avatar System** — profile images at `/avatars/{key}/profile.jpg`, full-body at `/avatars/{key}/full-body.jpg`, background images at `/avatars/{key}/{key}-bg-01.jpg` and `bg-02.jpg`; fallback SVG; AvatarIcon sizes (sm/md/lg)
   - **Overlay & Modal Patterns** — `createPortal` to body, `fixed inset-0 z-50`, backdrop `bg-black/70`, scale animation (character-select-in/out keyframes), Escape key + body scroll lock, close button (×) positioning
   - **Character Select Pattern** — clip-path panels, brightness/grayscale states (selected vs unselected vs has-selection), bottom gradient overlay with info, full-viewport black background
   - **Leaderboard Pattern** — top-3 podium grid with avatar backgrounds, list below with scrollbar, pinned footer for current user, rank-tier background tinting per user
   - **Loading States** — `Spinner` component (sizes sm/md/lg), `Skeleton` component for content placeholders, conditional rendering pattern, `loadingX` state booleans
   - **Animations** — keyframes defined in globals.css (character-select-in/out, shadow-rotate, shadow-rotate-king), transition classes (duration-150, duration-300), hover transforms (scale-105, brightness changes)
   - **Scrollbar Styling** — `.custom-scrollbar` class with primary-colored thumb
   - **Accessibility** — aria-label on buttons, aria-pressed on selectable items, cursor-pointer on interactive elements, focus states via hover classes, truncate for overflow text
   - **Dark Theme Enforcement** — no light mode, `--background: #0a1628` always, no `prefers-color-scheme` media query

2. **Create `.kiro/skills/design/SKILL.md`** with YAML frontmatter and actionable instructions:
   - Frontmatter: name, description (when to load this skill)
   - **When to use** — creating new pages/components, refactoring existing UI, reviewing frontend PRs
   - **Color usage rules** — always use semantic tokens (bg-surface, text-text-primary, border-border), never raw hex in components, use semantic colors for state (success/danger/warning)
   - **Layout recipe** — step-by-step for new pages: flex-col flex-1 items-center, px-4 py-8, max-w-7xl inner container, section headings with emoji + text-lg font-semibold
   - **Card recipe** — rounded-xl border border-border bg-surface, optional rank-tier styling via `tierStyles[tier]`
   - **Overlay recipe** — createPortal, fixed inset-0 z-50, bg-black/70 backdrop, animation keyframes, Escape handler + scroll lock, close button pattern
   - **Loading state recipe** — Skeleton for known-shape content, Spinner for unknown, conditional rendering with `loadingX` boolean
   - **Rank display rules** — always use `getRankTier()` + `tierStyles`, show rank text with `.replace(/_/g, " ")`, bounty formatted with `formatBounty()` + ₿ suffix
   - **Avatar display rules** — always use `AvatarIcon` component, specify size, pass rank for tier border
   - **Text hierarchy** — text-text-primary for headings/names, text-text-secondary for labels, text-text-muted for metadata, text-secondary (amber) for bounty values
   - **Interactive element rules** — cursor-pointer on all clickable, transition-colors/transition-all, hover:bg-surface-secondary for list items, hover:border-primary for bordered items
   - **Don'ts** — don't use light backgrounds, don't introduce new color tokens without adding to globals.css, don't use clsx/cn (use array.filter(Boolean).join(" ")), don't add decorative fonts (stick with system sans-serif)
   - **Reference files** — point to globals.css, avatar-icon.tsx, character-select.tsx, game-over-panel.tsx, settings/page.tsx, page.tsx (dashboard)

## Verification

1. `test -f .kiro/steering/client/design-system.md && echo "steering doc exists"` — file exists
2. `test -f .kiro/skills/design/SKILL.md && echo "skill exists"` — file exists
3. `grep -c "color-primary" .kiro/steering/client/design-system.md` — should be ≥ 1 (color tokens documented)
4. `grep -c "tierStyles" .kiro/steering/client/design-system.md` — should be ≥ 1 (rank system documented)
5. `grep -c "createPortal" .kiro/steering/client/design-system.md` — should be ≥ 1 (overlay pattern documented)
6. `head -5 .kiro/skills/design/SKILL.md | grep -c "\-\-\-"` — should be ≥ 1 (YAML frontmatter present)
7. `grep -c "getRankTier" .kiro/skills/design/SKILL.md` — should be ≥ 1 (rank usage documented)
8. `cd client && npm run build` — build still passes (no code changes, just docs)

## Rollback

```bash
rm -f .kiro/steering/client/design-system.md
rm -rf .kiro/skills/design/
```
