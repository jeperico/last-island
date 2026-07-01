# MVP Fixes: API URL, CORS Proxy, JoinGameResponse Type

## Objective

Fix the client's API connectivity (correct backend URL, add Next.js rewrite proxy to bypass CORS, use relative paths for local dev) and align the JoinGameResponse type with the backend's actual GameResponse shape.

## Files to touch

- modify: `.env.local.example` — change default URL to `http://localhost:8081/api/v1`
- modify: `next.config.ts` — add `rewrites` to proxy `/api/:path*` → `http://localhost:8081/api/v1/:path*`
- modify: `src/lib/api/client.ts` — change BASE_URL fallback to empty string (relative), prefix all service paths with `/api/`; update `buildUrl` to handle relative paths
- modify: `src/lib/api/auth.ts` — prefix paths with `/api` (e.g., `/api/auth/register`)
- modify: `src/lib/api/games.ts` — prefix paths with `/api` (e.g., `/api/games`)
- modify: `src/lib/api/board.ts` — prefix paths with `/api` (e.g., `/api/games/:token/place-ships`)
- modify: `src/lib/api/types.ts` — replace `JoinGameResponse` with full GameResponse fields

## Steps

1. **Update `.env.local.example`** — change value to `http://localhost:8081/api/v1` and add a comment explaining that when unset, the client uses Next.js rewrites (proxy) for local dev.

2. **Add rewrites to `next.config.ts`** — add an `async rewrites()` function that maps `source: '/api/:path*'` to `destination: 'http://localhost:8081/api/v1/:path*'`. This proxies all `/api/*` requests from the client to the backend, bypassing CORS in local dev.

3. **Update `src/lib/api/client.ts`** — change BASE_URL fallback from `"http://localhost:8080"` to `""` (empty string). When `NEXT_PUBLIC_API_URL` is unset, `buildUrl` will produce relative paths (e.g., `/api/auth/register`) which the Next.js dev server proxies via rewrites. When `NEXT_PUBLIC_API_URL` is set (production/Vercel), it uses the full absolute URL. Adjust `buildUrl` to use simple string concatenation for relative paths instead of `new URL()` (which requires an absolute base).

4. **Prefix API paths in service files** — update all path arguments in `auth.ts`, `games.ts`, and `board.ts` to include the `/api` prefix:
   - `auth.ts`: `/auth/register` → `/api/auth/register`, `/auth/login` → `/api/auth/login`, `/auth/refresh` → `/api/auth/refresh`, `/auth/me` → `/api/auth/me`
   - `games.ts`: `/games` → `/api/games`, `/games/${token}` → `/api/games/${token}`
   - `board.ts`: `/games/${gameToken}/place-ships` → `/api/games/${gameToken}/place-ships`, `/games/${gameToken}/shots` → `/api/games/${gameToken}/shots`

5. **Fix `JoinGameResponse` in `src/lib/api/types.ts`** — replace the current 2-field interface with the full backend GameResponse shape:
   ```typescript
   export interface JoinGameResponse {
     id: string;
     token: string;
     phase: GamePhase;
     bluePlayerName: string;
     redPlayerName: string | null;
     currentTurnPlayerName: string | null;
     startedAt: string | null;
     createdAt: string;
   }
   ```

6. **Verify build** — run `npx tsc --noEmit`, `npm run build`, and `npm run lint` to confirm no type errors or build failures.

## Verification

```bash
# 1. TypeScript compiles cleanly
npx tsc --noEmit

# 2. Next.js build succeeds
npm run build

# 3. Lint passes
npm run lint

# 4. Confirm .env.local.example has correct URL
grep "8081/api/v1" .env.local.example

# 5. Confirm rewrites exist in next.config.ts
grep -c "rewrites" next.config.ts

# 6. Confirm client.ts fallback is empty string (relative paths)
grep 'process.env.NEXT_PUBLIC_API_URL ?? ""' src/lib/api/client.ts

# 7. Confirm API paths are prefixed
grep '"/api/auth/register"' src/lib/api/auth.ts
grep '"/api/games"' src/lib/api/games.ts

# 8. Confirm JoinGameResponse has full fields
grep "bluePlayerName" src/lib/api/types.ts | grep -c "JoinGameResponse" || grep -A5 "JoinGameResponse" src/lib/api/types.ts | grep -c "bluePlayerName"
```

## Rollback

```bash
git checkout -- .env.local.example next.config.ts src/lib/api/client.ts src/lib/api/auth.ts src/lib/api/games.ts src/lib/api/board.ts src/lib/api/types.ts
```
