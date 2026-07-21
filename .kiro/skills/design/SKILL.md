---
name: Design System
description: Load when creating new UI pages/components, refactoring existing frontend, or reviewing frontend PRs. Guides layout, colors, typography, rank styling, overlays, and loading states.
---

# Design System Skill

Use this skill alongside the steering doc at `.kiro/steering/client/design-system.md` for the full token reference.

## When to Use

- Creating a new page or component
- Refactoring existing UI to match project conventions
- Reviewing frontend PRs for visual consistency

---

## Color Usage Rules

- **Always** use semantic CSS variable tokens: `bg-surface`, `text-text-primary`, `border-border`, `text-secondary`, etc.
- **Never** use raw hex values in components — all colors live in `globals.css` `:root` + `@theme inline`.
- Use semantic state colors: `text-success` / `bg-success-bg` for wins, `text-danger` / `bg-danger-bg` for losses, `text-warning` for warnings.
- Bounty values always use `text-secondary` (treasure gold).

---

## Layout Recipe (New Page)

```tsx
"use client";

export default function MyPage() {
  return (
    <div className="flex flex-col flex-1 items-center px-4 py-8">
      <div className="w-full max-w-7xl space-y-6">
        {/* Back link (if sub-page) */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary bg-surface-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border hover:border-primary transition-all">
          ← Grand Line
        </Link>

        {/* Section cards go here */}
      </div>
    </div>
  );
}
```

- Page padding: `px-4 py-8`
- Max width: `max-w-7xl`
- Section spacing: `space-y-6`
- Two-column dashboard: `grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-20`
- Mobile reorder: `order-first lg:order-0` on priority column

---

## Card Recipe

```tsx
<div className="rounded-xl border border-border bg-surface p-5">
  {/* Card content */}
</div>
```

- Standard padding: `p-5` or `p-6` for hero cards
- With scrollable content: add `overflow-hidden` and remove padding from wrapper
- With rank styling:

```tsx
import { getRankTier, tierStyles } from "@/components/ui";

const tier = getRankTier(user.rank);
const style = tierStyles[tier];

<div className={`rounded-xl ${style.border} ${style.glow} bg-surface p-5`}>
```

---

## Overlay / Modal Recipe

```tsx
import { createPortal } from "react-dom";

// 1. Portal to body
createPortal(content, document.body);

// 2. Fixed backdrop
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">

// 3. Entry/exit animation
style={{ animation: closing
  ? "character-select-out 250ms ease-in forwards"
  : "character-select-in 300ms ease-out forwards"
}}

// 4. Escape key handler
useEffect(() => {
  const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}, []);

// 5. Body scroll lock
useEffect(() => {
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => { document.body.style.overflow = prev; };
}, []);

// 6. Close button
<button
  onClick={handleClose}
  aria-label="Close"
  className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-surface-secondary/80 text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
>×</button>
```

---

## Loading State Recipe

- **Known shape** → `<Skeleton width="..." height="..." className="rounded-lg" />`
- **Unknown shape** → `<Spinner size="lg" />` centered: `<div className="flex flex-1 items-center justify-center"><Spinner size="lg" /></div>`
- **Conditional rendering**:

```tsx
const [loadingX, setLoadingX] = useState(false);

{loadingX && <Skeleton ... />}
{!loadingX && data && <ActualContent />}
```

---

## Rank Display Rules

- Always use `getRankTier(rank)` + `tierStyles[tier]` for visual rank styling
- Display rank text: `rank.replace(/_/g, " ")` (e.g. "PIRATE KING")
- Bounty: `formatBounty(bounty)` + ` ₿` suffix, styled with `text-secondary font-semibold`
- Win rate: `${Math.round(winRate * 100)}%`

---

## Avatar Display Rules

- Always use `<AvatarIcon avatar={avatar} rank={rank} size="sm|md|lg" />`
- Pass `rank` prop so the component applies tier border/glow automatically
- Use `highlight="gold"` for winner displays only
- Full-body backgrounds: CSS `backgroundImage` with gradient overlay `bg-gradient-to-t from-black/90 via-black/50 to-transparent`

---

## Text Hierarchy

| Level | Classes | Usage |
|-------|---------|-------|
| Page title | `text-2xl font-bold text-text-primary` | h1 equivalent |
| Section heading | `text-lg font-semibold text-text-primary` | h2 equivalent |
| Item name | `text-sm font-medium text-text-primary` | List items, card titles |
| Label | `text-xs text-text-secondary` | Input labels, secondary info |
| Metadata | `text-xs text-text-muted` | Timestamps, rank subtitles |
| Tiny stat | `text-[10px] text-text-muted` | Win rate in compact views |
| Bounty | `text-sm font-semibold text-secondary` | Always amber |
| Uppercase label | `text-xs uppercase tracking-wider font-semibold` | Score labels |

---

## Interactive Element Rules

- `cursor-pointer` on ALL clickable elements (buttons, cards, links, toggles)
- Transitions: `transition-colors` for simple hover, `transition-all duration-150` for multi-property, `duration-300` for image transforms
- List item hover: `hover:bg-surface-secondary`
- Bordered item hover: `hover:border-primary/50` or `hover:border-primary`
- Group hover: parent gets `group`, child gets `group-hover:text-primary`
- Disabled: `opacity-50 pointer-events-none`
- Focus: `focus:ring-2 focus:ring-primary-ring focus:outline-none`

---

## Don'ts

- ❌ Don't use light backgrounds — dark-only theme, no exceptions
- ❌ Don't use raw hex colors in components — add tokens to `globals.css` first
- ❌ Don't use `clsx`, `cn`, or `tailwind-merge` — use `[...].filter(Boolean).join(" ")` pattern
- ❌ Don't add decorative fonts — stick with Geist Sans (system sans-serif)
- ❌ Don't create new overlay patterns — reuse portal + scroll lock + escape + close button
- ❌ Don't duplicate rank logic — import `getRankTier` + `tierStyles` from `@/components/ui`
- ❌ Don't skip `aria-label` on icon-only buttons
- ❌ Don't use `prefers-color-scheme` or light mode variables

---

## Reference Files

| File | Purpose |
|------|---------|
| `client/src/styles/globals.css` | All CSS variables, keyframes, scrollbar styles |
| `client/src/components/ui/avatar-icon.tsx` | `getRankTier()`, `tierStyles`, `AvatarIcon` |
| `client/src/components/character-select.tsx` | Overlay + clip-path panel pattern |
| `client/src/app/game/[token]/game-over-panel.tsx` | Full-screen modal + rank ring styles |
| `client/src/app/settings/page.tsx` | Settings page shell + section cards |
| `client/src/app/page.tsx` | Dashboard layout + leaderboard + battle log |
