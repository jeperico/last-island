# State

## Position
Idle — design system and theming complete. All MVP features implemented and committed.

## Decisions
- 2026-07-01: React 19 + Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- 2026-07-01: Deploy target = Vercel
- 2026-07-01: Monorepo structure — git root at ~/work/last-island, client lives at client/
- 2026-07-01: Design system — zero new dependencies, pure Tailwind CSS 4 custom components, 9 UI primitives in src/components/ui/
- 2026-07-01: Dark-only theme — deep ocean navy palette, gold primary, no light mode
- 2026-07-01: One Piece personality in waiting screens, game-over panel, copy

## Blockers
(none)

## Last verification
PASS at 2026-07-01T17:42-03:00 — tsc --noEmit exit 0, npm run build compiled successfully, npm run lint clean
