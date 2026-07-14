# Add Battle Detail Modal to Battle Log

## Objective

Create a modal/dialog component that opens when clicking a Battle Log entry on the dashboard, showing detailed battle stats (result, opponent, shots fired, ships sunk, duration, date) in a themed One Piece card layout.

## Files to touch

### Frontend
- **create** `client/src/components/ui/modal.tsx` — reusable modal/dialog component with backdrop, close button, and animation
- **modify** `client/src/components/ui/index.ts` — export Modal
- **create** `client/src/components/battle-detail-modal.tsx` — Battle Detail Modal content (stats layout with themed styling)
- **modify** `client/src/app/page.tsx` — add state for selected battle log entry, open modal on click, render BattleDetailModal

## Steps

1. **Modal component**: Create `client/src/components/ui/modal.tsx`:
   - Props: `open: boolean`, `onClose: () => void`, `title?: string`, `children: ReactNode`
   - Renders a fixed overlay (backdrop with bg-black/60) + centered panel
   - Uses `<dialog>` element or a div with role="dialog" and aria-modal
   - Close on backdrop click and Escape key
   - Close button (×) in top-right corner
   - Smooth fade-in animation via Tailwind classes
   - Accessible: focus trap not required for v1, but aria-labels present

2. **Export Modal**: Add `export { Modal } from "./modal";` to `client/src/components/ui/index.ts`.

3. **BattleDetailModal component**: Create `client/src/components/battle-detail-modal.tsx`:
   - Props: `entry: BattleLogEntryResponse | null`, `open: boolean`, `onClose: () => void`
   - Layout: Modal wrapping a Card with:
     - Header: Result badge (VICTORY green / DEFEAT red) + "vs {opponentName}"
     - Stats grid (2x2 or 2x3): 🎯 Shots Fired, 🚢 Ships Sunk, ⏱️ Duration, 📅 Date
     - Each stat in a mini-card with emoji icon, label, and value
   - One Piece themed language ("Cannonballs Fired", "Vessels Sunk", "Battle Duration", "Date of Clash")

4. **Dashboard integration**: In `client/src/app/page.tsx`:
   - Add `const [selectedBattle, setSelectedBattle] = useState<BattleLogEntryResponse | null>(null);`
   - On battle log entry click: `onClick={() => setSelectedBattle(entry)}`
   - Render `<BattleDetailModal entry={selectedBattle} open={!!selectedBattle} onClose={() => setSelectedBattle(null)} />` at the bottom of the page component

## Verification

```bash
# Frontend build
cd client && npm run build

# Frontend lint
cd client && npm run lint
```

Manual checks:
- Click a battle log entry → modal opens with correct stats
- Click backdrop or × button → modal closes
- Press Escape → modal closes
- Modal shows VICTORY in green / DEFEAT in red
- Stats are readable and themed

## Rollback

```bash
git checkout -- client/src/components/ui/modal.tsx client/src/components/ui/index.ts client/src/components/battle-detail-modal.tsx client/src/app/page.tsx
```
