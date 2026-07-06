# State

## Position
Idle — last task completed and committed (modularize src/). Awaiting next task.

## Decisions
- 2026-07-01: React 19 + Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- 2026-07-01: Deploy target = Vercel
- 2026-07-01: Monorepo structure — git root at ~/work/last-island, client lives at client/
- 2026-07-01: Design system — zero new dependencies, pure Tailwind CSS 4 custom components, 9 UI primitives in src/components/ui/
- 2026-07-01: Dark-only theme — deep ocean navy palette, gold primary, no light mode
- 2026-07-01: One Piece personality in waiting screens, game-over panel, copy
- 2026-07-06: Modularized src/ — types in src/types/, interfaces in src/interfaces/, styles in src/styles/, favicon in public/

## Blockers
(none)

## Last verification
PASS at 2026-07-06T11:25-03:00 — tsc clean, build OK (Next.js 16.2.9 Turbopack), lint 0 errors (1 pre-existing warning), src/app/ has no globals.css or favicon.ico, public/favicon.ico exists, @/lib/api/types barrel re-exports resolve for all 9 consumers
