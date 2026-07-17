# Client Stack

## Core

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16 |
| Language | TypeScript | 5 |
| UI | React | 19 |
| Styling | Tailwind CSS | 4 |
| Components | shadcn/ui (Radix primitives) | latest |
| Bundler | Turbopack (default in Next 16) | — |
| Deployment | Vercel | — |

## Libraries

| Library | Purpose |
|---------|---------|
| Axios | HTTP client with interceptor for token refresh |
| React Hook Form | Form state management |
| Zod | Schema validation (form + API) |
| Sonner | Toast notifications |
| Lucide React | Icons |
| next-themes | Dark/light mode |
| class-variance-authority | Component variant styles |
| clsx + tailwind-merge | Conditional class merging |

## Dev Tools

| Tool | Purpose |
|------|---------|
| ESLint (flat config) | Linting (TS + React + import sort) |
| Prettier | Code formatting |
| Husky | Git hooks (pre-commit lint) |
| TypeScript strict mode | Type safety |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Prettier + ESLint auto-fix |

## Auth Model

- Cookie-based JWT: `access_token` + `refresh_token`
- `proxy.ts` guards private routes — redirects to `/login` if no tokens
- Axios interceptor handles token refresh on 401
- Supabase issues JWT; backend validates via JWK Set URI

## API Communication

- Base URL from `NEXT_PUBLIC_API_URL` env var
- All requests use Axios instance from `src/providers/axiosInstance.ts`
- Response format: snake_case JSON (matches backend)
- Error format: `{ status, error, message }`
- Pagination: `?page=0&size=10` → `PageResponse` wrapper
