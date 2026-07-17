# Frontend Haki Profile / Skill Tree Page

## Objective

Add a `/haki` page where authenticated players can view their Haki skill tree (3 branches: Observation, Armament, Conqueror's), see available points, and spend points to upgrade abilities — with Conqueror's locked behind prerequisite logic.

## Files to touch

- **create** `client/src/lib/api/haki.ts` — API client functions (getHakiProfile, upgradeHaki)
- **modify** `client/src/interfaces/api.ts` — Add HakiProfileResponse and HakiUpgradeRequest interfaces
- **modify** `client/src/types/game.ts` — Add HakiType union type
- **modify** `client/src/lib/api/index.ts` — Add barrel exports for haki functions and new types
- **create** `client/src/app/haki/page.tsx` — Haki skill tree page
- **modify** `client/src/app/page.tsx` — Add navigation link to /haki in lobby header

## Steps

1. **Add HakiType to types/game.ts**
   Append at end of file:
   ```ts
   export type HakiType = "OBSERVATION" | "ARMAMENT" | "CONQUERORS";
   ```

2. **Add interfaces to interfaces/api.ts**
   Add at the bottom (after LeaderboardResponse):
   ```ts
   // ─── Haki ─────────────────────────────────────────────────────────────────────

   export interface HakiProfileResponse {
     hakiPoints: number;
     hakiPointsAvailable: number;
     observationLevel: number;
     armamentLevel: number;
     conquerorsLevel: number;
     bountyMilestonesReached: number;
   }

   export interface HakiUpgradeRequest {
     hakiType: HakiType;
     targetLevel: number;
   }
   ```
   Add `HakiType` to the imports from `@/types` at the top.

3. **Create client/src/lib/api/haki.ts**
   ```ts
   import { apiGet, apiPost } from "./client";
   import type { HakiProfileResponse, HakiUpgradeRequest } from "./types";

   export function getHakiProfile(): Promise<HakiProfileResponse> {
     return apiGet<HakiProfileResponse>("/api/haki/profile");
   }

   export function upgradeHaki(data: HakiUpgradeRequest): Promise<HakiProfileResponse> {
     return apiPost<HakiProfileResponse>("/api/haki/upgrade", data);
   }
   ```

4. **Update barrel export (lib/api/index.ts)**
   - Add `export { getHakiProfile, upgradeHaki } from "./haki";` to function exports
   - Add `HakiProfileResponse`, `HakiUpgradeRequest`, `HakiType` to the type export list

5. **Create client/src/app/haki/page.tsx**
   A `"use client"` page component with:
   - `useRequireAuth()` guard with Spinner loading state
   - `useEffect` fetching `getHakiProfile()` on mount into state
   - Three branch cards (Observation 👁, Armament ✊, Conqueror's 👑):
     - Each shows branch name, icon, current level (0–3), level pips (filled vs empty circles)
     - Description text per branch
     - Upgrade button showing cost (disabled if insufficient points or wrong level)
     - For Conqueror's: locked overlay with prerequisite text ("Requires Observation Lv1 + Armament Lv1 + one Awakening (Lv3)") when conditions not met
   - Available points counter displayed prominently at top
   - Error Alert for failed API calls
   - Back link "← Grand Line" to `/` (same pattern as settings page)
   - Upgrade flow: click upgrade → API call → update local state from response → show error if rejected
   - Point cost constants: `OBSERVATION_COSTS = [1, 1, 2]`, `ARMAMENT_COSTS = [1, 1, 2]`, `CONQUERORS_COSTS = [3, 3, 5]`
   - Conqueror's prerequisite check: `observationLevel >= 1 && armamentLevel >= 1 && (observationLevel >= 3 || armamentLevel >= 3)`
   - Visual styling: Card component for each branch, `bg-surface`/`bg-surface-elevated` backgrounds, `text-primary`/`text-secondary` accents, border for locked state, opacity reduction for locked Conqueror's
   - Responsive: single column on mobile, 3-column grid on lg+

6. **Add navigation link in lobby (page.tsx)**
   In the header `<div className="flex items-center gap-2">` section (around line 253), add a Link to `/haki` before the settings link:
   ```tsx
   <Link
     href="/haki"
     className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:bg-surface-secondary hover:text-primary transition-colors"
     aria-label="Haki"
   >
     👁
   </Link>
   ```

## Verification

```bash
cd client && npm run build
cd client && npx eslint src/app/haki/page.tsx src/lib/api/haki.ts src/interfaces/api.ts src/types/game.ts
grep -r "HakiProfileResponse\|HakiUpgradeRequest\|HakiType" client/src/
grep -r "/haki" client/src/app/page.tsx
cd service && mvn test -q
```

Manual checks:
- Visit `/haki` while authenticated → skill tree renders with 3 branches
- Verify Conqueror's shows locked state with prerequisite text when conditions not met
- Verify upgrade button is disabled when points are insufficient
- Visit `/` → verify 👁 icon link navigates to `/haki`

## Rollback

```bash
rm client/src/app/haki/page.tsx
rm client/src/lib/api/haki.ts
git checkout -- client/src/interfaces/api.ts client/src/types/game.ts client/src/lib/api/index.ts client/src/app/page.tsx
```
