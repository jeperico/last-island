# State

## Position

Idle — ready for next task.

## Decisions

- BountyService.computeRank will be a public method (possibly static) to allow reuse in AuthService without circular dependency
- Keep rank as String (VARCHAR) in DB — no enum migration needed, just store `.name()` of the enum values
- Starting bounty = 1000 (maps to SUPER_ROOKIE/CAPTAIN tier, not ROOKIE/SEAMAN)
- K-factor = 32, bounty floor = 0
- CANCELLED games (game expiration, PLACING_SHIPS surrender) = no bounty change
- Turn timer = 20s; expiration skips turn (no W.O.); W.O. only via surrender
- Observability: OTel Java Agent (no standalone Collector) — agent exports directly via OTLP
- Custom game metrics: active games gauge, shots/min counter, SSE connections gauge, haki usage counters
- Custom spans: fireShot, placeShips, haki actions
- OTel Java Agent JAR committed to repo at `service/otel/opentelemetry-javaagent.jar`
- Local observability stack in separate `docker-compose.observability.yml`
- Grafana dashboards: auto-provisioned JSON via provisioning directory
- Reverted responsive mobile layout commit (e6fbc0b) and responsive game-over commit (c9369b8)

## Blockers

(none)

## Last verification

(none — pipeline cleared)
