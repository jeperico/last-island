# Add Zod + react-hook-form validation to all forms & fix "Refresh failed" leak

## Objective

Wire up Zod validation schemas with react-hook-form across all 3 client forms (login, register, join-game) for inline field-level errors, and harden the auth hydration path so "Refresh failed" never surfaces to the user.

## Files to touch

- `src/lib/validations/login.ts` — **create** — Zod schema + inferred type for login form
- `src/lib/validations/register.ts` — **create** — Zod schema + inferred type for register form
- `src/lib/validations/join-game.ts` — **create** — Zod schema + inferred type for join-game token
- `src/app/(auth)/login/page.tsx` — **modify** — replace useState form with useForm + zodResolver, inline errors
- `src/app/(auth)/register/page.tsx` — **modify** — replace useState form with useForm + zodResolver, setValue/watch for filiation, remove hidden radio
- `src/app/page.tsx` — **modify** — replace useState joinToken with useForm + zodResolver for the token input
- `src/lib/auth/auth-context.tsx` — **modify** — skip hydration (getProfile) when on /login or /register path; clear stale tokens upfront instead of attempting refresh

## Steps

1. **Verify deps are installed** — confirm `node_modules/zod`, `node_modules/react-hook-form`, and `node_modules/@hookform/resolvers` exist (they are already in package.json). If missing, run `npm install` (no new deps to add).

2. **Create `src/lib/validations/login.ts`**
   - Export `loginSchema` — Zod object: `email` (string, email format, "Valid email required"), `password` (string, min 1, "Password is required").
   - Export inferred type `LoginFormData`.

3. **Create `src/lib/validations/register.ts`**
   - Export `registerSchema` — Zod object: `name` (string, min 1, "Name is required"), `email` (string, email format), `password` (string, min 8, "Password must be at least 8 characters"), `filiation` (enum ["PIRATE", "MARINE"], "Choose your filiation").
   - Export inferred type `RegisterFormData`.

4. **Create `src/lib/validations/join-game.ts`**
   - Export `joinGameSchema` — Zod object: `token` (string, min 1, "Please enter a game token").
   - Export inferred type `JoinGameFormData`.

5. **Refactor login form (`src/app/(auth)/login/page.tsx`)**
   - Remove `FormData` interface and `useState` for formData.
   - Import `useForm` from react-hook-form, `zodResolver` from `@hookform/resolvers/zod`, and `loginSchema`.
   - Call `useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })`.
   - Destructure `register, handleSubmit, formState: { errors }`.
   - Replace `onChange` handlers with `{...register('email')}` and `{...register('password')}` spread on Input (keep `id` prop separate for label association).
   - Pass `error={errors.email?.message}` / `error={errors.password?.message}` to Input components.
   - Wrap form onSubmit with RHF's `handleSubmit(onValid)`.
   - In `onValid`: keep existing `auth.login()` call, keep `loading` state, keep server-error Alert for API errors.
   - In catch block: only set server error if `err` is an `ApiError` (i.e., has `status` property). If the error is a plain Error (like "Refresh failed"), ignore it — the auth context already handles logout/redirect.

6. **Refactor register form (`src/app/(auth)/register/page.tsx`)**
   - Remove `FormData` interface and `useState` for formData.
   - Import `useForm`, `zodResolver`, `registerSchema`.
   - Call `useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })`.
   - Destructure `register, handleSubmit, setValue, watch, formState: { errors }`.
   - Use `const filiation = watch('filiation')` for the emoji button highlight state.
   - Emoji buttons call `setValue('filiation', 'PIRATE', { shouldValidate: true })` / `setValue('filiation', 'MARINE', { shouldValidate: true })`.
   - Remove the hidden `<input type="radio">` entirely — Zod enum validation replaces browser required.
   - Show filiation error below fieldset: `{errors.filiation && <p className="text-xs text-danger mt-1">{errors.filiation.message}</p>}`.
   - Spread `{...register('name')}`, `{...register('email')}`, `{...register('password')}` on respective Inputs, pass field errors.
   - Same API-error handling pattern as login (only show if `err` has `status`).

7. **Refactor join-game in lobby (`src/app/page.tsx`)**
   - Remove `useState` for joinToken.
   - Import `useForm`, `zodResolver`, `joinGameSchema`.
   - Call `useForm<JoinGameFormData>({ resolver: zodResolver(joinGameSchema) })`.
   - Wrap the join-game section in a `<form onSubmit={handleSubmit(onJoin)}>` element.
   - Spread `{...register('token')}` on the token Input, pass `error={errors.token?.message}`.
   - In `onJoin`: call `joinGame(data.token.trim())`, existing error handling for API errors remains.

8. **Fix "Refresh failed" leak in `src/lib/auth/auth-context.tsx`**
   - In the `hydrate` function: before calling `getProfile()`, check if there is no access token in localStorage → if so, skip hydration entirely (just set `isLoading = false`).
   - In the `hydrate` catch block: call `clearTokens()` and set `user = null` and `isLoading = false` — do NOT re-throw or let error propagate. This already exists but ensure it's robust.
   - Key fix: in `performLogout` (the `onUnauthorizedCallback`), do NOT call `router.push("/login")` if `window.location.pathname` is already `/login` or `/register`. This prevents the redirect flash when hydration triggers a stale-token logout while already on an auth page.
   - This ensures that even if `attemptRefresh` throws "Refresh failed", the hydrate catch swallows it, stale tokens are cleared, and no visible side-effect reaches the user.

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
- Open `/login`, submit empty form → inline "Valid email required" and "Password is required" errors appear on fields
- Open `/register`, submit without filling anything → all 4 field errors appear inline (name, email, password, filiation)
- On `/register`, type password < 8 chars → "Password must be at least 8 characters" on blur/submit
- On `/register`, select a filiation emoji → error clears, aria-pressed updates correctly
- On lobby (`/`), click Join with empty token → inline "Please enter a game token" error
- Open `/login` with stale tokens in localStorage (set manually via DevTools) → no "Refresh failed" message appears, tokens are silently cleared
- Server-side errors (wrong password, duplicate email) still display in the top-level Alert, not inline

## Rollback

```bash
cd /home/perico/work/last-island/client
git checkout HEAD -- src/app/(auth)/login/page.tsx src/app/(auth)/register/page.tsx src/app/page.tsx src/lib/auth/auth-context.tsx
rm -rf src/lib/validations/
```
