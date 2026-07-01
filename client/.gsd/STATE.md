# State

## Position
Working on: MVP Fixes (API URL, CORS proxy, JoinGameResponse type) — DONE

## Decisions
- 2026-07-01: React 19 + Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- 2026-07-01: Deploy target = Vercel
- 2026-07-01: Minimal design first, theming in v2
- 2026-07-01: State management & WebSocket lib TBD (decide when needed)
- 2026-07-01: Monorepo structure — git root at ~/work/last-island, client lives at client/

## Blockers
(none)

## Last verification
PASS at 2026-07-01T14:49:20-03:00 — MVP Fixes: tsc --noEmit exit 0, npm run build compiled successfully (Turbopack), npm run lint clean, 8/8 grep assertions pass
