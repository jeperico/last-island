# State

## Position
Working on: REQ-3 (Auth state management — persist tokens, attach to requests, refresh flow) — PLANNED

## Decisions
- 2026-07-01: React 19 + Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- 2026-07-01: Deploy target = Vercel
- 2026-07-01: Minimal design first, theming in v2
- 2026-07-01: State management & WebSocket lib TBD (decide when needed)
- 2026-07-01: Monorepo structure — git root at ~/work/last-island, client lives at client/

## Blockers
(none)

## Last verification
PASS at 2026-07-01T13:53:06-03:00 — REQ-3: tsc --noEmit exit 0, npm run build compiled successfully (Turbopack, routes: /, /_not-found, /login, /register), npm run lint clean, all 6 manual grep checks pass
