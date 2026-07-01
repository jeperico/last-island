# REQ-11: Typed API Client Layer

## Objective

Create a fetch-based, fully-typed API client layer (`src/lib/api/`) that covers all backend REST endpoints (auth, games, board) with JWT token injection, typed DTOs/enums, and structured error handling.

## Files to touch

- `src/lib/api/types.ts` — **create** — All TypeScript interfaces, types, and union-type enums mirroring backend DTOs
- `src/lib/api/client.ts` — **create** — Base fetch wrapper with baseUrl resolution, JSON serialization, Authorization header injection, and ApiError throwing
- `src/lib/api/auth.ts` — **create** — Service functions: register(), login(), refresh(), getProfile()
- `src/lib/api/games.ts` — **create** — Service functions: createGame(), joinGame(), listGames(), getGame()
- `src/lib/api/board.ts` — **create** — Service functions: placeShips(), fireShot()
- `src/lib/api/index.ts` — **create** — Barrel re-exports of all service functions and types

## Steps

1. **Create `src/lib/api/types.ts`** with:
   - Union-type enums: `Filiation`, `PirateRank`, `MarineRank`, `GamePhase`, `ShipType`, `Orientation`, `ShotResult`
   - Request interfaces: `RegisterRequest`, `LoginRequest`, `RefreshRequest`, `PlaceShipsRequest`, `ShipPlacementDto`, `ShotRequest`
   - Response interfaces: `AuthResponse`, `UserResponse`, `CreateGameResponse`, `GameSummaryResponse`, `GameResponse` (with nullable fields: `redPlayerName`, `currentTurnPlayerName`, `startedAt` as `string | null`), `BoardResponse`, `ShipResponse`, `ShotResponse` (with `sunkShipType: string | null`)
   - Generic pagination: `PageResponse<T>` with fields `content`, `page`, `size`, `totalElements`, `totalPages`, `last`
   - Error shape: `ApiErrorResponse` interface with `status`, `error`, `message`, `timestamp`
   - Pagination params: `PaginationParams` with optional `page`, `size`, `sort`
   - Use `GamePhase` union type for `phase`/`gamePhase` fields in `CreateGameResponse`, `GameResponse`, `BoardResponse`

2. **Create `src/lib/api/client.ts`** with:
   - Read `NEXT_PUBLIC_API_URL` from `process.env` as base URL (fallback to `http://localhost:8080`)
   - Export an `ApiError` class extending `Error` that holds `status`, `error`, `message`, `timestamp` fields
   - Export a `setTokenProvider(fn: () => string | null)` function that stores a token-getter (allows REQ-3 to plug in later)
   - Internal `getHeaders()` helper: sets `Content-Type: application/json`, injects `Authorization: Bearer <token>` if token provider returns non-null
   - Export generic `apiGet<T>(path, params?)`, `apiPost<T>(path, body?)` functions that:
     - Build full URL from base + path + optional query params
     - Call `fetch()` with appropriate method, headers, body
     - On non-ok response: parse JSON as `ApiErrorResponse`, throw `ApiError`
     - On ok response: parse and return typed `T`
   - Mark 401 responses distinctly on the `ApiError` (set a boolean `isUnauthorized` flag) so REQ-3 can intercept later

3. **Create `src/lib/api/auth.ts`** with:
   - `register(data: RegisterRequest): Promise<AuthResponse>` → POST `/auth/register`
   - `login(data: LoginRequest): Promise<AuthResponse>` → POST `/auth/login`
   - `refresh(data: RefreshRequest): Promise<AuthResponse>` → POST `/auth/refresh`
   - `getProfile(): Promise<UserResponse>` → GET `/auth/me`

4. **Create `src/lib/api/games.ts`** with:
   - `createGame(): Promise<CreateGameResponse>` → POST `/games`
   - `joinGame(token: string): Promise<GameResponse>` → POST `/games/{token}`
   - `listGames(params?: PaginationParams): Promise<PageResponse<GameSummaryResponse>>` → GET `/games`
   - `getGame(token: string): Promise<GameResponse>` → GET `/games/{token}`

5. **Create `src/lib/api/board.ts`** with:
   - `placeShips(gameToken: string, data: PlaceShipsRequest): Promise<BoardResponse>` → POST `/games/{token}/place-ships`
   - `fireShot(gameToken: string, data: ShotRequest): Promise<ShotResponse>` → POST `/games/{token}/shots`

6. **Create `src/lib/api/index.ts`** with:
   - Re-export all functions from `auth.ts`, `games.ts`, `board.ts`
   - Re-export all types from `types.ts`
   - Re-export `ApiError`, `setTokenProvider` from `client.ts`

## Verification

```bash
# 1. TypeScript compiles with no errors
npx tsc --noEmit

# 2. Next.js production build passes
npm run build

# 3. Confirm all expected exports exist (quick grep check)
grep -c "export" src/lib/api/index.ts
# Should be ≥ 3 re-export lines

# 4. Confirm no external dependencies added (no axios, no ky)
grep -E "axios|ky|got|node-fetch" package.json
# Should return nothing (exit code 1)
```

## Rollback

```bash
rm -rf src/lib/api/
```
