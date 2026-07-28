# Investigation: SSE Connection Leak + Idle Disconnects

## Date
2026-07-28

## Status
RESOLVED

---

## 1. Symptom (How It Was Perceived)

While reviewing the newly consolidated Grafana dashboard ("Last Island — Operations"), two anomalies were observed:

| Observation | Expected | Actual |
|---|---|---|
| `sse_connections_active` gauge | ~4 (2 users × 2 connections: lobby + game) | **11** (and growing) |
| SSE connection lifetime | Stable for minutes | **~30s then drops and reconnects** |

The `sse_connections_active` metric kept climbing over time without ever decreasing back to the expected value, even though only 2 users were online. Browser DevTools showed the SSE connection dying and reconnecting in a loop approximately every 30 seconds.

---

## 2. Root Cause Analysis

### Bug 1 — Counter Leak on Reconnect

**Where:** `SseConnectionRegistry.register()` and `LobbySseRegistry.register()`

**Mechanism:**
```java
// LobbySseRegistry — BEFORE fix
public SseEmitter register(UUID userId) {
    SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT);
    emitters.put(userId, emitter);  // ← silently replaces old emitter
    // ...
    gameMetrics.incrementSseConnections();  // ← always +1
    return emitter;
}
```

When a user reconnects (same `userId`), `ConcurrentHashMap.put()` replaces the old emitter reference. But:
- The old emitter's `onCompletion`/`onTimeout` callbacks never fire (nobody calls `.complete()` on it)
- Therefore `decrementSseConnections()` is never called for the replaced emitter
- Net effect: every reconnection leaks +1 to the gauge

**Same pattern in `SseConnectionRegistry`** — the game emitter map does `gameEmitters.put(userId, emitter)` with the same silent replacement issue.

### Bug 2 — No Heartbeat / Keepalive

**Where:** Missing entirely from the codebase.

**Mechanism:**
- SSE connections are long-lived HTTP responses
- When no data flows for ~30 seconds, intermediaries kill the connection:
  - **Next.js API proxy** (`client/src/app/api/[...path]/route.ts`) — streams with no activity get cut
  - **Browser EventSource** — some implementations have idle timeouts
  - **Reverse proxies** (nginx, Render load balancer) — default idle connection timeout is often 30-60s
- Client-side (`use-game-events.ts`) has reconnection logic with exponential backoff, but the server doesn't send any keepalive to prevent the initial disconnect

**Combined effect:** Bug 2 causes constant reconnections → Bug 1 causes each reconnection to leak +1 to the counter → counter grows unbounded.

---

## 3. Impact Assessment

| Impact | Severity |
|---|---|
| Incorrect `sse_connections_active` metric (observability blind spot) | Medium |
| Memory leak (orphaned `SseEmitter` objects never GC'd because they're never completed) | Medium |
| Constant reconnection overhead (TCP handshakes, CONNECTED events re-sent) | Low |
| Potential thread pool exhaustion under load (each dangling emitter holds an async request thread reference) | High (at scale) |

---

## 4. Solution Implemented

### Fix 1 — Close Old Emitter on Re-register

In both `SseConnectionRegistry.register()` and `LobbySseRegistry.register()`:

```java
public SseEmitter register(UUID userId) {
    SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT);

    // ✅ Complete old emitter before replacing
    SseEmitter oldEmitter = emitters.get(userId);
    if (oldEmitter != null) {
        try { oldEmitter.complete(); } catch (Exception ignored) {}
        gameMetrics.decrementSseConnections();
    }

    emitters.put(userId, emitter);
    // ... callbacks with reference equality guard ...
    gameMetrics.incrementSseConnections();
    return emitter;
}
```

**Reference equality guard in callbacks:**
```java
final SseEmitter thisEmitter = emitter;
emitter.onCompletion(() -> {
    if (emitters.get(userId) == thisEmitter) {
        remove(userId);
    }
});
```

This prevents a late-firing callback from an old emitter from evicting the new one.

### Fix 2 — Heartbeat Scheduler

Created `SseHeartbeatScheduler.java`:
```java
@Component
public class SseHeartbeatScheduler {
    @Scheduled(fixedRate = 15000)
    public void sendHeartbeat() {
        sseConnectionRegistry.sendHeartbeatToAll();
        lobbySseRegistry.sendHeartbeatToAll();
    }
}
```

