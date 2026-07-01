# REQ-2: Auth Pages — Register and Login Forms with JWT Token Handling

## Objective

Create Register (`/register`) and Login (`/login`) pages with correct backend-aligned types, form validation, localStorage token storage, and post-auth redirect.

## Files to touch

- **modify** `src/lib/api/types.ts` — fix RegisterRequest, LoginRequest, AuthResponse, UserResponse to match backend DTOs
- **create** `src/app/(auth)/layout.tsx` — shared centered card layout for auth pages
- **create** `src/app/(auth)/register/page.tsx` — register form (name, email, password, filiation)
- **create** `src/app/(auth)/login/page.tsx` — login form (email, password)
- **create** `src/lib/auth-storage.ts` — thin localStorage helpers (getToken, setTokens, clearTokens)

## Steps

1. **Fix `src/lib/api/types.ts` to align with backend DTOs**
   - `RegisterRequest`: rename `username` → `name`, remove `rank` field. Result: `{ name: string; email: string; password: string; filiation: Filiation }`
   - `LoginRequest`: rename `username` → `email`, add `password` (already exists). Result: `{ email: string; password: string }`
   - `AuthResponse`: add `user: UserResponse` field. Result: `{ accessToken: string; refreshToken: string; user: UserResponse }`
   - `UserResponse`: change `id: number` → `id: string`, rename `username` → `name`, add `bounty: number`, `wins: number`, `losses: number`. Result: `{ id: string; name: string; email: string; filiation: Filiation; rank: string; bounty: number; wins: number; losses: number }`

2. **Create `src/lib/auth-storage.ts`** — lightweight localStorage wrapper
   - `setTokens(accessToken: string, refreshToken: string): void` — stores both tokens under keys `access_token` and `refresh_token`
   - `getAccessToken(): string | null` — reads `access_token` from localStorage
   - `getRefreshToken(): string | null` — reads `refresh_token` from localStorage
   - `clearTokens(): void` — removes both keys
   - No auth context/provider (that's REQ-3)

3. **Create `src/app/(auth)/layout.tsx`** — shared auth layout
   - Server component (no `"use client"` needed — just layout markup)
   - Full-height flex container, centered content
   - Renders children inside a card-style container (white bg, rounded, shadow, max-w-md)
   - Dark-mode-aware using existing CSS variables (`var(--background)`, `var(--foreground)`)

4. **Create `src/app/(auth)/register/page.tsx`** — Register form
   - `"use client"` directive
   - Controlled form with fields: `name` (text, required), `email` (email, required), `password` (password, required, minLength 8), `filiation` (radio buttons or select: PIRATE / MARINE, required)
   - State: `formData`, `error` (string | null), `loading` (boolean)
   - On submit: call `register()` from `src/lib/api/auth.ts`, on success → `setTokens(...)` → `router.push("/")`
   - On error: catch `ApiError`, display `error.message` (handles 409 conflict for duplicate name/email)
   - Link to `/login` at bottom ("Already have an account? Log in")
   - HTML5 validation attributes: `required`, `type="email"`, `minLength={8}`
   - Tailwind styling: inputs with border, focus ring, rounded; button with bg-blue-600 hover state; responsive padding

5. **Create `src/app/(auth)/login/page.tsx`** — Login form
   - `"use client"` directive
   - Controlled form with fields: `email` (email, required), `password` (password, required)
   - State: `formData`, `error` (string | null), `loading` (boolean)
   - On submit: call `login()` from `src/lib/api/auth.ts`, on success → `setTokens(...)` → `router.push("/")`
   - On error: catch `ApiError`, display `error.message` (handles 401 invalid credentials)
   - Link to `/register` at bottom ("Don't have an account? Sign up")
   - Same styling pattern as register page

6. **Wire token provider** — In each page's submit handler, after storing tokens, also call `setTokenProvider(() => getAccessToken())` from `src/lib/api/client.ts` so subsequent API calls are authenticated for the current session. (REQ-3 will make this global/persistent.)

## Verification

```bash
# Type check — must exit 0
npx tsc --noEmit

# Full build — must succeed with new routes compiled
npm run build

# Lint — must pass
npm run lint
```

Manual checks (implementer confirms before marking done):
- `/register` renders with 4 fields (name, email, password, filiation) + submit button
- `/login` renders with 2 fields (email, password) + submit button
- Both pages are centered in a card layout
- Form submission sends correct JSON field names to backend endpoints
- Successful auth stores `access_token` and `refresh_token` in localStorage
- Successful auth redirects to `/`
- Server error (409, 401) displays error message on the form
- Navigation links between `/login` ↔ `/register` work
- Dark mode renders correctly (check with `prefers-color-scheme: dark`)

## Rollback

```bash
# Undo all changes (if uncommitted)
git checkout -- src/lib/api/types.ts
rm -f src/lib/auth-storage.ts
rm -rf src/app/\(auth\)

# Or if committed
git revert HEAD
```
