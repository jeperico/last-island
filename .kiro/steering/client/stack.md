# Client Stack

## Core

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16 |
| Language | TypeScript | 5 |
| UI | React | 19 |
| Styling | Tailwind CSS | 4 |
| Forms | React Hook Form + Zod | 7.x / 4.x |
| Bundler | Turbopack (default in Next 16) | — |

## Libraries

| Library | Purpose |
|---------|---------|
| @hookform/resolvers | Zod resolver for react-hook-form |
| Zod | Schema validation (forms + API responses) |

## Dev Tools

| Tool | Purpose |
|------|---------|
| ESLint (flat config) | Linting (next core-web-vitals + TypeScript) |
| TypeScript strict mode | Type safety |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack, :3000) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `make client-run` | Alias for `npm run dev` from project root |
| `make client-build` | Alias for `npm run build` |
| `make client-prod` | Build + serve production |

## Auth Model

- Cookie-based JWT: `access_token` + `refresh_token` (HttpOnly, SameSite=Lax)
- Backend issues JWT (HS256, self-signed via secret)
- API client auto-retries on 401 by calling `/auth/refresh` then replaying the request
- `useRequireAuth` hook guards authenticated pages — redirects to `/login` if no session
- `useRedirectIfAuthenticated` hook on auth pages — redirects to `/` if already logged in

## API Communication

- Base URL from `NEXT_PUBLIC_API_URL` env var (empty string = same-origin/proxy)
- Custom fetch-based API client (`src/lib/api/client.ts`) with `apiGet`, `apiPost`, `apiPut`
- All requests use `credentials: "include"` for cookie transport
- Automatic token refresh + retry on 401 (deduplicated via shared promise)
- Response format: snake_case JSON (matches backend via Jackson config)
- Error format: `{ status, error, message, timestamp }`
- Pagination: `?page=0&size=10` → `PageResponse` wrapper

## Real-Time Communication

- Server-Sent Events (SSE) for game and lobby updates
- Game events: `GET /api/v1/games/{token}/events` (authenticated)
- Lobby events: `GET /api/v1/lobby/events` (authenticated)
- Supports `Last-Event-ID` for reconnection replay
- Custom hooks: `useGameEvents`, `useLobbyEvents`
