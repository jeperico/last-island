# Add Haki Tutorial Modal on Home Page

## Objective

Create a one-time tutorial modal that teaches users how to spend their haki points, triggered on home page load when the user has available haki points and hasn't seen the tutorial before (localStorage flag).

## Files to touch

- **create** `client/src/components/haki-tutorial-modal.tsx` — new modal component with tutorial content
- **modify** `client/src/app/page.tsx` — add haki profile fetch, modal state, conditional render

## Steps

1. **Create `client/src/components/haki-tutorial-modal.tsx`**
   - Import `Modal` from `@/components/ui`
   - Import `Button` from `@/components/ui`
   - Import `Link` from `next/link`
   - Props: `{ open: boolean; onClose: () => void }`
   - On close handler: set `localStorage.setItem('last-island-haki-tutorial-seen', 'true')` then call `onClose`
   - Content layout (dark nautical style — `bg-surface-elevated rounded-xl p-6 border border-border`):
     - Title: "🧿 Haki Awakened!" (text-text-primary, text-xl font-bold)
     - Intro paragraph: explain haki points are earned from victories, can be spent to unlock combat abilities
     - 3-branch summary list with icons and per-branch accent colors:
       - 👁 Observation (text-blue-400) — reveals enemy ship positions during battle
       - 🦾 Armament (text-red-400) — strengthens your cannonballs with counter-fire
       - 👑 Conqueror's (text-purple-400) — unleashes an X-pattern attack on the field
     - CTA: `<Link href="/haki">` wrapped in a `<Button variant="primary" fullWidth>` — "Manage Your Haki →"
     - Dismiss text: "You can always access this from the 👁 icon in the header."

2. **Modify `client/src/app/page.tsx`**
   - Add import for `getHakiProfile` from `@/lib/api`
   - Add import for `HakiTutorialModal` from `@/components/haki-tutorial-modal`
   - Add state: `const [hakiTutorialOpen, setHakiTutorialOpen] = useState(false)`
   - Inside the existing `useEffect` that fetches games (the one guarded by `if (isLoading || !user) return`), after the battle log fetch, add:
     ```ts
     try {
       const hakiProfile = await getHakiProfile();
       if (!cancelled && hakiProfile.hakiPointsAvailable > 0) {
         const seen = localStorage.getItem('last-island-haki-tutorial-seen');
         if (!seen) {
           setHakiTutorialOpen(true);
         }
       }
     } catch {
       // Haki tutorial check is non-critical, silently ignore
     }
     ```
   - At the bottom of the JSX return (after the `GameOverPanel`), add:
     ```tsx
     <HakiTutorialModal
       open={hakiTutorialOpen}
       onClose={() => setHakiTutorialOpen(false)}
     />
     ```

## Verification

1. `cd client && npx next build` — must exit 0 (no type or build errors)
2. `cd client && npx eslint src/components/haki-tutorial-modal.tsx src/app/page.tsx` — no lint errors
3. `grep -c "last-island-haki-tutorial-seen" client/src/components/haki-tutorial-modal.tsx` — must be ≥ 1 (localStorage write on close)
4. `grep -c "hakiPointsAvailable" client/src/app/page.tsx` — must be ≥ 1 (condition check)
5. `grep -c "HakiTutorialModal" client/src/app/page.tsx` — must be ≥ 2 (import + render)
6. `grep -c "getHakiProfile" client/src/app/page.tsx` — must be ≥ 2 (import + call)
7. `grep -c "bg-surface-elevated" client/src/components/haki-tutorial-modal.tsx` — must be ≥ 1 (design system token)
8. `grep -c "/haki" client/src/components/haki-tutorial-modal.tsx` — must be ≥ 1 (link to skill tree page)
9. `grep -c "Modal" client/src/components/haki-tutorial-modal.tsx` — must be ≥ 2 (import + usage)
10. `grep "text-blue-400\|text-red-400\|text-purple-400" client/src/components/haki-tutorial-modal.tsx | wc -l` — must be ≥ 3 (per-branch colors)

## Rollback

```sh
rm client/src/components/haki-tutorial-modal.tsx
git checkout -- client/src/app/page.tsx
```
