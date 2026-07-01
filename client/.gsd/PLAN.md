# REQ-4: Game Lobby — Create, Join, and List Games

## Objective

Replace the placeholder home page with a fully functional game lobby that lets authenticated users create a new game, join an existing game by token, browse available games with pagination, and redirects to `/game/[token]` after create/join.

## Files to touch

- **modify** `src/lib/api/types.ts` — Fix `GamePhase` enum (`WAITING_FOR_PLAYERS` → `WAITING_OPPONENT`), fix `CreateGameResponse` to match backend (add `id`, `createdAt`, remove `bluePlayerName`), fix `GameSummaryResponse` to match backend (add `id`, remove `phase`, remove `redPlayerName`)
- **modify** `src/app/page.tsx` — Replace placeholder with full lobby UI (create game, join by token, game list with pagination, logout)
- **create** `src/app/game/[token]/page.tsx` — Minimal placeholder page (protected, shows token) so redirects don't 404 during development

## Steps

1. **Fix `GamePhase` enum in `src/lib/api/types.ts`**
   - Change `"WAITING_FOR_PLAYERS"` to `"WAITING_OPPONENT"` to match backend's `GamePhase.java` enum serialization.

2. **Fix `CreateGameResponse` in `src/lib/api/types.ts`**
   - Add `id: string` field (UUID from backend).
   - Add `createdAt: string` field.
   - Remove `bluePlayerName` field (backend `CreateGameResponse` doesn't include it).
   - Final shape: `{ id: string; token: string; phase: GamePhase; createdAt: string }`

3. **Fix `GameSummaryResponse` in `src/lib/api/types.ts`**
   - Add `id: string` field (UUID from backend).
   - Remove `phase` field (backend `GameSummaryResponse` doesn't include it).
   - Remove `redPlayerName` field (backend doesn't include it).
   - Final shape: `{ id: string; token: string; bluePlayerName: string; createdAt: string }`

4. **Rewrite `src/app/page.tsx` as the lobby page**
   - Keep `"use client"` directive.
   - Use `useRequireAuth()` for route protection; show loading spinner while checking auth.
   - Use `useAuth()` to get `user` and `logout`.
   - **Header section**: Welcome greeting with user name, logout button (top-right).
   - **Create Game section**: A prominent "Create Game" button. On click: set loading state, call `createGame()`, on success `router.push(/game/${response.token})`, on error display error message.
   - **Join by Token section**: Text input + "Join" button. On click: validate non-empty, call `joinGame(token)`, on success `router.push(/game/${response.token})`, on error display error (e.g., "Game not found", "Game already started").
   - **Available Games list section**:
     - On mount, call `listGames({ page: 0, size: 10 })`.
     - Display games as a list/table: creator name (`bluePlayerName`), token (truncated or full), creation time (formatted relative or ISO), "Join" button per row.
     - Client-side filter: only show items where phase would be WAITING_OPPONENT (backend returns all phases, but since `GameSummaryResponse` no longer has `phase` field, all returned games from the list endpoint are implicitly available — the backend likely only returns waiting games on the paginated list; if not, we display all and let the join fail gracefully).
     - Pagination: "Previous" / "Next" buttons, disabled at boundaries. Show "Page X of Y".
     - Empty state: "No games available. Create one!" message.
   - **Error handling**: Use `ApiError` type from `src/lib/api/client.ts`. Display error messages in a red alert div (matching existing pattern from auth pages). Clear errors on new actions.
   - **Styling**: Tailwind utilities, max-w-2xl centered container, consistent with existing auth pages (blue-600 buttons, dark mode variants, proper spacing).

5. **Create placeholder `src/app/game/[token]/page.tsx`**
   - `"use client"` directive.
   - Use `useRequireAuth()` for protection.
   - Extract `token` from `useParams()`.
   - Render: "Game: {token}" heading + "This page is under construction" message.
   - This prevents 404 when lobby redirects after create/join.

## Verification

```bash
# Type-check passes
npx tsc --noEmit

# Build compiles successfully (should show /, /login, /register, /game/[token] routes)
npm run build

# Lint passes
npm run lint

# Lobby page is auth-protected
grep -q "useRequireAuth" src/app/page.tsx && echo "PASS: useRequireAuth" || echo "FAIL"

# All 3 API functions used in lobby
grep -q "createGame" src/app/page.tsx && grep -q "joinGame" src/app/page.tsx && grep -q "listGames" src/app/page.tsx && echo "PASS: API functions" || echo "FAIL"

# GamePhase enum fixed
grep -q "WAITING_OPPONENT" src/lib/api/types.ts && echo "PASS: enum fix" || echo "FAIL"

# Old wrong enum value removed
grep -q "WAITING_FOR_PLAYERS" src/lib/api/types.ts && echo "FAIL: old enum still present" || echo "PASS: old enum removed"

# Redirect to /game/[token] after create/join
grep -qE "router\.push.*game" src/app/page.tsx && echo "PASS: redirect" || echo "FAIL"

# CreateGameResponse has id field
grep -A5 "CreateGameResponse" src/lib/api/types.ts | grep -q "id:" && echo "PASS: id field" || echo "FAIL"

# Game placeholder page exists and is protected
grep -q "useRequireAuth" src/app/game/\\[token\\]/page.tsx && echo "PASS: game page" || echo "FAIL"
```

## Rollback

```bash
git checkout HEAD -- src/lib/api/types.ts src/app/page.tsx
rm -rf src/app/game/
```
