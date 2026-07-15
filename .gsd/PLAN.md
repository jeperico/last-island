# Fix avatar fallback + Add Doflamingo

## Objective

Fix the broken default avatar image for marines/null-avatar users and add Doflamingo as a 7th pirate avatar option across backend enum, frontend selection UIs, and audio placeholders.

## Files to touch

- `service/src/main/java/com/last_island/api/domain/user/enums/Avatar.java` — modify (add DOFLAMINGO)
- `client/src/components/ui/avatar-icon.tsx` — modify (add onError fallback to prevent broken images)
- `client/public/avatars/default/profile.jpg` — create (placeholder default avatar image)
- `client/src/app/settings/page.tsx` — modify (add Doflamingo to AVATAR_OPTIONS, update getAvatarImage fallback)
- `client/src/app/(auth)/register/page.tsx` — modify (add Doflamingo to AVATAR_OPTIONS)
- `client/public/avatars/doflamingo/laugh.mp3` — create (silent placeholder)
- `client/public/avatars/doflamingo/scream.mp3` — create (silent placeholder)
- `client/public/avatars/doflamingo/soundtrack.mp3` — create (silent placeholder)

## Steps

1. **Add DOFLAMINGO to backend Avatar enum** — Append `DOFLAMINGO` to the comma-separated list in `Avatar.java`. No DB migration needed (column is VARCHAR(20), "DOFLAMINGO" = 10 chars).

2. **Create default avatar fallback image** — Create `client/public/avatars/default/profile.jpg`. Generate a minimal valid JPEG file (a simple colored circle or anchor silhouette on dark background). This is the image served when a user has no avatar (marines, null avatar).

3. **Add onError handler to AvatarIcon** — In `avatar-icon.tsx`, add an `onError` handler on the `<img>` tag that hides the broken image or replaces src with an inline data URI fallback (a colored circle). This provides defense-in-depth if the default file ever goes missing again.

4. **Add Doflamingo to settings page AVATAR_OPTIONS** — Append `{ key: "DOFLAMINGO", name: "Doflamingo", image: "/avatars/doflamingo/profile.jpg" }` to the array in `client/src/app/settings/page.tsx`. Also update `getAvatarImage()` fallback to use `/avatars/default/profile.jpg` instead of hardcoded luffy path.

5. **Add Doflamingo to register page AVATAR_OPTIONS** — Append the same entry `{ key: "DOFLAMINGO", name: "Doflamingo", image: "/avatars/doflamingo/profile.jpg" }` to the array in `client/src/app/(auth)/register/page.tsx`.

6. **Create silent audio placeholders for Doflamingo** — Create `client/public/avatars/doflamingo/{laugh.mp3, scream.mp3, soundtrack.mp3}` using the same minimal valid MP3 pattern (363-byte silent files) used by other avatars.

## Verification

```bash
# Backend tests pass (79 tests)
cd service && ./mvnw test -q

# Frontend builds successfully
cd client && npm run build

# Default avatar file exists
ls client/public/avatars/default/profile.jpg

# Doflamingo audio placeholders exist
ls client/public/avatars/doflamingo/laugh.mp3
ls client/public/avatars/doflamingo/scream.mp3
ls client/public/avatars/doflamingo/soundtrack.mp3

# Frontend lint (expect only pre-existing issues)
cd client && npm run lint
```

Manual checks:
- Load app as marine user → avatar image renders correctly (not broken)
- Load settings page as pirate → 7 avatars shown in grid, Doflamingo selectable
- Load register page → select Pirate filiation → 7 avatars shown, Doflamingo selectable

## Rollback

```bash
git checkout -- service/src/main/java/com/last_island/api/domain/user/enums/Avatar.java
git checkout -- client/src/components/ui/avatar-icon.tsx
git checkout -- client/src/app/settings/page.tsx
git checkout -- "client/src/app/(auth)/register/page.tsx"
rm -f client/public/avatars/default/profile.jpg
rm -f client/public/avatars/doflamingo/laugh.mp3
rm -f client/public/avatars/doflamingo/scream.mp3
rm -f client/public/avatars/doflamingo/soundtrack.mp3
```