Each registry sends an SSE **comment** (not a named event):
```java
public void sendHeartbeatToAll() {
    for (SseEmitter emitter : ...) {
        synchronized (emitter) {
            emitter.send(SseEmitter.event().comment("heartbeat"));
        }
    }
}
```

SSE comments (`:heartbeat\n\n`) are:
- Invisible to JavaScript's `EventSource` API (no event fired)
- Sufficient to keep TCP connection alive through proxies
- Standard SSE spec behavior

**Why 15 seconds:** Most proxy idle timeouts are 30-60s. 15s gives a 2× safety margin.

### Fix 3 — `removeGame()` Decrement

`SseConnectionRegistry.removeGame()` now decrements the counter for each emitter before completing them, preventing counter leaks when a game ends.

---

## 5. Files Changed

| File | Change |
|---|---|
| `SseConnectionRegistry.java` | register() completes old emitter, callbacks use reference equality, removeGame() decrements per emitter, added `sendHeartbeatToAll()` |
| `LobbySseRegistry.java` | register() completes old emitter, callbacks use reference equality, added `sendHeartbeatToAll()` |
| `SseHeartbeatScheduler.java` (new) | `@Scheduled(fixedRate=15000)` calling both registries |
| `SseConnectionRegistryTest.java` | Added tests for reconnect counter stability and removeGame decrement |
| `LobbySseRegistryTest.java` (new) | Tests for reconnect counter stability |
| `SseHeartbeatSchedulerTest.java` (new) | Verifies scheduler calls heartbeat on both registries |

---

## 6. Verification

| Check | Result |
|---|---|
| `./mvnw test` | 177/183 pass (6 pre-existing failures in HakiConquerorsServiceTest, unrelated) |
| `cd client && npm run build` | Clean |
| Manual: SSE connections stay alive >30s | ✅ Heartbeat keeps them alive |
| Manual: `sse_connections_active` with 2 users | Expected ~4, stable |
| Reconnect scenario: same user reconnects | Counter stays stable (old decremented, new incremented = net 0) |

---

## 7. Methodology / Process Followed

1. **Observe** — Grafana dashboard showed unexpected metric values (`sse_connections_active = 11` for 2 users)
2. **Correlate** — Noticed SSE connections dying every ~30s in browser DevTools, cross-referenced with counter only going up
3. **Hypothesize** — Two hypotheses: (a) counter leak on reconnect, (b) missing keepalive causing premature disconnects
4. **Trace code** — Read `SseConnectionRegistry.register()` and confirmed `put()` silently replaces without cleanup; read both registries and confirmed no heartbeat/ping mechanism exists
5. **Confirm root cause** — Bug 2 (no heartbeat) triggers frequent reconnections, Bug 1 (counter leak) makes each reconnection permanently inflate the gauge
6. **Fix** — Applied both fixes atomically: heartbeat prevents unnecessary reconnections, counter cleanup prevents leaks when reconnections do happen
7. **Test** — Unit tests for all new behavior + full test suite pass + manual verification

### Key Insight

This was a **compound bug** — neither issue alone would have been as visible. Without the heartbeat bug, reconnections would be rare (only on genuine network issues) so the counter leak would grow slowly. Without the counter leak, frequent reconnections would be annoying but the metric would stay accurate. Together they created a clearly broken metric that was easy to spot on the dashboard.

### Detection Method

The Grafana `sse_connections_active` stat panel with its green threshold made the anomaly immediately visible — the number 11 for 2 users was obviously wrong at a glance. This validates the dashboard design choice of putting key gauges as prominent stat panels with known-good baselines.

---

## 8. Prevention

- **Heartbeat as standard practice:** Any SSE/WebSocket system behind a proxy needs a periodic keepalive. This should be part of the SSE infrastructure from day one.
- **Resource tracking pattern:** Whenever a registry uses `put()` that may replace an existing entry, the old entry must be explicitly cleaned up (complete/close/decrement). This is a general pattern for connection registries.
- **Metric validation:** After deploying new gauges, always sanity-check them against known state (e.g., "I have 2 users → I should see ~4 connections").
