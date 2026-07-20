# Refactor Haki Skill Tree Page — Visual Richness Upgrade

## Objective

Transform the Haki Skill Tree page from plain cards into a visually rich, themed page with hero section, per-branch color identities, segmented progress bars with glow, level descriptions, and awakened/locked state treatments — matching settings page quality.

## Files to touch

- `client/src/app/haki/page.tsx` — modify (complete rewrite of presentation layer; business logic unchanged)

## Steps

1. **Add new imports** — Add `AvatarIcon`, `getRankTier`, `tierStyles` from `@/components/ui`, `formatBounty` from `@/lib/format`, and destructure `user` from `useRequireAuth()` (in addition to `isLoading`).

2. **Expand BRANCHES config with per-level descriptions and color classes** — Replace single `description` field with `descriptions: string[]` (array of 3 entries, one per level explaining what it unlocks). Add `color` object to each branch with fields: `accent` (Tailwind text class), `bg` (gradient from class), `border` (border color class), `glow` (shadow class for awakened), `pip` (filled pip background class).
   - Observation: blue-400/blue-500 palette — `text-blue-400`, `from-blue-500/20`, `border-blue-500/50`, `shadow-[0_0_12px_rgba(59,130,246,0.4)]`, `bg-blue-400`
   - Armament: red-400/red-500 palette — `text-red-400`, `from-red-500/20`, `border-red-500/50`, `shadow-[0_0_12px_rgba(248,113,113,0.4)]`, `bg-red-400`
   - Conqueror's: purple-400/purple-500 + yellow/amber — `text-purple-400`, `from-purple-500/20`, `border-purple-500/50`, `shadow-[0_0_12px_rgba(168,85,247,0.4)]`, `bg-purple-400`

3. **Update loading guard** — Change early return condition to `if (isLoading || !user || loadingProfile)` to cover `user` null case (settings pattern).

4. **Add hero section** — After back-link, before error display, add a hero card matching settings pattern:
   - Outer div: `relative overflow-hidden rounded-xl ${rankStyle.border} ${rankStyle.glow} bg-surface p-6`
   - Background wallpaper layer (10% opacity avatar bg image, rotated, with `user.avatar &&` guard)
   - Content: `AvatarIcon` (size="lg") + user name + rank badge + Haki points summary (available / total / milestones)
   - Compute `tier` and `rankStyle` from `getRankTier(user.rank)` / `tierStyles[tier]`

5. **Remove old text-center header** — Delete the `<div className="text-center">` block that showed "Haki Skill Tree" title + points; this info moves to hero card.

6. **Redesign LevelPips → ProgressBar component** — Replace the 3-dot pips with a segmented progress bar:
   - Container: `flex items-center gap-1` with full width
   - 3 segments, each: `h-2.5 flex-1 rounded-full transition-all` 
   - Filled segments: branch color `pip` class + `shadow-[0_0_6px_...]` glow matching branch color
   - Empty segments: `bg-surface-secondary`
   - Accept `level`, `color` (branch color config) props

7. **Redesign branch cards** — Replace `<Card>` with raw divs for full color control:
   - Outer: `relative flex flex-col rounded-xl border bg-surface-elevated overflow-hidden`
   - Top accent strip: `h-1 w-full bg-gradient-to-r ${branch.color.bg} to-transparent` (colored gradient bar at top of card)
   - When awakened (level=3): apply branch `glow` shadow + `border-secondary/50` border + amber/gold border treatment
   - Normal state: `border-border` default border

8. **Per-level descriptions** — Below the progress bar, show a compact list of what each level unlocks:
   - 3 small rows, each with level indicator (Lv1/Lv2/Lv3) + description text
   - Filled levels: branch accent text color
   - Unfilled levels: `text-text-muted` with slightly dimmed opacity

9. **Awakened state treatment** — When `isMaxed`:
   - Card border changes to `border-secondary/50`
   - Card gets `shadow-[0_0_16px_rgba(245,158,11,0.2)]` (amber glow)
   - "✦ Awakened ✦" text gets `text-secondary` + subtle animation or increased font weight
   - All 3 progress segments are filled with branch glow

10. **Locked Conqueror's overlay** — Improve the overlay:
    - Use `backdrop-blur-md` (stronger blur) instead of `backdrop-blur-sm`
    - Background: `bg-surface/70` (slightly more transparent for depth)
    - Add a thin `border border-purple-500/20` ring around overlay content
    - Center content: lock icon (larger, 🔒 text-4xl), requirement text with better hierarchy (bold prereq names)
    - Add subtle `rounded-xl` to match card radius

11. **Upgrade button styling** — Keep Button component but adjust context:
    - When branch is Observation: no change (primary variant matches blue)
    - When branch is Armament or Conqueror's: still use `variant="primary"` (consistent CTA, don't over-theme the interactive element)
    - Disabled state styling already handled by Button component

12. **Page layout adjustment** — Change `max-w-5xl` to `max-w-7xl` (match settings page width) for hero card to breathe; keep `lg:grid-cols-3` grid for branch cards.

## Verification

```bash
# 1. Build succeeds (TypeScript + Tailwind compilation)
cd client && npx next build

# 2. user destructured from useRequireAuth
grep -n "useRequireAuth" client/src/app/haki/page.tsx

# 3. Hero card pattern wired (rank tier system)
grep -n "getRankTier\|tierStyles\|AvatarIcon" client/src/app/haki/page.tsx

# 4. Per-branch color identity classes present
grep -n "from-blue\|from-red\|from-purple" client/src/app/haki/page.tsx

# 5. formatBounty imported and used
grep -n "formatBounty" client/src/app/haki/page.tsx

# 6. Level descriptions array exists (3 entries per branch)
grep -c "descriptions" client/src/app/haki/page.tsx

# 7. Awakened glow treatment
grep -n "Awakened\|shadow-\[0_0_16px" client/src/app/haki/page.tsx

# 8. Business logic unchanged — upgrade handler, fetch, helpers still present
grep -n "handleUpgrade\|getLevel\|isConquerorUnlocked\|getHakiProfile\|upgradeHaki" client/src/app/haki/page.tsx

# 9. Backdrop blur on locked overlay
grep -n "backdrop-blur-md" client/src/app/haki/page.tsx
```

## Rollback

```bash
git checkout -- client/src/app/haki/page.tsx
```
