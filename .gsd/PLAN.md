# Frontend: Settings/Profile Page

## Objective

Create a `/settings` page with read-only profile stats, avatar selection (pirates only), filiation switch, and logout — wiring up the existing backend PUT /users/me endpoint with auth context refresh.

## Files to touch

- `client/src/interfaces/api.ts` — modify (add `avatar` field to `UserResponse` and `LeaderboardEntryResponse`)
- `client/src/interfaces/auth.ts` — modify (add `refreshUser` to `AuthContextValue`)
- `client/src/lib/auth/auth-context.tsx` — modify (implement `refreshUser` callback, expose in context value)
- `client/src/lib/api/client.ts` — modify (add `apiPut` function)
- `client/src/lib/api/users.ts` — modify (add `updateProfile` function)
- `client/src/lib/api/index.ts` — modify (re-export `updateProfile`)
- `client/src/app/settings/page.tsx` — create (the settings page)
- `client/src/app/page.tsx` — modify (add settings gear link in PageHeader actions)
- `client/public/avatars/luffy/profile.svg` — create (placeholder)
- `client/public/avatars/zoro/profile.svg` — create (placeholder)
- `client/public/avatars/robin/profile.svg` — create (placeholder)
- `client/public/avatars/chopper/profile.svg` — create (placeholder)
- `client/public/avatars/nami/profile.svg` — create (placeholder)
- `client/public/avatars/ace/profile.svg` — create (placeholder)

## Steps

1. **Add `avatar` field to frontend interfaces** (`client/src/interfaces/api.ts`)
   - Add `avatar: string | null;` to `UserResponse` (after `losses`)
   - Add `avatar: string | null;` to `LeaderboardEntryResponse` (after `bounty`, before `isCurrentUser`)

2. **Add `apiPut` to API client** (`client/src/lib/api/client.ts`)
   - Copy `apiPost` pattern, change method to `"PUT"`
   - Export `apiPut<T>(path: string, body?: unknown): Promise<T>`

3. **Add `updateProfile` API function** (`client/src/lib/api/users.ts`)
   - `export function updateProfile(data: { filiation?: Filiation | null; avatar?: string | null }): Promise<UserResponse>` 
   - Calls `apiPut<UserResponse>("/api/users/me", data)`
   - Import `apiPut` from `./client` and `UserResponse` + `Filiation` from `./types`

4. **Re-export `updateProfile`** (`client/src/lib/api/index.ts`)
   - Add `updateProfile` to the `users.ts` re-export line

5. **Add `refreshUser` to auth context interface** (`client/src/interfaces/auth.ts`)
   - Add `refreshUser: () => Promise<void>;` to `AuthContextValue`

6. **Implement `refreshUser` in auth context** (`client/src/lib/auth/auth-context.tsx`)
   - Add a `refreshUser` callback that calls `getProfile()` and calls `setUser(profile)`
   - Wrap in `useCallback` with no dependencies (like `login`)
   - Pass `refreshUser` in the context provider value object

7. **Create avatar placeholder SVGs** (`client/public/avatars/{name}/profile.svg`)
   - Create 6 minimal SVG files (one per character: luffy, zoro, robin, chopper, nami, ace)
   - Each SVG: 200×200 colored circle with character initial(s) in white text
   - Color palette per character:
     - luffy: #DD2222 (red), initial "L"
     - zoro: #228B22 (green), initial "Z"
     - robin: #6B3FA0 (purple), initial "R"
     - chopper: #FF69B4 (pink), initial "C"
     - nami: #FF8C00 (orange), initial "N"
     - ace: #FF4500 (red-orange), initial "A"

8. **Create settings page** (`client/src/app/settings/page.tsx`)
   - `"use client"` directive
   - Use `useRequireAuth()` guard pattern with Spinner fallback
   - Use `useAuth()` for `logout` and `refreshUser`
   - Import UI components: `PageHeader`, `Card`, `Badge`, `Button`, `Alert`, `Spinner`
   - Import `Link` from `next/link` for back navigation
   - Import `updateProfile` from `@/lib/api`
   - Define AVATAR_OPTIONS array: `[{ key: "LUFFY", name: "Luffy", image: "/avatars/luffy/profile.svg" }, ...]`
   - Layout: centered flex col with `max-w-3xl` container
   - PageHeader: title "⚙️ Settings", actions: back link `← Grand Line` pointing to `/`
   - **Profile section** (Card):
     - Avatar display: large (96px) circular `<img>` with current avatar image or generic placeholder
     - Name (h2), email (muted text)
     - Stats row: Badge for filiation, rank text, bounty formatted, W/L record
   - **Filiation switch section** (Card, title "Filiation"):
     - Two toggle buttons (Pirate 🏴‍☠️ / Marine ⚓) — selected has `border-primary ring-2 ring-primary`
     - If user is pirate and clicks marine: show Alert warning "Switching to Marine will clear your avatar and recalculate your rank"
     - On click: call `updateProfile({ filiation: newFiliation })`, then `refreshUser()`
     - Show loading state on the button during request
   - **Avatar selection section** (Card, title "Choose Your Avatar" — conditionally rendered only if `user.filiation === "PIRATE"`):
     - 3×2 (or 2×3 mobile) grid of avatar cards
     - Each card: circular `<img>` (64px), character name below, `cursor-pointer`
     - Selected card: `ring-2 ring-primary border-primary` styling
     - On click: call `updateProfile({ avatar: selectedKey })`, then `refreshUser()`
     - Show Spinner overlay on clicked card while saving
   - **Logout section** (bottom):
     - `<Button variant="danger">` calling `logout`
   - Error handling: catch API errors, display with `<Alert variant="error">`

9. **Add settings navigation to dashboard** (`client/src/app/page.tsx`)
   - Import `Link` from `next/link`
   - In PageHeader `actions` slot, add a gear/settings link before the Logout button
   - Render as: `<Link href="/settings" className="...">⚙️</Link>` or use a Button ghost variant wrapping a Link
   - Keep existing Logout button alongside it (wrapped in a flex gap container)

## Verification

```bash
cd client && npx next build
```
- Must pass with zero TypeScript errors

```bash
cd client && npx next lint
```
- Must not introduce new lint errors (pre-existing are acceptable)

Manual checks:
- Navigate to `/settings` while unauthenticated → redirects to `/login`
- Navigate to `/settings` while authenticated → shows profile data with filiation, rank, bounty, W/L
- As a pirate, avatar section visible with 6 options; clicking one calls PUT and updates display
- Switch filiation to Marine → warning shown, avatar section hides, rank updates
- Switch back to Pirate → avatar section reappears
- Logout button works
- Dashboard has gear icon linking to `/settings`
- After profile update, returning to dashboard shows updated data

## Rollback

```bash
cd client
rm -rf src/app/settings/
rm -rf public/avatars/
git checkout -- src/interfaces/api.ts src/interfaces/auth.ts src/lib/auth/auth-context.tsx src/lib/api/client.ts src/lib/api/users.ts src/lib/api/index.ts src/app/page.tsx
```
