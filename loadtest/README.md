# Last Island — k6 Load Test Suite

Load tests simulating concurrent users through the full Last Island game lifecycle: register → settings → matchmaking → ship placement → battle (with haki).

## Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) installed locally
- Backend running: `make up` + `make service-run`
- (Optional) Observability stack: `make up-obs` for Prometheus/Grafana metrics

## Quick Start

### Smoke Test (2 VUs, 1 game, validates flow)

```bash
make loadtest-smoke
```

Runs 2 virtual users (1 creator + 1 joiner) through a single full game. Use this for CI validation or post-deploy sanity checks. Expected duration: ~2 minutes.

### Stress Test (100 VUs, 50 concurrent games, 10 minutes)

```bash
make loadtest
```

Ramps from 10 to 100 virtual users over 10 minutes with Prometheus remote write export. Each pair of VUs plays a complete game.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:8081/api/v1` | API base URL |
| `K6_PROMETHEUS_RW_SERVER_URL` | `http://localhost:9090/api/v1/write` | Prometheus remote write endpoint |

### Example: Custom base URL

```bash
k6 run -e BASE_URL=http://staging.example.com/api/v1 loadtest/scenarios/smoke.js
```

## Architecture

```
loadtest/
├── config.js               # Shared config (URL, stages, thresholds, think-times)
├── README.md               # This file
├── helpers/
│   ├── auth.js             # Register/login with cookie extraction
│   ├── http.js             # Authenticated HTTP wrapper (attaches JWT cookie)
│   ├── ships.js            # 5 valid ship placement variants
│   ├── shots.js            # Shuffled 10×10 shot queue (no duplicates)
│   └── delays.js           # Randomized think-time functions
└── scenarios/
    ├── game-flow.js        # Core game flow (creator + joiner logic)
    ├── smoke.js            # Smoke test entry point (2 VUs)
    └── stress.js           # Stress test entry point (ramping VUs)
```

### Pairing Strategy

- **Odd VUs** (`__VU % 2 === 1`) are **creators**: they POST `/games` to create a match and wait for an opponent.
- **Even VUs** (`__VU % 2 === 0`) are **joiners**: they poll `GET /games` listing and join the first available `WAITING_OPPONENT` game.

This naturally pairs VUs without shared state and handles the ramping VU model.

### Game Flow

1. **Auth**: Register a unique user (email based on VU id + timestamp)
2. **Settings**: Update avatar (random selection)
3. **Matchmaking**: Creator creates game; Joiner finds and joins
4. **Placement**: POST ship placement (randomly selected from 5 valid variants)
5. **Battle**: Alternate shots until `gameOver: true`
   - 30% of users use Observation Haki before their first shot
   - HIT/SUNK results → continue shooting (same turn)
   - MISS → turn passes to opponent (poll until next turn)
6. **Completion**: Log result

## Think Times

Realistic delays between actions to simulate human behavior:

| Action | Delay Range |
|--------|-------------|
| After auth | 1-2s |
| After settings | 1-3s |
| Matchmaking wait | 2-4s |
| Before placement | 3-5s |
| Between battle turns | 1-3s |
| Haki decision | 2-4s |
| Polling interval | 0.5-1s |
| Consecutive shots | 0.5-1s |

## Interpreting Results

### Key Metrics

- **http_req_duration** (p95 < 500ms): API response time
- **http_req_failed** (rate < 5%): Request failure rate
- **checks** (rate > 95%): Assertion pass rate
- **iteration_duration**: Full game flow time per VU

### Expected Behavior

- Some 409 errors are **normal** (turn timing, race conditions in joining games)
- Joiner VUs may retry multiple games before successfully joining one
- Games typically complete in 30-90 seconds depending on shot patterns

### Thresholds

Tests fail if:
- p95 response time exceeds 500ms
- More than 5% of requests fail
- Less than 95% of checks pass

## Prometheus Integration

The stress test exports metrics to Prometheus via remote write:

```bash
# Prometheus must have remote write receiver enabled
# (handled by docker-compose.observability.yml --web.enable-remote-write-receiver flag)

K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
  k6 run --out experimental-prometheus-rw loadtest/scenarios/stress.js
```

Metrics available in Grafana at http://localhost:3001:
- `k6_http_req_duration` — request latency histogram
- `k6_http_reqs` — request count
- `k6_iterations` — completed game flows
- `k6_checks` — assertion results
- `k6_vus` — active virtual users

## Limitations

- **No real SSE**: k6 does not natively support `text/event-stream` parsing. Game state transitions are detected via polling `GET /games/{token}`. This adds slight latency vs. real SSE-driven clients.
- **Haki**: Only Observation Haki (Level 1) is tested. Armament and Conqueror's Haki are not exercised.
- **Single node**: Tests target a single backend instance. For distributed testing, use k6 Cloud or multiple k6 runners.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| All requests 502/503 | Service not running | `make service-run` |
| Register returns 500 | Database full or connection pool exhausted | Restart DB: `make down && make up` |
| Games never pair | Odd/even VU count imbalance | Ensure even number of VUs |
| Timeout waiting for opponent | VU ramp is too slow | Reduce `PAIRING_TIMEOUT_S` or increase ramp speed |
| Placement returns 400 | Invalid ship positions | Check `helpers/ships.js` placements |
| High 409 rate on shots | Turn timing / concurrent access | Expected — gracefully handled |
