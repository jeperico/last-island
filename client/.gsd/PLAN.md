# REQ-3: Auth State Management — Context, Refresh, Route Protection

## Objective

Implement a React Context-based auth state layer that persists user sessions across navigation, auto-refreshes expired tokens on 401, and protects routes via client-side redirects.

## Files to touch

- **create** `src/lib/auth/auth-context.tsx` — AuthContext + AuthProvider with user/loading/login/logout/refresh state
- **create** `src/lib/auth/use-require-auth.ts` — hook that redirects unauthenticated users to /login
- **create** `src/lib/auth/use-redirect-if-authenticated.ts` — hook that redirects authenticated users to /
- **create** `src/lib/auth/index.ts` — barrel re-exports
- **create** `src/app/providers.tsx` — "use client" wrapper that renders AuthProvider around children
- **modify** `src/lib/api/client.ts` — add 401 intercept with refresh-and-retry logic + concurrent refresh deduplication
- **modify** `src/lib/auth-storage.ts` — add `typeof window` guard for SSR safety
- **modify** `src/app/layout.tsx` — wrap children with `<Providers>`
- **modify** `src/app/(auth)/login/page.tsx` — use `useRedirectIfAuthenticated` + call context's login instead of manual token wiring
- **modify** `src/app/(auth)/register/page.tsx` — use `useRedirectIfAuthenticated` + call context's register instead of manual token wiring

## Steps

1. **SSR-safe auth-storage** — Modify `src/lib/auth-storage.ts`: wrap every `localStorage` call with `typeof window !== "undefined"` guard so imports from client components during SSR don't throw. Return `null` from getters when on server.

2. **Add refresh-and-retry to API client** — In `src/lib/api/client.ts`:
   - Add a module-level `let refreshPromise: Promise<void> | null = null` for deduplication.
   - Export a new `onUnauthorized` callback setter: `let onUnauthorizedCallback: (() => void) | null = null; export function setOnUnauthorized(fn: () => void) { onUnauthorizedCallback = fn; }`.
   - Create an internal `attemptRefresh()` function that: gets refresh token from storage, calls the refresh endpoint (import `refresh` from `./auth`), stores new tokens via `setTokens`, and resets `refreshPromise` to null when done. If refresh fails, calls `onUnauthorizedCallback()` (which will trigger logout in the context) and resets.
   - Implement deduplication: if `refreshPromise` is already set, return it instead of starting a new refresh.
   - Modify `apiGet` and `apiPost`: wrap the existing fetch+handleResponse in a try/catch. If caught error is `ApiError` with `isUnauthorized === true`, call `await attemptRefresh()`, then retry the request exactly once. If the retry also fails with 401, throw the error.

3. **Create AuthContext and AuthProvider** — Create `src/lib/auth/auth-context.tsx`:
   - `"use client"` directive.
   - Define `AuthContextValue` interface: `{ user: UserResponse | null; isLoading: boolean; isAuthenticated: boolean; login: (email: string, password: string) => Promise<void>; register: (name: string, email: string, password: string, filiation: string) => Promise<void>; logout: () => void; }`.
   - Create context with `createContext<AuthContextValue | null>(null)`.
   - `AuthProvider` component:
     - State: `user` (UserResponse | null), `isLoading` (boolean, default true).
     - `useEffect` on mount:
       a. Call `setTokenProvider(() => getAccessToken())` to wire the API client.
       b. Call `setOnUnauthorized(() => performLogout())` to wire logout on unrecoverable 401.
       c. If `getAccessToken()` exists, call `getProfile()` to hydrate user. On success set user. On failure (any error), call `clearTokens()`.
       d. Set `isLoading = false`.
     - `login` function: call API `loginApi({ email, password })`, `setTokens(...)`, set user from response.
     - `register` function: call API `registerApi({ name, email, password, filiation })`, `setTokens(...)`, set user from response.
     - `logout` function (`performLogout`): `clearTokens()`, `setTokenProvider(null)`, set user to null, `router.push("/login")`.
     - Derive `isAuthenticated = user !== null`.
     - Render `<AuthContext.Provider value={...}>{children}</AuthContext.Provider>`.
   - Export `useAuth()` hook that reads context and throws if used outside provider.

