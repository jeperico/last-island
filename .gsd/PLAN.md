# Frontend: Remove 'Join by Token' functionality

## Objective

Remove the manual token-input join flow from the client UI, keeping lobby-list joining intact.

## Files to touch

- **modify** `client/src/app/page.tsx` — Remove `joinGameSchema`/`JoinGameFormData` imports, `useForm` setup, `onJoin` handler, "Join by Token" form section, and `Token: {game.token}` text from game cards.
- **modify** `client/src/app/game/[token]/page.tsx` — Replace WAITING_OPPONENT token-sharing message and Badge with a simple "Waiting for an opponent from the Grand Line…" message.
- **delete** `client/src/lib/validations/join-game.ts` — Entire file (only served the token input form).

## Steps

1. **Delete `client/src/lib/validations/join-game.ts`** — the Zod schema and type are no longer needed.

2. **Modify `client/src/app/page.tsx`:**
   - Remove import of `joinGameSchema` and `JoinGameFormData` from `@/lib/validations/join-game`.
   - Remove imports of `useForm` from `react-hook-form` and `zodResolver` from `@hookform/resolvers/zod` (only used by the token form).
   - Remove the `useForm<JoinGameFormData>` call (`register`, `handleSubmit`, `formState: { errors }`).
   - Remove the `onJoin` async function (lines ~168–182).
   - Remove the "Join by Token" form section (the `<div className="mt-4 pt-4 border-t ...">` containing the label, form, Input, and submit Button).
   - In the game card text, change `Token: {game.token} · {formatDate(game.createdAt)}` to just `{formatDate(game.createdAt)}`.
   - Remove the `Input` import from `@/components/ui` if it's no longer used elsewhere in the file.

3. **Modify `client/src/app/game/[token]/page.tsx`:**
   - In the WAITING_OPPONENT block (lines 206–217), replace the `<p>` text and the "Battle Token" `<div>` with a single paragraph: `<p className="text-sm text-text-muted max-w-sm">Waiting for an opponent from the Grand Line…</p>`.
   - Keep the sailing emoji animation (`⛵` with bounce), the background wallpaper, and the "Scanning the horizon…" heading.
   - Remove the `<div className="flex flex-col items-center gap-2">` block that shows "Battle Token" label and `<Badge>` with the token.

## Verification

```bash
cd /home/perico/work/last-island/client && npm run build && npm run lint
```

Grep for removed concepts (all should return 0 matches):
```bash
grep -r "joinGameSchema\|JoinGameFormData" client/src/
grep -r "join-game" client/src/
grep -r "Share the token\|Battle Token\|Enter game token" client/src/
```

Manual check: confirm `joinGame` function in `client/src/lib/api/games.ts` is still present (used by lobby list join).

## Rollback

```bash
git checkout -- client/src/app/page.tsx client/src/app/game/\[token\]/page.tsx
git checkout -- client/src/lib/validations/join-game.ts
```
