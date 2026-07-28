# k6 Load Test Suite — Full Game Flow Simulation

## Objective

Create a production-quality k6 load test suite in `loadtest/` that simulates 100 concurrent users (50 paired games) through the full Last Island game lifecycle with realistic think-times, varied behavior patterns, Prometheus metrics export, and configurable stages.

## Files to touch

- create `loadtest/config.js` — shared configuration (base URL, stages, thresholds, think-times)
- create `loadtest/helpers/auth.js` — register/login helpers with cookie extraction
- create `loadtest/helpers/http.js` — authenticated HTTP wrapper (attaches cookies to all requests)
- create `loadtest/helpers/ships.js` — ship placement generator (3 valid placements, random selection)
- create `loadtest/helpers/delays.js` — think-time utilities (randomized sleep between actions)
- create `loadtest/helpers/shots.js` — shot coordinate generator (shuffled 10×10 grid, no duplicates)
- create `loadtest/scenarios/smoke.js` — smoke test: 2 VUs (1 game) end-to-end, fast validation
- create `loadtest/scenarios/stress.js` — stress test: ramp 10→100 VUs, full game flow with pairing
- create `loadtest/scenarios/game-flow.js` — shared game flow logic used by both smoke and stress
- create `loadtest/README.md` — documentation: setup, run, configure, interpret results
- modify `Makefile` — add `loadtest` and `loadtest-smoke` targets
- modify `observability/prometheus/prometheus.yml` — add k6 scrape job (k6 exposes :6565 with Prometheus output)

## Steps

1. **Create `loadtest/config.js`** — export base URL (`http://localhost:8081/api/v1`), stage definitions (smoke: 2 VUs × 1m; stress: ramp 10→50→100→50→0 VUs over 10m), k6 thresholds (`http_req_duration p(95) < 500`, `http_req_failed rate < 0.05`), think-time ranges per action type (auth: 1-2s, settings: 1-3s, matchmaking: 2-4s, placement: 3-5s, battle-turn: 1-3s, haki-decision: 2-4s), avatar list, haki usage probability (30%).

2. **Create `loadtest/helpers/http.js`** — export `authenticatedClient(cookies)` function that wraps k6 `http` calls to include `Cookie: access_token=<jwt>` header on every request. Parse `Set-Cookie` headers from auth responses using regex to extract `access_token` value. Export `extractCookies(response)` utility. All requests set `Content-Type: application/json`.

3. **Create `loadtest/helpers/auth.js`** — export `registerUser(vuId)` that POSTs to `/auth/register` with unique email/name based on VU id + iteration + timestamp (e.g., `k6_vu${vuId}_${Date.now()}@test.com`), random avatar from config. Returns `{cookies, userName}`. Export `loginUser(email, password)` for re-login scenarios. Validate 200/201 response with k6 `check()`.

4. **Create `loadtest/helpers/ships.js`** — export `getRandomPlacement()` that returns one of 3+ hardcoded valid placement arrays (A, B, C from research). Add 2 more scattered placements for variety (D, E). Each returns the full `PlaceShipsRequest` body object. Export `SHIP_SIZES` map for reference.

5. **Create `loadtest/helpers/shots.js`** — export `createShotQueue()` that generates a shuffled array of all 100 cells `[{row,col}]` (Fisher-Yates shuffle). The battle loop pops from this queue, guaranteeing no duplicate shots. Export `shuffleArray(arr)` utility.

6. **Create `loadtest/helpers/delays.js`** — export named sleep functions: `thinkAfterAuth()` (1-2s), `thinkAfterSettings()` (1-3s), `thinkMatchmaking()` (2-4s), `thinkPlacement()` (3-5s), `thinkBattleTurn()` (1-3s), `thinkHakiDecision()` (2-4s). Each uses `sleep(Math.random() * (max - min) + min)`. Export `pollDelay()` (0.5-1s) for polling loops.

7. **Create `loadtest/scenarios/game-flow.js`** — the core game flow function exported as `runGameAsCreator(vuId)` and `runGameAsJoiner(vuId, gameToken)`. This is the main shared logic:
   - **Auth phase**: Register unique user, extract cookies.
   - **Settings phase**: PUT avatar update (random avatar), think-time.
   - **Pairing phase** (Creator): POST `/games` → extract `token`. Poll `GET /games/{token}` every 1s until phase=PLACING_SHIPS (opponent joined) or timeout 60s.
   - **Pairing phase** (Joiner): Poll `GET /games` listing until a WAITING_OPPONENT game appears, then POST `/games/{token}` to join.
   - **SSE**: Note — k6 does NOT natively support SSE/WebSocket event-stream parsing for `text/event-stream`. Instead of SSE, use polling via `GET /games/{token}` to check game state transitions. Document this limitation in README.
   - **Placement phase**: POST `/games/{token}/place-ships` with random valid placement. Poll game state until phase=IN_PROGRESS (both placed).
   - **Battle phase**: Loop:
     - GET `/games/{token}` to check `currentTurnPlayerName`.
     - If my turn: optionally use observation haki (30% chance, if not used this game yet), then POST `/games/{token}/shots` with next shot from queue.
     - If not my turn: poll every 1-2s until it becomes my turn or game is over.
     - Handle ShotResponse: if `gameOver: true`, break. If `result` is HIT/SUNK and still my turn, shoot again immediately (with small think-time 0.5-1s).
     - Track shot count, handle 409s gracefully (turn expired / not your turn → re-poll state).
   - **Haki usage**: Before first shot each game, 30% of users call `POST /games/{token}/haki/observation` with `{row: random(0-8), col: random(0-8)}` (Level 1 bounds). Handle 400/409 gracefully (already used, not your turn).
   - **Cleanup**: Log game result (win/loss/error).

