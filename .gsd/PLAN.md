# Frontend: Avatar Display Across Screens

## Objective

Create a reusable AvatarIcon component and integrate avatar display into the battle screen, game over panel, leaderboard, dashboard header, and battle detail modal.

## Files to touch

- `client/public/avatars/default/profile.svg` — create (generic marine/null fallback SVG)
- `client/src/components/ui/avatar-icon.tsx` — create (reusable AvatarIcon component)
- `client/src/components/ui/index.ts` — modify (export AvatarIcon)
- `client/src/interfaces/api.ts` — modify (add `bluePlayerAvatar`, `redPlayerAvatar` to GameStateResponse)
- `client/src/app/game/[token]/battle-screen.tsx` — modify (show avatars next to turn indicator)
- `client/src/app/game/[token]/game-over-panel.tsx` — modify (add avatar props, show in results header)
- `client/src/app/game/[token]/page.tsx` — modify (pass avatar props to GameOverPanel)
- `client/src/app/page.tsx` — modify (avatar in dashboard header + leaderboard entries)
- `client/src/components/battle-detail-modal.tsx` — modify (show avatars in header banner)

## Steps

1. **Create default fallback SVG** — `client/public/avatars/default/profile.svg`
   - 200×200 circle SVG with a neutral navy background and anchor/skull-crossbones shape (same style as existing character SVGs but generic)
   - Used when avatar is null (marines or unset)

2. **Create AvatarIcon component** — `client/src/components/ui/avatar-icon.tsx`
   - Interface: `{ avatar: string | null; size?: "sm" | "md" | "lg"; className?: string; highlight?: "gold" | "none" }`
   - Size mapping: sm → `w-8 h-8`, md → `w-12 h-12`, lg → `w-16 h-16`
   - Image src logic: if avatar is non-null, use `/avatars/${avatar.toLowerCase()}/profile.svg`; if null, use `/avatars/default/profile.svg`
   - Base styling: `rounded-full border-2 border-border object-cover`
   - highlight="gold" adds `ring-2 ring-gold` for winner styling
   - Plain `<img>` tag (matching existing pattern from settings page)
   - Export as named export

3. **Export from barrel** — `client/src/components/ui/index.ts`
   - Add `export { AvatarIcon } from "./avatar-icon";`

4. **Update GameStateResponse interface** — `client/src/interfaces/api.ts`
   - Add `bluePlayerAvatar: string | null;` and `redPlayerAvatar: string | null;` fields to `GameStateResponse` (after `redPlayerName`)

5. **Battle screen** — `client/src/app/game/[token]/battle-screen.tsx`
   - Import `AvatarIcon` from `@/components/ui`
   - In the turn indicator section (line ~119–131), wrap the Badge in a flex row with avatars:
     - Compute `myAvatar` and `opponentAvatar` from gameState (bluePlayerName === user.name → myAvatar = bluePlayerAvatar)
     - Show `<AvatarIcon avatar={isMyTurn ? myAvatar : opponentAvatar} size="sm" />` next to the Badge
   - Keep it simple: one small avatar indicating whose turn it is

6. **Game over panel** — `client/src/app/game/[token]/game-over-panel.tsx`
   - Extend `GameOverPanelProps` with `myAvatar: string | null` and `opponentAvatar: string | null`
   - Import `AvatarIcon` from `@/components/ui`
   - In the header section (line ~99), replace the emoji (`"🏴‍☠️"` / `"💀"`) with `<AvatarIcon avatar={isWinner ? myAvatar : opponentAvatar} size="lg" highlight={isWinner ? "gold" : "none"} />`
   - Optionally add the opponent's avatar on the other side for a VS layout feel

7. **Game page (pass avatar props)** — `client/src/app/game/[token]/page.tsx`
   - In the FINISHED phase block, compute:
     - `myAvatar = gameState.bluePlayerName === user.name ? gameState.bluePlayerAvatar : gameState.redPlayerAvatar`
     - `opponentAvatar = gameState.bluePlayerName === user.name ? gameState.redPlayerAvatar : gameState.bluePlayerAvatar`
   - Pass `myAvatar` and `opponentAvatar` as new props to `<GameOverPanel>`

8. **Dashboard — header avatar** — `client/src/app/page.tsx`
   - Import `AvatarIcon` from `@/components/ui`
   - In the PageHeader title area (line ~287), add `<AvatarIcon avatar={user?.avatar ?? null} size="sm" />` next to the welcome text (wrap in flex if needed)

9. **Dashboard — leaderboard entries** — `client/src/app/page.tsx`
   - In the leaderboard table Name column (line ~410), replace `{entry.filiation === "PIRATE" ? "🏴‍☠️" : "⚓"}` with `<AvatarIcon avatar={entry.avatar} size="sm" className="inline-block" />`
   - Keep the entry name text after the avatar

10. **Battle detail modal** — `client/src/components/battle-detail-modal.tsx`
    - Import `AvatarIcon` from `@/components/ui`
    - In the header banner (line ~136), compute player avatars from `gameState.bluePlayerAvatar`/`gameState.redPlayerAvatar`
    - Replace the emoji (`"🏴‍☠️"` / `"💀"`) with `<AvatarIcon avatar={myAvatar} size="md" highlight={isVictory ? "gold" : "none"} />`
    - Optionally show opponent avatar next to "vs {opponentName}" text

## Verification

```bash
cd client && npm run build
```
- Must pass with no new TypeScript errors

```bash
cd client && npm run lint
```
- Must not introduce new lint errors (pre-existing 9 issues are acceptable)

```bash
cd service && mvn test -pl service -q
```
- Must pass (no backend changes in this task)

### Manual checks
- Verify AvatarIcon renders at all 3 sizes (32px, 48px, 64px) with circular clipping
- Verify null avatar shows the default/fallback SVG (marine placeholder)
- Verify gold highlight ring displays on winner avatar in game-over panel
- Verify leaderboard entries show character avatars inline with names

## Rollback

```bash
git checkout -- client/src/components/ui/avatar-icon.tsx client/src/components/ui/index.ts client/src/interfaces/api.ts client/src/app/game/\[token\]/battle-screen.tsx client/src/app/game/\[token\]/game-over-panel.tsx client/src/app/game/\[token\]/page.tsx client/src/app/page.tsx client/src/components/battle-detail-modal.tsx
rm -f client/public/avatars/default/profile.svg client/src/components/ui/avatar-icon.tsx
```
