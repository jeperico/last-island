# Add Player Profile Modal to Leaderboard

## Objective

Create a PlayerProfileModal component and wire it into the home page leaderboard so clicking any player (podium top-3 or scrollable list rows) opens a rich profile card showing avatar, name, rank with tier glow, bounty, wins, losses (derived), and win rate.

## Files to touch

- **create** `client/src/components/player-profile-modal.tsx` — New modal component
- **modify** `client/src/app/page.tsx` — Add state for selected player, onClick handlers on leaderboard rows/podium cells, render PlayerProfileModal

## Steps

1. **Create `client/src/components/player-profile-modal.tsx`**
   - Props interface: `{ open: boolean; onClose: () => void; player: LeaderboardEntryResponse | null }`
   - Import `Modal`, `AvatarIcon`, `getRankTier`, `tierStyles` from `@/components/ui`
   - Import `formatBounty` from `@/lib/format`
   - Import `LeaderboardEntryResponse` from `@/interfaces/api`
   - Early return `null` if `player` is null
   - Wrap content in `<Modal open={open} onClose={onClose} title="Player Profile">`
   - Inner card: `<div className="bg-surface-elevated rounded-xl p-6 border border-border">`
   - Compute tier: `const tier = getRankTier(player.rank)` and `const style = tierStyles[tier]`
   - Compute losses: `const totalGames = player.winRate > 0 ? Math.round(player.wins / player.winRate) : player.wins; const losses = totalGames - player.wins;`
   - Layout:
     - Top section: avatar background image (`/avatars/{key}/{key}-bg-02.jpg`) as a banner with overlay, centered `AvatarIcon` size `lg` with tier glow border (`${style.border} ${style.glow}`)
     - Player name: large `text-text-primary font-bold text-xl` centered
     - Rank badge: pill/tag with tier background color (use `rankBg` map pattern from design system), tier text color, rank name
     - Bounty: `formatBounty(player.bounty)` + "₿" with `text-secondary` styling
     - Stats grid (2×2 or horizontal row): Wins, Losses, Win Rate (as percentage), each with label in `text-text-muted` and value in `text-text-primary`
   - Apply rank tier glow to the outer card border: `${style.border} ${style.glow}`
   - No accuracy field (not available in LeaderboardEntryResponse; task says "if available")

2. **Modify `client/src/app/page.tsx` — State + import**
   - Add import: `import { PlayerProfileModal } from "@/components/player-profile-modal"`
   - Add state: `const [profilePlayer, setProfilePlayer] = useState<LeaderboardEntryResponse | null>(null)`
   - Derive open state: `const profileOpen = profilePlayer !== null`
   - Add close handler: `const closeProfile = () => setProfilePlayer(null)`

3. **Modify `client/src/app/page.tsx` — Wire podium cells (lines ~237–272)**
   - Add to each podium cell `<div>`: `onClick={() => setProfilePlayer(entry)}`, `className` append `cursor-pointer`, add `role="button"` and `tabIndex={0}` for accessibility, add `onKeyDown` handler for Enter/Space to trigger click

4. **Modify `client/src/app/page.tsx` — Wire scrollable list rows (lines ~275–301)**
   - Add to each list row `<div>`: `onClick={() => setProfilePlayer(entry)}`, append `cursor-pointer` to existing className

5. **Modify `client/src/app/page.tsx` — Wire pinned current-user footer (lines ~304–336)**
   - Add `onClick` + `cursor-pointer` to the pinned footer row as well (user can view their own profile card)

6. **Modify `client/src/app/page.tsx` — Render modal**
   - Place `<PlayerProfileModal open={profileOpen} onClose={closeProfile} player={profilePlayer} />` near the other modals (close to HakiTutorialModal render location)

## Verification

```bash
# 1. Build check — no TypeScript errors
cd client && npm run build

# 2. Lint check — zero new errors
cd client && npx eslint src/components/player-profile-modal.tsx src/app/page.tsx --no-error-on-unmatched-pattern

# 3. PlayerProfileModal imported and rendered in page
grep -c "PlayerProfileModal" client/src/app/page.tsx
# Expected: ≥ 2

# 4. onClick handlers added to leaderboard
grep -c "setProfilePlayer" client/src/app/page.tsx
# Expected: ≥ 3 (podium + list + footer)

# 5. cursor-pointer on leaderboard elements
grep "cursor-pointer" client/src/app/page.tsx | grep -c "setProfilePlayer\|leaderboard"
# Expected: ≥ 1

# 6. Tier utilities and formatBounty used in modal
grep -E "getRankTier|tierStyles|formatBounty" client/src/components/player-profile-modal.tsx
# Expected: ≥ 3 matches

# 7. Design system card pattern
grep -c "bg-surface-elevated" client/src/components/player-profile-modal.tsx
# Expected: ≥ 1

# 8. AvatarIcon used in modal
grep -c "AvatarIcon" client/src/components/player-profile-modal.tsx
# Expected: ≥ 1

# 9. Modal component used
grep -c "Modal" client/src/components/player-profile-modal.tsx
# Expected: ≥ 2 (import + JSX)

# 10. Accessibility: role=button on podium cells
grep -c 'role="button"' client/src/app/page.tsx
# Expected: ≥ 3
```

## Rollback

```bash
rm client/src/components/player-profile-modal.tsx
git checkout -- client/src/app/page.tsx
```