8. **Create `loadtest/scenarios/smoke.js`** — k6 script with `export const options` using smoke config (2 VUs, 1 iteration each). Uses `setup()` to register 2 users. The `default` function has VU 0 as creator and VU 1 as joiner using a shared game token via k6 `SharedArray` or `__VU` parity. Actually, for k6's execution model: use `per-vu-iterations` executor with 2 VUs and 1 iteration each. VU 1 (odd) creates game, VU 2 (even) lists and joins. Both proceed through full flow.

9. **Create `loadtest/scenarios/stress.js`** — k6 script with `export const options` using ramping-vus executor (stages from config). Pairing strategy: VUs with odd `__VU` are creators, even `__VU` are joiners. Creators POST `/games` and the game appears in listing for joiners to pick up. Joiners poll `GET /games` to find available games and join first available. This naturally pairs VUs without shared state. Thresholds from config. Prometheus remote write output configured via `K6_PROMETHEUS_RW_SERVER_URL` env var (points to `http://localhost:9090/api/v1/write`). Actually, k6 uses `--out experimental-prometheus-rw` flag pointing to Prometheus remote write endpoint. Since Prometheus default doesn't accept remote write, use k6's built-in Prometheus output with `K6_PROMETHEUS_RW_SERVER_URL`. Alternative: use k6's `handleSummary` to export JSON, or use `--out json=results.json`. For simplicity and reliability, use k6 Prometheus remote write to a dedicated endpoint. Update: Prometheus needs `--web.enable-remote-write-receiver` flag. Add this to docker-compose.

10. **Modify `observability/prometheus/prometheus.yml`** — no changes needed for remote write (that's a Prometheus server flag, not scrape config). The k6 metrics will be pushed via remote write.

11. **Modify `docker-compose.observability.yml`** — add `--web.enable-remote-write-receiver` to Prometheus command to accept k6 remote write pushes.

12. **Create `loadtest/README.md`** — document:
    - Prerequisites (k6 installed, `make up` + `make service-run` running)
    - Quick start: `make loadtest-smoke` (2 VUs, 1 game, validates flow)
    - Full stress: `make loadtest` (100 VUs, 50 concurrent games, 10 min)
    - Configuration: env vars for base URL, stages override
    - Architecture: file layout, helper modules, pairing strategy
    - Interpreting results: key metrics (http_req_duration, iteration_duration, checks), thresholds, expected 409 errors
    - Prometheus integration: how k6 pushes metrics, view in Grafana at :3001
    - Limitations: no real SSE (uses polling), haki only observation Level 1
    - Troubleshooting: common issues (service not running, DB full, pool exhaustion)

13. **Modify `Makefile`** — add two targets:
    ```
    loadtest-smoke: ## Run k6 smoke test (2 VUs, 1 game, quick validation)
        k6 run loadtest/scenarios/smoke.js

    loadtest: ## Run k6 stress test (100 VUs, 50 games, Prometheus export)
        k6 run --out experimental-prometheus-rw loadtest/scenarios/stress.js
    ```
    Set env var `K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write` in the stress target.

14. **Verification** — run smoke test to validate end-to-end flow works, check no file syntax errors via `k6 inspect`.

## Verification

```bash
# 1. Confirm all files exist
ls loadtest/config.js loadtest/helpers/auth.js loadtest/helpers/http.js \
   loadtest/helpers/ships.js loadtest/helpers/delays.js loadtest/helpers/shots.js \
   loadtest/scenarios/smoke.js loadtest/scenarios/stress.js \
   loadtest/scenarios/game-flow.js loadtest/README.md

# 2. Validate k6 scripts parse without error
k6 inspect loadtest/scenarios/smoke.js
k6 inspect loadtest/scenarios/stress.js

# 3. Confirm Makefile targets exist
grep -q "^loadtest:" Makefile
grep -q "^loadtest-smoke:" Makefile

# 4. Confirm Prometheus remote write receiver flag
grep -q "enable-remote-write-receiver" docker-compose.observability.yml

# 5. Run smoke test (requires make up + make service-run to be active)
# k6 run loadtest/scenarios/smoke.js
# Expected: 2 VUs complete 1 full game, all checks pass, 0 threshold violations

# 6. Verify k6 thresholds are defined
grep -q "http_req_duration" loadtest/config.js
grep -q "http_req_failed" loadtest/config.js

# 7. Verify think-times are randomized
grep -q "Math.random" loadtest/helpers/delays.js

# 8. Verify ship placements are valid (at least 3 variants)
grep -c "THOUSAND_SUNNY" loadtest/helpers/ships.js  # expect >= 3

# 9. Verify pairing strategy (odd/even VU split)
grep -q "__VU" loadtest/scenarios/stress.js

# 10. Verify README exists and documents key sections
grep -q "Prerequisites" loadtest/README.md
grep -q "make loadtest" loadtest/README.md
```

## Rollback

```bash
# Remove all created files
rm -rf loadtest/

# Revert Makefile changes
git checkout -- Makefile

# Revert observability changes
git checkout -- docker-compose.observability.yml
```
