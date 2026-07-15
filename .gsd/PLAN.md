# Frontend: Remove Marine/filiation concept

## Objective

Remove all traces of the Filiation/Marine concept from the frontend client to match the already-refactored backend that only accepts pirate fleets.

## Files to touch

- modify `client/src/types/game.ts` — delete `Filiation` type, `MarineRank` type, remove marine ShipType entries (BUSTER_CALL, WARSHIP, BATTLESHIP, CRUISER, CUTTER)
- modify `client/src/interfaces/api.ts` — remove `Filiation` from imports and from RegisterRequest, UserResponse, LeaderboardEntryResponse
- modify `client/src/interfaces/auth.ts` — remove `filiation` param from register signature
- modify `client/src/lib/api/types.ts` — remove re-exports of Filiation/MarineRank (they'll no longer exist in @/types)
- modify `client/src/lib/game/ship-config.ts` — delete MARINE_FLEET, delete getFleetForFiliation, remove marine entries from SHIP_SIZES and SHIP_DISPLAY_NAMES, rename PIRATE_FLEET to FLEET (keep PIRATE_FLEET as alias export for safety)
- modify `client/src/lib/game/index.ts` — remove MARINE_FLEET and getFleetForFiliation exports, add FLEET export
- modify `client/src/lib/validations/register.ts` — remove `filiation` field from Zod schema
- modify `client/src/lib/auth/auth-context.tsx` — remove filiation param from register callback, hardcode filiation removal from registerApi call
- modify `client/src/lib/api/users.ts` — remove Filiation import, remove filiation param from getLeaderboard, remove filiation from updateProfile
- modify `client/src/lib/api/index.ts` — remove Filiation, MarineRank type re-exports
- modify `client/src/app/(auth)/register/page.tsx` — remove allegiance fieldset, always show character select after form validation, remove filiation from register call
- modify `client/src/app/settings/page.tsx` — remove filiation card section, remove filiation badge, remove Filiation import, always show avatar section
- modify `client/src/app/page.tsx` — remove PIRATE/MARINE leaderboard tabs (keep single "Leaderboard" heading), remove leaderboardTab state, always fetch with no filiation filter, remove filiation prop from AvatarIcon calls
- modify `client/src/app/game/[token]/page.tsx` — remove `filiation={user.filiation}` prop from ShipPlacement
- modify `client/src/app/game/[token]/ship-placement.tsx` — remove filiation prop from interface, import PIRATE_FLEET (or FLEET) directly instead of getFleetForFiliation
- modify `client/src/components/ui/avatar-icon.tsx` — remove filiation prop, remove MARINE_FALLBACK, always use pirate fallback

## Steps

1. **types/game.ts**: Delete `Filiation` type alias, delete `MarineRank` type alias, remove the five marine ship type entries from `ShipType` union (keep only THOUSAND_SUNNY, MOBY_DICK, RED_FORCE, POLAR_TANG, STRIKER).

2. **interfaces/api.ts**: Remove `Filiation` from the import statement. Remove `filiation: Filiation` from `RegisterRequest`. Remove `filiation: Filiation` from `UserResponse`. Remove `filiation: Filiation` from `LeaderboardEntryResponse`.

3. **interfaces/auth.ts**: Remove `filiation: string` parameter from the `register` function signature in `AuthContextValue`.

4. **lib/api/types.ts**: The wildcard re-export from `@/types` will automatically stop exporting Filiation/MarineRank once they're deleted. No change needed unless explicit re-exports exist — verify and remove any explicit `Filiation` or `MarineRank` named re-exports.

5. **lib/game/ship-config.ts**: Remove Filiation from import. Delete MARINE_FLEET array. Delete marine entries from SHIP_SIZES (BUSTER_CALL, WARSHIP, BATTLESHIP, CRUISER, CUTTER). Delete marine entries from SHIP_DISPLAY_NAMES. Delete `getFleetForFiliation` function. Optionally export `PIRATE_FLEET` also as `FLEET`.

6. **lib/game/index.ts**: Remove `MARINE_FLEET` and `getFleetForFiliation` from the export statement of `./ship-config`.

7. **lib/validations/register.ts**: Remove the `filiation` field from `registerSchema`. Update `RegisterFormData` type accordingly (automatic via z.infer).

8. **lib/auth/auth-context.tsx**: Change `register` callback signature from `(name, email, password, filiation, avatar?)` to `(name, email, password, avatar?)`. In the function body, call `registerApi` without `filiation` field.

9. **lib/api/users.ts**: Remove `Filiation` from import. Change `getLeaderboard(filiation: string)` to `getLeaderboard()` — remove the query param. Change `updateProfile` to only accept `{ avatar?: string | null }` (drop filiation field).

10. **lib/api/index.ts**: Remove `Filiation` and `MarineRank` from the type export list.

11. **app/(auth)/register/page.tsx**: Remove `watch("filiation")`, remove the allegiance `<fieldset>` block entirely. Remove the conditional that only shows character select for pirates — always show character select on valid form submission. Remove filiation from the `auth.register(...)` call (just pass name, email, password, avatar).

12. **app/settings/page.tsx**: Remove `Filiation` import. Remove `savingFiliation` state. Remove `showMarineWarning` state. Delete `handleFiliationChange` function. Delete the entire "Filiation" `<Card>` section. Remove the `user.filiation === "PIRATE"` condition around avatar section (always show). Remove filiation badge from profile card.

13. **app/page.tsx**: Remove `leaderboardTab` state and its setter. Remove the three tab buttons (ALL/PIRATE/MARINE). Call `getLeaderboard()` with no argument. Remove `filiation` prop from all `<AvatarIcon>` usages. Remove the "Hide if viewing a filiation tab that doesn't match the user" logic in the user-position section.

14. **app/game/[token]/page.tsx**: Remove `filiation={user.filiation}` prop from the `<ShipPlacement>` component call.

15. **app/game/[token]/ship-placement.tsx**: Remove `Filiation` from imports. Remove `filiation` from `ShipPlacementProps` interface. Replace `getFleetForFiliation(filiation)` with direct import of `PIRATE_FLEET`. Update `useMemo` and `useState` initializers accordingly.

16. **components/ui/avatar-icon.tsx**: Remove `filiation` prop from `AvatarIconProps`. Delete `MARINE_FALLBACK` constant. Rename `PIRATE_FALLBACK` to `FALLBACK` (or keep name). Always use pirate fallback in component logic.

17. **Final grep**: Search the entire client/src for remaining references to `filiation`, `Filiation`, `MarineRank`, `MARINE_FLEET`, `getFleetForFiliation`, `BUSTER_CALL`, `WARSHIP`, `BATTLESHIP`, `CRUISER`, `CUTTER` and fix any stragglers.

## Verification

```bash
cd /home/perico/work/last-island/client && npm run build && npm run lint
```

- Build must pass with zero type errors.
- Lint must report no new errors (pre-existing warnings acceptable).
- `grep -ri "filiation\|MarineRank\|MARINE_FLEET\|getFleetForFiliation\|BUSTER_CALL\|WARSHIP\|BATTLESHIP\|CRUISER\|CUTTER" client/src/` must return zero matches (excluding comments if any).

## Rollback

```bash
cd /home/perico/work/last-island
git checkout -- client/
```
