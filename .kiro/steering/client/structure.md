# Project Structure

## Source Layout (`client/src/`)

```
src/
├── app/                        # Next.js App Router (pages, layouts, route groups)
│   ├── (auth)/                 # Auth pages (login, register) — shared layout
│   │   ├── login/
│   │   └── register/
│   ├── game/[token]/           # Game battle page (dynamic route per game token)
│   ├── settings/               # User settings page (avatar, profile)
│   ├── api/[...path]/          # Next.js API route (proxy to backend)
│   ├── layout.tsx              # Root layout
│   ├── providers.tsx           # Context providers wrapper
│   └── page.tsx                # Home page (lobby, game list, matchmaking)
├── components/                 # Reusable UI components
│   ├── ui/                     # Generic UI primitives (button, card, input, modal, etc.)
│   ├── character-select.tsx    # Character/avatar selection component
│   ├── surrender-modal.tsx     # In-game surrender confirmation
│   └── wallpaper-modal.tsx     # Wallpaper selection overlay
├── interfaces/                 # TypeScript interfaces (API response shapes)
│   ├── api.ts                  # Game, board, shot, user API response interfaces
│   └── auth.ts                 # Auth-related interfaces
├── lib/                        # Business logic, hooks, and utilities
│   ├── api/                    # API client and service functions
│   │   ├── client.ts           # Fetch wrapper (apiGet, apiPost, apiPut) + refresh logic
│   │   ├── auth.ts             # Auth service (login, register, refresh, logout)
│   │   ├── games.ts            # Game service (create, join, list, state, actions)
│   │   ├── board.ts            # Board service (place ships)
│   │   └── users.ts            # User service (leaderboard, profile)
│   ├── auth/                   # Auth context + route-guard hooks
│   │   ├── auth-context.tsx    # AuthProvider + useAuth hook
│   │   ├── use-require-auth.ts # Guard: redirect to /login if unauthenticated
│   │   └── use-redirect-if-authenticated.ts
│   ├── game/                   # Game-specific hooks and logic
│   │   ├── use-game-events.ts  # SSE hook for in-game events
│   │   ├── use-lobby-events.ts # SSE hook for lobby updates
│   │   ├── placement-logic.ts  # Ship placement validation
│   │   └── ship-config.ts      # Ship definitions (sizes, names)
│   ├── hooks/                  # Shared custom hooks
│   │   └── use-wallpaper.ts    # Wallpaper preference hook
│   ├── sound/                  # Sound system
│   │   └── sound-context.tsx   # SoundProvider + useSound hook
│   ├── validations/            # Zod schemas
│   │   ├── login.ts
│   │   ├── register.ts
│   │   └── auth.ts
│   ├── auth-storage.ts         # Local storage helpers for auth state
│   └── format.ts              # Formatting utilities
├── styles/                     # Global CSS (Tailwind base)
│   └── globals.css
└── types/                      # Shared TypeScript types
    ├── game.ts                 # Game domain types (enums, game state)
    ├── game-events.ts          # SSE event payload types
    └── pagination.ts           # PageResponse generic type
```

## Conventions

- **Route groups** `(auth)/` — groups login/register under shared layout
- **Dynamic routes** `game/[token]` — each game accessed by its unique token
- **API services** grouped by domain: `lib/api/auth.ts`, `lib/api/games.ts`, etc.
- **Interfaces** in `interfaces/` mirror API response shapes
- **Types** in `types/` define domain enums and SSE event payloads
- **Hooks** colocated with their domain: `lib/game/use-game-events.ts`
- **Path alias**: `@/lib/api/client` → `src/lib/api/client`
- **No barrel files** at `src/` root — import directly from module path

## Adding a New Page

1. Create route: `src/app/{name}/page.tsx` (or `src/app/(auth)/{name}/page.tsx` for auth pages)
2. If it needs API calls: add functions to `src/lib/api/{domain}.ts`
3. If it introduces new types: add to `src/types/{domain}.ts` or `src/interfaces/{domain}.ts`
4. If it needs SSE: create hook in `src/lib/game/use-{name}-events.ts`

## Adding a New Component

1. Place in `src/components/{name}.tsx` (or `src/components/ui/{name}.tsx` for primitives)
2. Define `Props` interface in the same file
3. Export at the bottom of the file
