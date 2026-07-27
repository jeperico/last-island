# State

## Position

Planned — Challenge Part 2, Task 1: Observability infra setup (OTel Java Agent + custom metrics/spans + local Docker Compose: Prometheus + Grafana + Tempo). PLAN.md written, ready for implementation.

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change
- Turn timer = 20s; expiration skips turn (no W.O.); W.O. only via surrender
- Observability: OTel Java Agent (no standalone Collector) — agent exports directly via OTLP, both locally (to local Tempo/Prometheus) and in prod (to Grafana Cloud)
- Observability metrics/traces routed through OTLP HTTP protocol; no Grafana Alloy, no vendor agent
- Grafana Cloud creds: instance ID 1739097, region prod-sa-east-1, OTLP endpoint https://otlp-gateway-prod-sa-east-1.grafana.net/otlp (API key held by user, not in repo)
- Custom game metrics required: active games gauge, shots/min counter, SSE connections gauge, haki usage counters
- Custom spans required: fireShot, placeShips, haki actions (observation/armament/conqueror's)
- Slow query visibility: dedicated Grafana panel, not just ad-hoc trace filtering
- Deliverable bar for observability: instrumentation code + screenshots/evidence (local first, then prod), no requirement for live-reviewable dashboard access
- OTel Java Agent JAR committed to repo at `service/otel/opentelemetry-javaagent.jar`, attached via `-javaagent` flag in Dockerfile/run config
- Local observability stack in separate `docker-compose.observability.yml`; `make up` starts Postgres + observability together; new `make up-obs` target starts observability stack only
- Custom metrics v1: active_games gauge (phase=IN_PROGRESS count), shots_fired_total counter, sse_connections_active gauge (game + lobby emitters), haki_usage_total counter tagged by haki type
- Tempo local storage: persisted via Docker volume (not ephemeral) — traces survive `docker compose down`
- Grafana dashboards: auto-provisioned JSON via Grafana provisioning directory, loaded automatically on `docker compose up`

## Blockers

(none)

## Last verification

PASS at 2026-07-27T10:25 — build clean (170/176 pass, 6 pre-existing HakiConquerorsServiceTest failures), all 11 verification checks green, Grafana 5 dashboards auto-provisioned, OTel agent v2.30.0 loads, actuator/prometheus serves custom metrics (active_games, shots_fired_total, sse_connections_active), Tempo ready, Docker Compose up/down/up-obs/down-obs all functional
