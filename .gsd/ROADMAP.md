# Roadmap

## Done

- Domain modeling + Flyway migrations (2026-06-30) — bf21f92, 335ad6e
- User auth with JWT (2026-06-30) — 8aa07d4
- Game creation + matchmaking (2026-06-30) — f7c9c4c
- Ship placement with validation (2026-06-30) — 7b0b49d
- Turn-based shooting mechanics (2026-07-01) — f2734fa
- Fog of war + win condition (2026-07-01) — 193eca4
- Full client: lobby, placement, battle, game-over (2026-07-01) — 076e401..63e3970
- Design system + dark nautical theme (2026-07-01) — d624378
- One Piece themed screens + stats card (2026-07-01) — ff1b701
- Zod + react-hook-form validation (2026-07-02) — 627e86c
- SSE real-time communication backend (2026-07-06) — 7552f20
- SSE client integration (2026-07-06) — 29f2f02, 9ce95dc
- Migrate JWT storage to httpOnly cookies (2026-07-13)
- Replace Next.js rewrites with App Router route handler proxy (2026-07-13)
- Battle Log / game history (2026-07-13)
- Ranking leaderboard with bounty-based sorting (2026-07-13)
- Dashboard 60/40 two-column grid layout (2026-07-13)
- Battle detail modal with boards (2026-07-14)
- Lobby SSE — auto-update available battles (2026-07-14)
- Battle expiration timers (turn 120s + game 30min) (2026-07-14) — c79db6e
- Leaderboard UI improvements: table layout, scrollbar, bounty formula (2026-07-14) — c79db6e
- Refactor img tags to Next.js Image component (2026-07-21) — 747721a
- Deploy publicly accessible: backend + DB on Render (Dockerfile), client on Vercel (2026-07-22)
- Reveal opponent ships on game-over, fix ships sunk count (2026-07-24) — d9356d1, c8f8ca7
- Improve leaderboard podium (2-1-3, medals), profile modal position (2026-07-24) — 8accaa9
- Responsive game-over modal boards (2026-07-24) — c9369b8
- Global floating sound toggle (2026-07-24) — 9f1a875
- 20s turn timer, skip turn on expiration, W.O. only via surrender (2026-07-24) — 8b66d23
- Responsive mobile layout for all pages (2026-07-27) — e6fbc0b

## Next

1. Observability — OTel instrumentation + custom game metrics + local Grafana/Prometheus/Tempo stack + dashboards
2. Observability — Prod wiring to Grafana Cloud (Render)
3. Resilience improvement (caching / rate limiting / load test / infra)
4. Kubernetes deployment (kind, 2 replicas, Ingress, sticky sessions)
