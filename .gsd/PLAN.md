# Redesign W.O. (walkover) page for CANCELLED games

## Objective

Replace the minimal CANCELLED section in the game page with a properly styled card (wallpaper background, glass card, button) matching the existing design language used in other waiting/phase screens.

## Files to touch

- modify: `client/src/app/game/[token]/page.tsx`

## Steps

1. In `page.tsx`, locate the `if (gameState.phase === "CANCELLED")` block (currently lines 361–382).

2. Replace the existing plain markup with a redesigned block that includes:
   - **Wallpaper background**: reuse the same `getWallpaperPath(myAvatar)` + absolute positioned background pattern as WAITING_OPPONENT (rotated, 15% opacity).
   - **Centered glass card**: `max-w-md w-full bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-8`, flex-col centered.
   - **Content inside the card**:
     - `🏳️` emoji at `text-6xl`
     - `<h1>` with text "W.O." styled `text-3xl font-bold text-warning`
     - `<p>` message: "The battle against **{opponentName}** ended by walkover. No contest recorded, Captain." (opponentName bold/text-text-primary, rest text-sm text-text-muted, max-w-sm)
     - "Return to Grand Line" button: `<button>` with `onClick={() => router.push("/")}`, styled `mt-4 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors cursor-pointer`

3. Add a `resumeGlobalSoundtrack()` call to the phase-change effect (`useEffect` dependent on `gameState?.phase`) for the CANCELLED phase. Add a condition: if the current phase is `"CANCELLED"`, call `resumeGlobalSoundtrack()`. This handles the case where a game transitions to CANCELLED while the user is on the page (e.g. via SSE expiration event).

4. The `opponentName` derivation logic stays exactly as-is (compare `gameState.bluePlayerName` to `user.name`).

## Verification

```bash
cd client && npm run build && npm run lint
```

- Build must succeed with 0 errors.
- Lint must report 0 new errors (pre-existing warnings acceptable).
- Manual check: grep the CANCELLED section and confirm it contains: wallpaper bg div, glass card classes, 🏳️ emoji, "W.O." heading, opponentName message, "Return to Grand Line" button with router.push("/"), and resumeGlobalSoundtrack in the phase effect for CANCELLED.

## Rollback

```bash
git checkout -- client/src/app/game/[token]/page.tsx
```
