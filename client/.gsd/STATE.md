# State

## Position
REQ-10 SSE integration — implemented and committed (29f2f02). All polling removed, real-time events active.

## Decisions
- 2026-07-01: React 19 + Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- 2026-07-01: Deploy target = Vercel
- 2026-07-01: Monorepo structure — git root at ~/work/last-island, client lives at client/
- 2026-07-01: Design system — zero new dependencies, pure Tailwind CSS 4 custom components, 9 UI primitives in src/components/ui/
- 2026-07-01: Dark-only theme — deep ocean navy palette, gold primary, no light mode
- 2026-07-01: One Piece personality in waiting screens, game-over panel, copy
- 2026-07-06: Modularized src/ — types in src/types/, interfaces in src/interfaces/, styles in src/styles/, favicon in public/
- 2026-07-06: Real-time communication = SSE (EventSource API), NOT WebSocket/STOMP. Backend serves SSE at GET /games/{token}/events?token=jwt. Events: CONNECTED, OPPONENT_JOINED, SHIPS_PLACED, SHOT_RECEIVED, GAME_OVER. Auto-reconnect built into EventSource spec (Last-Event-ID).

## Blockers
(none)

## Last verification
PASS at 2026-07-06T16:09-03:00 — tsc --noEmit exit 0, next build exit 0, no setInterval in game pages, all 7 PLAN.md checks green