4. **Create route protection hooks** — 
   - `src/lib/auth/use-require-auth.ts`: `"use client"`. Calls `useAuth()`. If `!isLoading && !isAuthenticated`, redirect to `/login` via `useRouter().replace("/login")`. Returns `{ user, isLoading }`. While loading, returns `isLoading: true` so pages can show a loading state.
   - `src/lib/auth/use-redirect-if-authenticated.ts`: `"use client"`. Calls `useAuth()`. If `!isLoading && isAuthenticated`, redirect to `/` via `useRouter().replace("/")`. Returns `{ isLoading, isAuthenticated }`.

5. **Create barrel export** — `src/lib/auth/index.ts`: re-export `AuthProvider`, `useAuth` from `./auth-context`, `useRequireAuth` from `./use-require-auth`, `useRedirectIfAuthenticated` from `./use-redirect-if-authenticated`.

6. **Create Providers wrapper** — `src/app/providers.tsx`:
   - `"use client"` directive.
   - Import `AuthProvider` from `@/lib/auth`.
   - Render `<AuthProvider>{children}</AuthProvider>`.

7. **Wire Providers into root layout** — Modify `src/app/layout.tsx`:
   - Import `Providers` from `./providers`.
   - Wrap `{children}` inside `<body>` with `<Providers>{children}</Providers>`.

8. **Refactor login page** — Modify `src/app/(auth)/login/page.tsx`:
   - Import `useAuth` from `@/lib/auth` and `useRedirectIfAuthenticated` from `@/lib/auth`.
   - Call `useRedirectIfAuthenticated()` at top of component. If `isLoading`, render null or spinner. If `isAuthenticated`, render null (redirect in progress).
   - Replace manual `setTokens` + `setTokenProvider` + `router.push("/")` with `await auth.login(email, password)` followed by `router.push("/")`.
   - Remove direct imports of `setTokens`, `setTokenProvider`, `getAccessToken` (now handled by context).

9. **Refactor register page** — Modify `src/app/(auth)/register/page.tsx`:
   - Same pattern as login: `useRedirectIfAuthenticated()`, replace manual token handling with `await auth.register(name, email, password, filiation)` then `router.push("/")`.
   - Remove direct imports of `setTokens`, `setTokenProvider`, `getAccessToken`.

10. **Apply useRequireAuth to home page** — Modify `src/app/page.tsx` to be a `"use client"` component that calls `useRequireAuth()`. If `isLoading`, show a loading indicator. This proves the guard works and ensures the home page is protected.

## Verification

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Lint
npm run lint
```

Manual checks (reviewer runs these grep commands):

```bash
# AuthProvider wraps children in root layout
grep -n "Providers" src/app/layout.tsx

# setTokenProvider called in AuthProvider useEffect
grep -n "setTokenProvider" src/lib/auth/auth-context.tsx

# useRequireAuth exists and is used
grep -rn "useRequireAuth" src/

# Auth pages use redirect-if-authenticated
grep -n "useRedirectIfAuthenticated" src/app/\(auth\)/login/page.tsx
grep -n "useRedirectIfAuthenticated" src/app/\(auth\)/register/page.tsx

# 401 refresh+retry logic in client
grep -n "attemptRefresh\|refreshPromise" src/lib/api/client.ts

# Concurrent refresh deduplication
grep -n "refreshPromise" src/lib/api/client.ts
```

## Rollback

```bash
git checkout HEAD -- src/lib/api/client.ts src/lib/auth-storage.ts src/app/layout.tsx src/app/page.tsx "src/app/(auth)/login/page.tsx" "src/app/(auth)/register/page.tsx"
rm -rf src/lib/auth/ src/app/providers.tsx
```
