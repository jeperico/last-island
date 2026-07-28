# Production Observability — Grafana Cloud Setup

## Architecture

```
┌─────────────────────────────┐
│  Render (Spring Boot)       │
│  + OTel Java Agent          │
│                             │
│  OTLP HTTP/protobuf ────────┼──▶  Grafana Cloud
│  (metrics + traces)         │     ├── Mimir (Prometheus)
└─────────────────────────────┘     ├── Tempo (Traces)
                                    └── Grafana (Dashboards)
```

The OTel Java Agent auto-instruments HTTP, JDBC, JVM, and HikariCP — exporting both metrics and traces via OTLP to Grafana Cloud. No local Prometheus/Tempo needed in production.

---

## Step 1: Render Environment Variables

Set these in your Render service dashboard (Settings → Environment):

| Variable | Value |
|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `https://otlp-gateway-prod-sa-east-1.grafana.net/otlp` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `http/protobuf` |
| `OTEL_EXPORTER_OTLP_HEADERS` | `Authorization=Basic <BASE64_TOKEN>` |
| `OTEL_SERVICE_NAME` | `last-island-api` |
| `OTEL_METRICS_EXPORTER` | `otlp` |
| `OTEL_TRACES_EXPORTER` | `otlp` |
| `OTEL_RESOURCE_ATTRIBUTES` | `deployment.environment=production` |

### Generate the BASE64_TOKEN

```bash
echo -n "1739097:<YOUR_GRAFANA_CLOUD_API_KEY>" | base64
```

Replace `<YOUR_GRAFANA_CLOUD_API_KEY>` with the API key from Grafana Cloud → My Account → API Keys (needs MetricsPublisher + TracesPublisher permissions).

---

## Step 2: Actuator (already configured)

The `application.properties` already exposes actuator metrics:

```properties
management.endpoints.web.exposure.include=health,prometheus,info
management.metrics.export.prometheus.enabled=true
```

In prod with OTLP export, metrics flow via OTel agent (not Prometheus scraping), so actuator is just a health check endpoint.

---

## Step 3: Import Dashboard to Grafana Cloud

1. Go to Grafana Cloud → Dashboards → Import
2. Upload `observability/grafana/dashboards/last-island.json`
3. On import, Grafana will ask you to map datasources:
   - **prometheus** → select your Grafana Cloud Prometheus (Mimir) datasource
   - **tempo** → select your Grafana Cloud Tempo datasource
4. Click Import

The dashboard will work identically — same PromQL queries, same panels.

### Alternative: Update UIDs in JSON

If you want to provision the dashboard via API, update these UIDs in `last-island.json`:

```json
// Find all instances of:
{ "type": "prometheus", "uid": "prometheus" }
{ "type": "tempo", "uid": "tempo" }

// Replace with your Grafana Cloud datasource UIDs (find them in Connections → Data Sources):
{ "type": "prometheus", "uid": "<your-mimir-uid>" }
{ "type": "tempo", "uid": "<your-tempo-uid>" }
```

---

## Step 4: Verify

After deploying with the env vars:

1. Check Render logs for OTel agent startup:
   ```
   [otel.javaagent] opentelemetry-javaagent - version: 2.x.x
   ```

2. Wait 1-2 minutes, then check Grafana Cloud:
   - Explore → Prometheus → query `up{service_name="last-island-api"}` → should return 1
   - Explore → Tempo → search for traces with `service.name = last-island-api`

3. Open the imported dashboard — all panels should populate.

---

## Step 5: Custom Metrics Available in Prod

These custom Micrometer metrics are exported via OTel agent's Micrometer bridge:

| Metric | Type | Description |
|---|---|---|
| `active_games` | Gauge | Games in IN_PROGRESS phase |
| `sse_connections_active` | Gauge | Active SSE emitters |
| `shots_fired_total` | Counter | Total shots fired |
| `haki_usage_total{type=...}` | Counter | Haki activations by type |

Plus all auto-instrumented metrics:
- `http.server.request.duration` (histogram)
- `jvm.memory.used`, `jvm.memory.committed`, `jvm.memory.max`
- `jvm.gc.duration`
- `jvm.threads.live`, `jvm.threads.daemon`, `jvm.threads.peak`
- `db.client.connections.usage` (HikariCP)
- `db.client.connections.pending_requests`

### ⚠️ Metric Name Differences

OTel agent uses **dot-notation** metric names by default (OpenTelemetry convention), while Micrometer locally uses underscores. In Grafana Cloud you may see:

| Local (Prometheus) | Grafana Cloud (OTel) |
|---|---|
| `http_server_requests_seconds_bucket` | `http_server_request_duration_seconds_bucket` |
| `jvm_memory_used_bytes` | `jvm_memory_used_bytes` (same) |
| `hikaricp_connections_active` | `db_client_connections_usage{state="active"}` |

If queries return "No data" in Grafana Cloud, check Explore → Metrics browser to see actual metric names, then adjust the dashboard queries accordingly.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| No data after 5 min | Check Render logs for OTel errors. Verify API key has correct permissions. |
| Metrics appear but traces don't | Ensure `OTEL_TRACES_EXPORTER=otlp` is set |
| Wrong metric names | Use Grafana Explore → Metrics browser to discover actual names |
| High cardinality warning | Add `OTEL_INSTRUMENTATION_HTTP_SERVER_CAPTURE_REQUEST_PARAMETERS=false` |
| Agent slowing app startup | Add `OTEL_JAVAAGENT_STARTUP_DELAY=5000` to delay init |
