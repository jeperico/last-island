# Plan

Observability Infrastructure — OTel Java Agent + Custom Metrics/Spans + Local Docker Compose Stack (Prometheus + Grafana + Tempo)

## Objective

Instrument the Spring Boot backend with OpenTelemetry auto-instrumentation (Java Agent), add custom Micrometer game metrics and manual OTel spans on key business methods, and provide a local Docker Compose observability stack with auto-provisioned Grafana dashboards.

## Files to touch

### Dependencies & Build
- modify `service/pom.xml` — add spring-boot-starter-actuator, micrometer-registry-prometheus, io.opentelemetry:opentelemetry-api
- modify `Dockerfile` — copy OTel agent JAR, add -javaagent flag to ENTRYPOINT
- modify `Makefile` — update `up` target to chain observability compose, add `up-obs` / `down-obs` targets, add -javaagent to `service-run`
- modify `service/.gitattributes` — add binary attribute for `otel/*.jar`

### OTel Agent
- create `service/otel/opentelemetry-javaagent.jar` — download and commit (implementer downloads latest stable v2.x from GitHub releases)

### Application Config
- modify `service/src/main/resources/application.properties` — add management.endpoints.web.exposure.include, management.prometheus.metrics.export.enabled
- modify `service/src/main/resources/application-dev.properties` — add OTLP trace exporter config (endpoint=http://localhost:4318), management.otlp.tracing.endpoint

### Instrumentation Code (new files)
- create `service/src/main/java/com/last_island/api/infrastructure/metrics/GameMetricsConfig.java` — @Configuration class registering active_games gauge (supplier from GameRepository.countByPhaseAndIsActiveTrue), shots_fired_total counter, sse_connections_active gauge (AtomicInteger), haki_usage_total counter (tagged by type)
- create `service/src/main/java/com/last_island/api/infrastructure/metrics/GameMetrics.java` — @Component helper class exposing increment/decrement methods for the counters/gauges (injected into services)

### Instrumentation Code (modifications)
- modify `service/src/main/java/com/last_island/api/domain/game/repository/GameRepository.java` — add `long countByPhaseAndIsActiveTrue(GamePhase phase)` method
- modify `service/src/main/java/com/last_island/api/domain/board/service/BoardService.java` — inject GameMetrics + OTel Tracer; add custom span + counter increment in fireShot(); add custom span in placeShips()
- modify `service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java` — inject GameMetrics + OTel Tracer; add custom span + haki_usage_total increment in activateObservation(), activateConquerors(), assignArmament()
- modify `service/src/main/java/com/last_island/api/infrastructure/sse/SseConnectionRegistry.java` — inject GameMetrics; call sseConnectionIncrement in register(), sseConnectionDecrement in remove()
- modify `service/src/main/java/com/last_island/api/infrastructure/sse/LobbySseRegistry.java` — inject GameMetrics; call sseConnectionIncrement in register(), sseConnectionDecrement in remove()

### Docker Compose Observability Stack
- create `docker-compose.observability.yml` — Prometheus, Grafana (port 3001 to avoid Next.js conflict), Tempo services with named volumes

### Observability Config Files
- create `observability/prometheus/prometheus.yml` — scrape config targeting host.docker.internal:8081/api/v1/actuator/prometheus
- create `observability/tempo/tempo.yml` — Tempo config with OTLP receiver (gRPC 4317, HTTP 4318), local storage at /var/tempo
- create `observability/grafana/provisioning/datasources/datasources.yml` — Prometheus + Tempo data source definitions
- create `observability/grafana/provisioning/dashboards/dashboard.yml` — file-based dashboard provider config
- create `observability/grafana/dashboards/red-metrics.json` — HTTP RED metrics dashboard (rate, errors, duration from http_server_requests metrics)
- create `observability/grafana/dashboards/jvm.json` — JVM dashboard (heap memory, GC, threads)
- create `observability/grafana/dashboards/hikaricp.json` — HikariCP connection pool dashboard
- create `observability/grafana/dashboards/game-metrics.json` — custom game metrics (active_games, shots_fired_total, sse_connections_active, haki_usage_total)
- create `observability/grafana/dashboards/slow-queries.json` — slow queries panel (TraceQL query for db.system=postgresql spans with high duration from Tempo)

## Steps

1. **Add Maven dependencies** to `service/pom.xml`:
   - `spring-boot-starter-actuator` (managed version)
   - `micrometer-registry-prometheus` (managed version, for /actuator/prometheus endpoint)
   - `io.opentelemetry:opentelemetry-api:1.40.0` (compile scope, for manual span creation — OTel Agent provides implementation at runtime)

2. **Add application properties**:
   - In `application.properties`: expose actuator endpoints (`management.endpoints.web.exposure.include=health,prometheus,info,metrics`), enable prometheus metrics
   - In `application-dev.properties`: configure OTLP trace export endpoint (`otel.exporter.otlp.endpoint=http://localhost:4318`, `otel.exporter.otlp.protocol=http/protobuf`). Note: these are JVM system properties passed via the agent, not Spring properties — they'll be set in JAVA_TOOL_OPTIONS or -D flags in the Makefile service-run target.

3. **Download OTel Java Agent JAR**:
   - Download from `https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar` to `service/otel/opentelemetry-javaagent.jar`
   - Update `service/.gitattributes` to mark `otel/*.jar binary`

4. **Create GameMetrics component** (`infrastructure/metrics/GameMetrics.java`):
   - @Component with constructor injection of MeterRegistry
   - Register `shots_fired_total` Counter
   - Register `haki_usage_total` Counter with `type` tag (observation/armament/conquerors)
   - Register `sse_connections_active` Gauge backed by AtomicInteger
   - Expose: `incrementShotsFired()`, `incrementHakiUsage(String type)`, `incrementSseConnections()`, `decrementSseConnections()`

5. **Create GameMetricsConfig** (`infrastructure/metrics/GameMetricsConfig.java`):
   - @Configuration class
   - Register `active_games` Gauge using Gauge.builder with a supplier that calls `gameRepository.countByPhaseAndIsActiveTrue(GamePhase.IN_PROGRESS)` — this polls on each scrape, no @Scheduled needed

6. **Add `countByPhaseAndIsActiveTrue` to GameRepository**:
   - Spring Data JPA derived query method: `long countByPhaseAndIsActiveTrue(GamePhase phase)`

7. **Instrument BoardService**:
   - Add constructor params: `GameMetrics gameMetrics`, `io.opentelemetry.api.trace.Tracer tracer` (obtained from `GlobalOpenTelemetry.get().getTracer("last-island")`)
   - In `fireShot()`: wrap core logic in a custom span `"BoardService.fireShot"` with attributes (gameToken, shooterName); call `gameMetrics.incrementShotsFired()` on success
   - In `placeShips()` (or equivalent deploy method): wrap in custom span `"BoardService.placeShips"` with attributes (gameToken, playerName)
   - Note: Tracer instantiation via static `GlobalOpenTelemetry.get().getTracer(...)` in a @Bean or directly in constructor. Prefer a @Bean in a config class that produces the Tracer, or use `GlobalOpenTelemetry.get()` inline. Since tests won't have the agent, `GlobalOpenTelemetry.get()` returns noop — safe.

8. **Instrument HakiBattleService**:
   - Add constructor params: `GameMetrics gameMetrics`
   - In `activateObservation()`: create span `"HakiBattleService.activateObservation"`; call `gameMetrics.incrementHakiUsage("observation")`
   - In `activateConquerors()`: create span `"HakiBattleService.activateConquerors"`; call `gameMetrics.incrementHakiUsage("conquerors")`
   - In `assignArmament()`: create span `"HakiBattleService.assignArmament"`; call `gameMetrics.incrementHakiUsage("armament")`
   - For spans: use same Tracer approach as BoardService

9. **Instrument SSE Registries**:
   - `SseConnectionRegistry`: add `GameMetrics` constructor param; call `gameMetrics.incrementSseConnections()` at end of `register()`, call `gameMetrics.decrementSseConnections()` at start of `remove(gameToken, userId)` (guard: only decrement if emitter actually existed)
   - `LobbySseRegistry`: same pattern — increment in `register()`, decrement in `remove()` (guard: only if emitter was present, use `emitters.remove()` return value)

10. **Update Dockerfile**:
    - In build stage: no changes needed (agent is pre-downloaded, not built)
    - In runtime stage: `COPY service/otel/opentelemetry-javaagent.jar /app/otel/opentelemetry-javaagent.jar`
    - Update ENTRYPOINT: `["java", "-javaagent:/app/otel/opentelemetry-javaagent.jar", "-jar", "app.jar"]`
    - Add ENV defaults for OTel config: `OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318`, `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`, `OTEL_SERVICE_NAME=last-island-api`, `OTEL_METRICS_EXPORTER=none` (metrics via Prometheus scrape, not OTLP)

11. **Update Makefile**:
    - Modify `service-run` target: prepend `JAVA_TOOL_OPTIONS="-javaagent:$(PWD)/service/otel/opentelemetry-javaagent.jar -Dotel.exporter.otlp.endpoint=http://localhost:4318 -Dotel.exporter.otlp.protocol=http/protobuf -Dotel.service.name=last-island-api -Dotel.metrics.exporter=none"` to the mvn command (export as env var)
    - Modify `up` target: `docker compose --env-file $(ENV_FILE) up -d && docker compose -f docker-compose.observability.yml up -d`
    - Modify `down` target: also bring down observability: `docker compose -f docker-compose.observability.yml down`
    - Add `up-obs` target: `docker compose -f docker-compose.observability.yml up -d`
    - Add `down-obs` target: `docker compose -f docker-compose.observability.yml down`

12. **Create docker-compose.observability.yml**:
    - `prometheus` service: image prom/prometheus:latest, port 9090, volume mount `./observability/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml`, extra_hosts `host.docker.internal:host-gateway`
    - `tempo` service: image grafana/tempo:latest, ports 4317 (gRPC) + 4318 (HTTP OTLP) + 3200 (Tempo API), volume mount config + named volume for `/var/tempo`, command `-config.file=/etc/tempo/tempo.yml`
    - `grafana` service: image grafana/grafana:latest, port 3001:3000 (avoids Next.js conflict), volume mounts for provisioning + dashboards dirs, environment GF_AUTH_ANONYMOUS_ENABLED=true + GF_AUTH_ANONYMOUS_ORG_ROLE=Admin (local dev only)
    - Named volumes: `tempo-data`

13. **Create observability config files**:
    - `observability/prometheus/prometheus.yml`: global scrape_interval 15s, scrape_configs job "spring-boot" targeting `host.docker.internal:8081` with metrics_path `/api/v1/actuator/prometheus`
    - `observability/tempo/tempo.yml`: server listen on 3200, distributor receivers (otlp gRPC+HTTP), storage backend local with path /var/tempo, compactor + memberlist configs as minimal
    - `observability/grafana/provisioning/datasources/datasources.yml`: Prometheus (url: http://prometheus:9090) + Tempo (url: http://tempo:3200) datasources
    - `observability/grafana/provisioning/dashboards/dashboard.yml`: provider with path /var/lib/grafana/dashboards, disableDeletion false

14. **Create Grafana dashboard JSON files** (5 dashboards):
    - `red-metrics.json`: Panels for request rate (`rate(http_server_requests_seconds_count[5m])`), error rate (status=5xx), p95/p99 duration (`histogram_quantile`)
    - `jvm.json`: Heap used/committed/max, GC pause time, thread count (live/daemon/peak)
    - `hikaricp.json`: Active connections, idle connections, pending threads, max pool size, connection acquire time
    - `game-metrics.json`: active_games gauge, shots_fired_total rate, sse_connections_active, haki_usage_total by type
    - `slow-queries.json`: Tempo TraceQL panel `{span.db.system="postgresql" && duration > 50ms}` showing slow DB queries, plus a table of longest spans

15. **Verify existing tests pass**: The new GameMetrics and Tracer dependencies in BoardService/HakiBattleService constructors will need corresponding @Mock declarations in existing test files. Since tests use `@ExtendWith(MockitoExtension.class)` with constructor injection or @InjectMocks, adding `@Mock GameMetrics gameMetrics` and `@Mock` for the Tracer (or using `GlobalOpenTelemetry.get().getTracer(...)` which returns noop without agent) should suffice. If using static Tracer acquisition (not injected), no test changes needed for Tracer. GameMetrics mock must be added to test constructors.

## Verification

```bash
# 1. Backend tests still pass (expect 170 pass, 6 known failures)
cd service && ./mvnw clean test

# 2. Docker Compose starts all services
make up
docker ps | grep -E "prometheus|grafana|tempo|lastisland-db"

# 3. Observability-only target works
make down
make up-obs
docker ps | grep -E "prometheus|grafana|tempo"
make down-obs

# 4. Service starts with OTel agent (check logs for agent banner)
make up
make service-run 2>&1 | head -50 | grep -i "opentelemetry"

# 5. Actuator/prometheus endpoint returns metrics
curl -s http://localhost:8081/api/v1/actuator/prometheus | head -20

# 6. Tempo is ready
curl -s http://localhost:3200/ready

# 7. Grafana loads with dashboards (port 3001)
curl -s http://localhost:3001/api/search | python3 -m json.tool | grep title

# 8. Grep for custom metrics in code
grep -r "MeterRegistry\|Counter\|Gauge\|GameMetrics" service/src/main/java --include="*.java"

# 9. Grep for custom spans in code
grep -r "opentelemetry\|Tracer\|Span" service/src/main/java --include="*.java"

# 10. Grep for javaagent in build/run config
grep -r "javaagent" Makefile Dockerfile

# 11. All 5 dashboards provisioned
ls observability/grafana/dashboards/*.json | wc -l
# Expected: 5
```

### Manual verification (not automatable):
- Open http://localhost:3001 (Grafana) → Dashboards → verify RED, JVM, HikariCP, Game Metrics, Slow Queries dashboards are listed
- Register/login and fire a shot → return to Grafana Explore → Tempo → search for traces with service.name=last-island-api → verify fireShot span appears
- Check Prometheus targets at http://localhost:9090/targets → spring-boot target should be UP

## Rollback

```bash
# Revert all changes (if uncommitted)
git checkout -- service/pom.xml Dockerfile Makefile service/src/main/resources/application.properties service/src/main/resources/application-dev.properties
git checkout -- service/src/main/java/com/last_island/api/domain/board/service/BoardService.java
git checkout -- service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java
git checkout -- service/src/main/java/com/last_island/api/infrastructure/sse/SseConnectionRegistry.java
git checkout -- service/src/main/java/com/last_island/api/infrastructure/sse/LobbySseRegistry.java
git checkout -- service/src/main/java/com/last_island/api/domain/game/repository/GameRepository.java
git checkout -- service/.gitattributes

# Remove new files
rm -rf service/otel/
rm -rf service/src/main/java/com/last_island/api/infrastructure/metrics/
rm -rf observability/
rm -f docker-compose.observability.yml

# Stop observability containers
docker compose -f docker-compose.observability.yml down -v 2>/dev/null || true
```
