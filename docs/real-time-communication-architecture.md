# Real-Time Communication: Architectural Decision Guide for Last Island

## Current State

The game uses **pure synchronous REST** — no push mechanism exists. A client must poll `GET /games/{token}` to detect opponent actions. REQ-8 (WebSocket real-time communication) is pending.

---

## The 7 Approaches

### 1. Short Polling

```
Client: every 2s → GET /games/{token} → "anything new?" → server returns current state
```

**Mechanism**: Client uses `setInterval` to repeatedly hit an existing REST endpoint. Server responds immediately with current state regardless of changes.

**Trade-offs**:
- ✅ Zero complexity — the endpoint already exists
- ✅ Inherently stateless, trivial to scale horizontally
- ✅ Auto-resilient (each request is independent)
- ❌ Wasteful: 2 players × 1 req/2s = 60 wasted queries/min when nobody is playing
- ❌ Latency = 0 to interval (average 1s at 2s polling)
- ❌ Doesn't scale: 100 games = 100 req/s to DB even when idle

**Best for**: Prototypes, admin dashboards, very infrequent updates.
**Worst for**: Any game with real-time feel.

---

### 2. Long Polling

```
Client: GET /games/{token}/poll → server WAITS up to 30s → responds ONLY when opponent acts
Client: immediately re-connects
```

**Mechanism**: Uses Spring's `DeferredResult<T>` to hold the HTTP thread without blocking. Server only responds when an event occurs or timeout expires.

```java
// Spring controller
@GetMapping("/{token}/poll")
public DeferredResult<GameEvent> poll(@PathVariable String token,
                                      @AuthenticationPrincipal AuthenticatedUser principal) {
    DeferredResult<GameEvent> result = new DeferredResult<>(30_000L);
    eventRegistry.register(token, principal.getId(), result);
    return result;
}

// When opponent fires:
eventRegistry.resolve(token, opponentId, new TurnNotificationEvent(...));
```

**Trade-offs**:
- ✅ Near-zero latency (responds instantly when event occurs)
- ✅ No extra dependencies in Spring Boot (DeferredResult is built-in)
- ✅ Works through corporate proxies that block WebSocket
- ❌ One held connection per player — must manage lifecycle, timeouts, cleanup
- ❌ Multi-instance problem: Player B's long-poll is on server-2, but the shot hit server-1
- ❌ Small reconnection gap between responses (can miss events)
- ❌ More code complexity than SSE for the same result

**Best for**: Environments where WebSocket/SSE are blocked (corporate networks).
**Worst for**: When SSE is available — SSE does the same thing with less code and built-in reconnect.

---

### 3. Server-Sent Events (SSE) — Unidirectional Push Over HTTP

```
Client: EventSource("/games/{token}/events")  → persistent HTTP connection
Server: pushes events as text/event-stream chunks whenever something happens
```

**Mechanism**: Standard HTTP connection that stays open. Server sends events as plain text frames. Browser's `EventSource` API handles reconnection automatically.

```java
// Spring controller — NO extra dependencies needed
@GetMapping("/{token}/events")
public SseEmitter streamEvents(@PathVariable String token,
                               @AuthenticationPrincipal AuthenticatedUser principal) {
    SseEmitter emitter = new SseEmitter(300_000L); // 5 min timeout
    sseRegistry.register(token, principal.getId(), emitter);
    return emitter;
}

// When opponent fires (inside BoardService.fireShot):
sseRegistry.sendToPlayer(token, opponentId,
    SseEmitter.event()
        .name("turn-notification")
        .data(new TurnEvent("YOUR_TURN", row, col, "HIT", sunkShipType)));
```

```javascript
// Client
const events = new EventSource('/games/ABC123/events?token=jwt_here');
events.addEventListener('turn-notification', (e) => {
    const data = JSON.parse(e.data);
    showOpponentShot(data.row, data.col, data.result);
    enableMyTurn();
});
// Auto-reconnects on disconnect! Built into the spec.
```

