# Requirements

## v1 (done)

- [x] REQ-1: Domain modeling (entities, enums, relationships, Flyway migrations)
- [x] REQ-2: User auth (register/login with JWT, Spring Security)
- [x] REQ-3: Game creation + matchmaking (friendly token join)
- [x] REQ-4: Ship placement with validation (fleet rules, no overlaps, within bounds)
- [x] REQ-5: Turn-based shooting (alternating turns, MISS/HIT/SUNK resolution)
- [x] REQ-6: Fog of war + win condition detection
- [x] REQ-7: SSE real-time events (opponent joined, ships placed, shot received, game over)
- [x] REQ-8: Full client (lobby, placement, battle, game-over screens)
- [x] REQ-9: Design system + One Piece dark nautical theme
- [x] REQ-10: Unit tests (domain rules: placement, shooting, win condition, fog of war)

## v2 (next)

- [ ] REQ-11: Deploy publicly accessible (service + client)
- [ ] REQ-12: Reconnection handling (rejoin mid-game after disconnect)
- [ ] REQ-13: Game history / replay
- [ ] REQ-14: Responsive mobile layout
- [ ] REQ-15: Sound effects / rank badges

## v3 (Challenge Part 2 — Optimization & Infrastructure)

- [ ] REQ-16: Observability — OTel Java Agent auto-instrumentation (HTTP, JDBC, JVM) on Spring Boot
- [ ] REQ-17: Observability — Custom Micrometer game metrics (active games, shots/min, SSE connections, haki usage)
- [ ] REQ-18: Observability — Custom spans on key business methods (fireShot, placeShips, haki actions)
- [ ] REQ-19: Observability — Local Docker Compose stack (Prometheus + Grafana + Tempo)
- [ ] REQ-20: Observability — Provisioned Grafana dashboards (RED metrics, JVM, HikariCP/DB, game metrics, slow queries panel)
- [ ] REQ-21: Observability — Prod wiring to Grafana Cloud (OTLP export via env vars on Render)
- [ ] REQ-22: Resilience — implement at least one of: caching / rate limiting / load testing / infra improvement
- [ ] REQ-23: Kubernetes — deploy app to local kind cluster, 2 replicas, Ingress/LoadBalancer, sticky sessions
