# Modularize src/ with styles, interfaces, types folders; move favicon to public

## Objective

Reorganize `src/` into a cleaner folder structure by:
1. Moving global styles into `src/styles/`
2. Extracting TypeScript interfaces into `src/interfaces/`
3. Extracting TypeScript type aliases/unions into `src/types/`
4. Moving the favicon from `src/app/favicon.ico` to `public/favicon.ico`

## Current structure (relevant parts)

```
src/
├── app/
│   ├── globals.css          → move to src/styles/globals.css
│   ├── favicon.ico          → move to public/favicon.ico
│   ├── layout.tsx           (import globals.css path changes)
│   └── ...
├── lib/
│   └── api/
│       └── types.ts         → split into src/interfaces/ and src/types/
└── components/
```

## Target structure

```
src/
├── app/            (routes only — no globals.css, no favicon.ico)
├── components/     (unchanged)
├── interfaces/     (NEW — request/response/context interfaces)
│   ├── api.ts      (all Request/Response interfaces)
│   ├── auth.ts     (AuthContextValue interface)
│   └── index.ts    (barrel export)
├── types/          (NEW — union types, type aliases, enums-as-types)
│   ├── game.ts     (GamePhase, ShipType, Orientation, ShotResult, Filiation, PirateRank, MarineRank)
│   ├── pagination.ts (PageResponse<T>, PaginationParams)
│   └── index.ts    (barrel export)
├── styles/         (NEW)
│   └── globals.css
├── lib/            (logic only — api/types.ts becomes re-export barrel)
│   ├── api/
│   │   ├── types.ts  (re-exports from @/interfaces and @/types for backwards compat)
│   │   └── ...
│   ├── auth/
│   ├── auth-storage.ts
│   ├── game/
│   └── validations/
public/
└── favicon.ico     (moved here)
```

## Files to create

- `src/styles/globals.css` — moved from `src/app/globals.css`
- `src/types/game.ts` — GamePhase, ShipType, Orientation, ShotResult, Filiation, PirateRank, MarineRank
- `src/types/pagination.ts` — PageResponse<T>, PaginationParams
- `src/types/index.ts` — barrel re-exports
- `src/interfaces/api.ts` — all Request/Response interfaces (RegisterRequest, LoginRequest, RefreshRequest, ShipPlacementDto, PlaceShipsRequest, ShotRequest, AuthResponse, UserResponse, CreateGameResponse, GameSummaryResponse, JoinGameResponse, ShipResponse, ShotCellResponse, MyBoardResponse, OpponentBoardResponse, BoardResponse, GameStateResponse, ShotResponse, ApiErrorResponse)
- `src/interfaces/auth.ts` — AuthContextValue interface
- `src/interfaces/index.ts` — barrel re-exports
- `public/favicon.ico` — moved from `src/app/favicon.ico`

## Files to modify

- `src/app/layout.tsx` — change `import "./globals.css"` to `import "@/styles/globals.css"`
- `src/lib/api/types.ts` — replace contents with re-exports from `@/interfaces` and `@/types` (backwards-compatible barrel)
- `src/lib/auth/auth-context.tsx` — import `AuthContextValue` from `@/interfaces/auth`
- `src/app/globals.css` — **delete** (moved)
- `src/app/favicon.ico` — **delete** (moved)

## Files to delete

- `src/app/globals.css`
- `src/app/favicon.ico`

## Steps

1. **Create `src/styles/globals.css`** — exact copy of current `src/app/globals.css`

2. **Create `src/types/game.ts`** — extract union types:
   ```ts
   export type Filiation = "PIRATE" | "MARINE";
   export type PirateRank = ...;
   export type MarineRank = ...;
   export type GamePhase = ...;
   export type ShipType = ...;
   export type Orientation = "HORIZONTAL" | "VERTICAL";
   export type ShotResult = "HIT" | "MISS" | "SUNK";
   ```

3. **Create `src/types/pagination.ts`** — extract generic types:
   ```ts
   export interface PageResponse<T> { ... }
   export interface PaginationParams { ... }
   ```

4. **Create `src/types/index.ts`** — barrel:
   ```ts
   export * from "./game";
   export * from "./pagination";
   ```

5. **Create `src/interfaces/api.ts`** — all request/response interfaces (importing types from `@/types`):
   ```ts
   import type { Filiation, ShipType, Orientation, ShotResult, GamePhase } from "@/types";
   // All interfaces...
   ```

6. **Create `src/interfaces/auth.ts`** — AuthContextValue:
   ```ts
   import type { UserResponse } from "./api";
   export interface AuthContextValue { ... }
   ```

7. **Create `src/interfaces/index.ts`** — barrel:
   ```ts
   export * from "./api";
   export * from "./auth";
   ```

8. **Rewrite `src/lib/api/types.ts`** as a backwards-compatible re-export barrel:
   ```ts
   export type * from "@/types";
   export type * from "@/interfaces/api";
   ```

9. **Update `src/lib/auth/auth-context.tsx`** — import `AuthContextValue` from `@/interfaces/auth` instead of declaring it inline

10. **Update `src/app/layout.tsx`** — change import path to `@/styles/globals.css`

11. **Move favicon** — copy `src/app/favicon.ico` to `public/favicon.ico`, delete original

12. **Delete `src/app/globals.css`** — already moved to `src/styles/`

## Verification

```bash
cd /home/perico/work/last-island/client

# 1. Type-check — no errors
npx tsc --noEmit

# 2. Production build — compiles successfully
npm run build

# 3. Lint — no new warnings
npm run lint
```

### Manual checks (reviewer)
- All existing imports from `@/lib/api/types` still resolve (backwards-compatible re-export)
- `src/app/` no longer contains `globals.css` or `favicon.ico`
- `public/favicon.ico` exists and is served at `/favicon.ico`
- No runtime regressions — pages still load styles correctly

## Rollback

```bash
cd /home/perico/work/last-island/client
git checkout HEAD -- src/app/globals.css src/app/favicon.ico src/app/layout.tsx src/lib/api/types.ts src/lib/auth/auth-context.tsx
rm -rf src/styles src/types src/interfaces public/favicon.ico
```