**Trade-offs**:
- ✅ **Zero extra dependencies** — `SseEmitter` is in `spring-webmvc` already
- ✅ Auto-reconnect built into `EventSource` spec (with `Last-Event-ID`)
- ✅ Clean CQRS separation: commands via REST, events via SSE
- ✅ HTTP/2 multiplexes it on the same TCP connection as REST calls
- ✅ Easy to debug (it's just HTTP — curl it, see text stream)
- ❌ **Unidirectional** — client can't send via SSE (uses REST for that — fine for Last Island)
- ❌ Auth is tricky: `EventSource` API doesn't support custom headers → must use query param JWT or cookies
- ❌ Multi-instance problem: emitter lives on one server
- ❌ Text only (no binary) — fine for JSON events

**Best for**: Turn-based games where commands go via REST and you just need push notifications. This is the sweet spot for Last Island.
**Worst for**: Bidirectional streaming (chat with typing indicators, real-time multiplayer action games).

---

### 4. Raw WebSocket (Full-Duplex TCP)

```
Client: ws://server/ws → HTTP Upgrade → full-duplex TCP
Both sides send frames at any time
```

**Mechanism**: After HTTP upgrade handshake, both client and server can push frames. You define your own message format and routing.

**Trade-offs**:
- ✅ Lowest possible latency, bidirectional
- ✅ Binary and text frames
- ❌ **You must invent your own protocol** — message types, routing, error handling, subscriptions
- ❌ No built-in reconnect (must implement)
- ❌ No built-in auth after upgrade (session is "trusted" once connected)
- ❌ Debugging is harder (not plain HTTP)

**Best for**: Real-time action games (FPS, MOBA) where every millisecond matters and you need custom binary protocols.
**Worst for**: Last Island. It's reinventing what STOMP gives you for free. A turn-based game doesn't need raw bidirectional streaming.

---

### 5. WebSocket + STOMP (Spring's Recommended Approach)

```
Client: STOMP CONNECT to /ws → SUBSCRIBE /user/queue/game/ABC123
Server: messagingTemplate.convertAndSendToUser(userId, "/queue/game/ABC123", event)
```

**Mechanism**: STOMP is a messaging sub-protocol that runs over WebSocket. Provides pub/sub semantics with topics (broadcast) and queues (per-user). Spring has first-class support.

```java
// WebSocketConfig.java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");  // in-memory broker
        config.setUserDestinationPrefix("/user");
    }
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOrigins("*");
    }
}

// Inside BoardService.fireShot(), after resolving shot:
messagingTemplate.convertAndSendToUser(
    opponentId.toString(),
    "/queue/game/" + token,
    new TurnNotificationEvent("YOUR_TURN", row, col, result, sunkShipType)
);
```

```javascript
// Client (using @stomp/stompjs)
const client = new StompJs.Client({ brokerURL: 'ws://localhost:8080/ws' });
client.onConnect = () => {
    client.subscribe('/user/queue/game/ABC123', (msg) => {
        const event = JSON.parse(msg.body);
        handleGameEvent(event);
    });
};
client.activate();
```

**Trade-offs**:
- ✅ Spring's best-supported WebSocket pattern — rich ecosystem
- ✅ Topic routing: `/topic/game/{token}` for broadcast, `/user/queue/...` for per-player
- ✅ Built-in heartbeats, subscription tracking, session management
- ✅ Security integration (validate JWT on CONNECT frame)
- ✅ Clean upgrade path: swap `SimpleBroker` → RabbitMQ for multi-instance
- ✅ stompjs client has auto-reconnect with backoff
- ❌ Extra dependency: `spring-boot-starter-websocket`
- ❌ More infrastructure than SSE (STOMP protocol, subscription registry)
- ❌ Bidirectional capability you don't really need (Last Island only needs server→client push)
- ❌ `SimpleBroker` is single-instance only — multi-instance requires external broker

**Best for**: Multi-room game servers, chat apps, anything with pub/sub semantics over Spring.
**Worst for**: Simple notification needs where SSE suffices.

---

### 6. Message Queues (Redis Pub/Sub, RabbitMQ, Kafka)

These are **backend infrastructure**, not client-facing. They solve one problem: **how do multiple server instances share events?**

```
Server-1 (processes shot) → publishes to Redis channel "game:ABC123"
Server-2 (holds opponent's SSE/WebSocket) → subscribes to "game:ABC123" → pushes to client
```

**When you need this**: When you horizontally scale (multiple app instances behind a load balancer). Not needed for single-instance v1.

| Broker | Complexity | Best for |
|--------|-----------|----------|
| Redis Pub/Sub | Low (fire-and-forget, no persistence) | Lightweight, pairs well with game state |
| RabbitMQ | Medium (durable queues, routing) | When you want message delivery guarantees |
| Kafka | High (persistent log, replay) | Event sourcing or replay — overkill here |

---

### 7. Service Workers + Web Push API

```
Server → HTTP POST to push service (FCM/Mozilla) → Push service wakes browser → shows notification
```

**Trade-offs**:
- ✅ Works when tab is closed or phone is locked
- ✅ Zero connections held on your server
- ❌ **Latency is unpredictable** (0.5s to 30s+, dependent on push service)
- ❌ Requires notification permission from user
- ❌ Cannot replace in-session communication

**Best for**: "Hey, come back to the game — it's your turn!" when the player left 5 minutes ago.
**Worst for**: Primary real-time communication during active gameplay.

---

## Decision Matrix for Last Island

| Criteria | Short Poll | Long Poll | SSE | WS Raw | WS+STOMP | Push API |
|----------|:---------:|:---------:|:---:|:------:|:--------:|:--------:|
| Latency | ❌ ~1s avg | ✅ instant | ✅ instant | ✅ instant | ✅ instant | ❌ unpredictable |
| Complexity | ✅ zero | 🟡 moderate | ✅ low | ❌ high | 🟡 moderate | 🟡 moderate |
| Extra deps needed | ✅ none | ✅ none | ✅ none | ❌ yes | ❌ yes | ❌ yes (3rd party) |
| Bidirectional needed? | — | — | N/A | ✅ yes | ✅ yes | — |
| Does Last Island need bidir? | | | | **NO** | **NO** | |
| Auto-reconnect | ✅ inherent | 🟡 manual | ✅ built-in | ❌ manual | 🟡 library | ✅ inherent |
| Auth simplicity | ✅ JWT header | ✅ JWT header | 🟡 query param | 🟡 on upgrade | 🟡 CONNECT frame | 🟡 subscription |
| Multi-instance scaling | ✅ stateless | ❌ needs bus | ❌ needs bus | ❌ needs bus | 🟡 external broker | ✅ stateless |

---

## The Key Insight

Last Island has a **clear communication pattern**:

- **Client → Server**: discrete commands (fire shot, place ships, create game) → **REST is perfect**
- **Server → Client**: event notifications (your turn, opponent joined, game over) → **push is needed, but only one direction**

You don't need bidirectional streaming. Nobody is typing in real-time, no position updates 60 times/second. It's a turn-based game with discrete events.

This means:

| If you want... | Choose |
|----------------|--------|
| Simplest solution, zero new deps | **SSE** (`SseEmitter` is already in spring-webmvc) |
| Full Spring ecosystem, pub/sub topics, future scaling path | **WebSocket + STOMP** |
| Complement either with offline "come back" alerts | Add **Web Push** later |

---

## Event Mapping

| Game Event | What triggers it | Who receives the push |
|------------|-----------------|----------------------|
| Turn notification | Opponent fires a shot | The player whose turn it now is |
| Shot result (to opponent) | A shot resolves | The player who was shot at |
| Game join | Player B joins | Player A (the creator) |
| Ship placement complete | Both players finish placing | Both players (phase → IN_PROGRESS) |
| Game over | Last ship sunk | The losing player |

---

## Connection Lifecycle (Real-World Concerns)

| Scenario | SSE | WebSocket/STOMP |
|----------|-----|-----------------|
| Tab backgrounded (Chrome) | Connection MAY be throttled after 5min. EventSource auto-reconnects. | Connection stays alive (heartbeats keep it open). |
| Mobile network switch (WiFi→4G) | TCP breaks. EventSource auto-reconnects within retry interval. | TCP breaks. stompjs reconnects if configured. |
| Tab sleep (Chrome tab freezing) | Connection drops. Auto-reconnect on tab wake. | Connection drops. Must reconnect + resubscribe. |
| Laptop lid close/open | All connections break. All need reconnect. | Same. |

**Key insight for turn-based games**: Brief disconnections are acceptable. Game state lives in PostgreSQL. On reconnect, client calls `GET /games/{token}` to sync full state, then re-subscribes to events. No messages are permanently lost.

---

## Horizontal Scaling Solutions

Single instance (v1): SSE/WebSocket/STOMP all work fine with in-memory state.

Multiple instances (future):

| Push Approach | Scaling Solution |
|---------------|-----------------|
| SSE | Redis Pub/Sub → each server subscribes → relays to local SseEmitters |
| STOMP (SimpleBroker) | Redis Pub/Sub adapter or external STOMP broker |
| STOMP (external broker) | RabbitMQ as STOMP broker (clients connect via Spring relay) — fully solved |
| Long Polling | PostgreSQL LISTEN/NOTIFY or Redis Pub/Sub |

---

## Recommendation Summary

| Priority | Approach | Why |
|----------|----------|-----|
| 1st | **SSE + REST hybrid** | Zero extra dependencies. Perfect CQRS fit (commands via REST, events via SSE). Simpler mental model. Built-in reconnect. |
| 2nd | **WebSocket + STOMP** | Spring's recommended WS approach. Topic/queue routing maps to game rooms. Better if spectator mode or chat is added later. |
| 3rd (future) | **+ Redis Pub/Sub** | When deploying multiple instances. Lightweight event relay across servers. |
| Complementary | **Web Push** | Offline "it's your turn" notifications. Not primary channel. |
| Avoid | Short Polling (wasteful), Raw WebSocket (reinventing STOMP), Kafka (overkill) | |
