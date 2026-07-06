# REQ-8: SSE Real-Time Communication

## Objective

Add Server-Sent Events (SSE) push to Last Island so players receive game events (opponent joined, ships placed, shot received, game over) in real-time without polling, while keeping REST for commands.

## Files to touch

- **create** `src/main/java/com/last_island/api/infrastructure/sse/SseConnectionRegistry.java`
- **create** `src/main/java/com/last_island/api/infrastructure/sse/GameEventEmitter.java`
- **create** `src/main/java/com/last_island/api/infrastructure/sse/GameEvent.java`
- **create** `src/test/java/com/last_island/api/infrastructure/sse/SseConnectionRegistryTest.java`
- **modify** `src/main/java/com/last_island/api/infrastructure/security/filter/JwtAuthenticationFilter.java`
- **modify** `src/main/java/com/last_island/api/domain/game/controller/GameController.java`
- **modify** `src/main/java/com/last_island/api/domain/board/service/BoardService.java`
- **modify** `src/main/java/com/last_island/api/domain/game/service/GameService.java`
- **modify** `src/main/resources/application.properties`

## Steps

### 1. Create `GameEvent.java` — event payload record

Path: `src/main/java/com/last_island/api/infrastructure/sse/GameEvent.java`

```java
package com.last_island.api.infrastructure.sse;

import java.time.Instant;
import java.util.Map;

public record GameEvent(
    long id,
    String type,
    Map<String, Object> data
) {
    public static GameEvent of(long id, String type, Map<String, Object> data) {
        return new GameEvent(id, type, data);
    }

    public static GameEvent of(long id, String type) {
        return new GameEvent(id, type, Map.of());
    }
}
```

Event types (String constants): `CONNECTED`, `OPPONENT_JOINED`, `SHIPS_PLACED`, `SHOT_RECEIVED`, `GAME_OVER`.

### 2. Create `SseConnectionRegistry.java` — emitter storage + event buffer

Path: `src/main/java/com/last_island/api/infrastructure/sse/SseConnectionRegistry.java`

Responsibilities:
- `ConcurrentHashMap<String, Map<UUID, SseEmitter>>` keyed by game token → player UUID → emitter.
- `ConcurrentHashMap<String, List<GameEvent>>` keyed by game token → buffered events (max 50 per game).
- `AtomicLong` per game for monotonic event IDs.
- `register(String gameToken, UUID userId, SseEmitter emitter)` — stores emitter, sets onCompletion/onTimeout/onError callbacks to auto-remove. Sends CONNECTED event immediately.
- `send(String gameToken, UUID targetUserId, GameEvent event)` — sends to specific player, buffers event.
- `sendToGame(String gameToken, GameEvent event)` — sends to all connected players in a game, buffers event.
- `sendToGameExcluding(String gameToken, UUID excludeUserId, GameEvent event)` — sends to other player.
- `remove(String gameToken, UUID userId)` — removes emitter.
- `removeGame(String gameToken)` — removes all emitters + buffer for a game.
- `replayEvents(String gameToken, UUID userId, long lastEventId)` — replays buffered events after lastEventId.
- Emitter timeout: 5 minutes (300_000 ms), set on SseEmitter constructor.
- Thread safety: synchronize on emitter instance when calling send().

### 3. Create `GameEventEmitter.java` — high-level event emission service

Path: `src/main/java/com/last_island/api/infrastructure/sse/GameEventEmitter.java`

Responsibilities:
- `@Service` with constructor-injected `SseConnectionRegistry`.
- Methods that build typed `GameEvent` and delegate to registry:
  - `emitOpponentJoined(String gameToken, UUID bluePlayerId, String joinerName)` — sends to blue player.
  - `emitShipsPlaced(String gameToken, UUID opponentId)` — sends to opponent (your opponent placed ships). When both placed, sends to both players.
  - `emitShotReceived(String gameToken, UUID targetPlayerId, int row, int col, String result, String sunkShipType, boolean isMyTurn)` — sends to opponent who got shot at.
  - `emitGameOver(String gameToken, String winnerName)` — sends to both players.
- Uses `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` for event handling. Publish Spring ApplicationEvents from services, listen here.
  - Alternative approach (simpler, chosen): Emit directly in service methods but wrap in `TransactionSynchronizationManager.registerSynchronization(afterCommit)`. This avoids creating extra event classes.
  - **Decision: Use TransactionSynchronizationManager.registerSynchronization** in services to emit after commit. GameEventEmitter methods are called inside the afterCommit callback.

### 4. Modify `JwtAuthenticationFilter.java` — query param fallback

Add before the early return at line 31-34: if `Authorization` header is absent AND request path contains `/events`, check for `token` query parameter. Extract JWT from `request.getParameter("token")` and proceed with validation.

```java
// After existing header check, before filterChain.doFilter early return:
if (authHeader == null || !authHeader.startsWith("Bearer ")) {
    String queryToken = request.getParameter("token");
    if (queryToken != null && request.getRequestURI().contains("/events")) {
        token = queryToken;
        // proceed to validation below
    } else {
        filterChain.doFilter(request, response);
        return;
    }
} else {
    token = authHeader.substring(7);
}
```

Restructure the method to use a single `token` variable resolved from either source.

### 5. Modify `GameController.java` — SSE subscribe endpoint

Add endpoint:
```java
@GetMapping(value = "/{token}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter subscribe(@PathVariable String token,
                            @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId,
                            @AuthenticationPrincipal AuthenticatedUser principal) {
    // 1. Validate game exists and user is participant (delegate to GameService)
    // 2. Create SseEmitter with 300_000 ms timeout
    // 3. Register in SseConnectionRegistry
    // 4. If lastEventId != null, replay buffered events
    // 5. Return emitter
}
```

Import `SseEmitter`, `MediaType`, inject `SseConnectionRegistry`.

### 6. Modify `BoardService.java` — emit SSE events after commit

Inject `GameEventEmitter` via constructor.

In `placeShips()` (after line 112, inside the if-block where phase transitions to IN_PROGRESS, AND after save):
```java
TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
    @Override
    public void afterCommit() {
        gameEventEmitter.emitShipsPlaced(token, opponentBoard.getOwner().getId());
    }
});
```

Actually, emit to BOTH players when game starts. If only one player placed (opponent hasn't yet), emit to opponent that this player placed.

In `fireShot()`:
- After win condition (line ~188, before return): emit GAME_OVER to both.
- After turn switch (line ~193, before return): emit SHOT_RECEIVED to opponent.

Both wrapped in `TransactionSynchronizationManager.registerSynchronization(afterCommit)`.

### 7. Modify `GameService.java` — emit OPPONENT_JOINED after commit

Inject `GameEventEmitter` via constructor.

In `joinGame()` (after `gameRepository.save(game)`, before return):
```java
TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
    @Override
    public void afterCommit() {
        gameEventEmitter.emitOpponentJoined(token, game.getBlueBoard().getOwner().getId(), joiner.getName());
    }
});
```

### 8. Modify `application.properties`

Append:
```properties
# SSE async timeout (5 minutes)
spring.mvc.async.request-timeout=300000
```

### 9. Create `SseConnectionRegistryTest.java` — unit tests

Path: `src/test/java/com/last_island/api/infrastructure/sse/SseConnectionRegistryTest.java`

Tests (using @ExtendWith(MockitoExtension.class) + real SseEmitter instances):
1. `register_storesEmitter` — register, verify emitter returned from internal state.
2. `send_deliversEventToRegisteredUser` — register emitter, send event, verify no exception.
3. `send_skipsUnregisteredUser` — send to unknown user, no exception thrown.
4. `sendToGame_deliversToAllPlayers` — register 2 emitters, sendToGame, verify both receive.
5. `sendToGameExcluding_skipsExcludedUser` — register 2 emitters, sendToGameExcluding, only one receives.
6. `remove_cleansUpEmitter` — register then remove, subsequent send does nothing.
7. `removeGame_cleansUpAllEmitters` — register 2 emitters, removeGame, registry empty.
8. `replayEvents_sendsBufferedEventsAfterId` — buffer 3 events, replay from id=1, emitter receives events 2 and 3.
9. `onTimeout_removesEmitter` — simulate timeout callback, emitter removed from registry.
10. `buffer_limitsSize` — buffer 60 events, verify only last 50 retained.

Use `SseEmitter` directly (not mocked) — call `complete()` to simulate lifecycle. For send verification, use a spy/wrapper or capture via emitter event handler if feasible. Alternative: verify registry state (emitter presence/absence) and that no exceptions are thrown on send.

## Verification

```bash
# 1. Compilation
./mvnw compile -q

# 2. All tests pass (34 existing + new SSE tests)
./mvnw test

# 3. SseEmitter usage exists
grep -r "SseEmitter" src/main/java/

# 4. Post-commit event emission pattern
grep -r "TransactionSynchronizationManager" src/main/java/

# 5. Last-Event-ID reconnection support
grep -r "Last-Event-ID" src/main/java/

# 6. JWT query param fallback
grep -r "getParameter" src/main/java/com/last_island/api/infrastructure/security/filter/

# 7. SSE registry tests pass individually
./mvnw test -Dtest=SseConnectionRegistryTest

# 8. Event types defined
grep -rn "OPPONENT_JOINED\|SHIPS_PLACED\|SHOT_RECEIVED\|GAME_OVER\|CONNECTED" src/main/java/com/last_island/api/infrastructure/sse/

# 9. Async timeout configured
grep "async.request-timeout" src/main/resources/application.properties
```

## Rollback

```bash
git checkout HEAD -- src/main/java/com/last_island/api/infrastructure/security/filter/JwtAuthenticationFilter.java
git checkout HEAD -- src/main/java/com/last_island/api/domain/game/controller/GameController.java
git checkout HEAD -- src/main/java/com/last_island/api/domain/board/service/BoardService.java
git checkout HEAD -- src/main/java/com/last_island/api/domain/game/service/GameService.java
git checkout HEAD -- src/main/resources/application.properties
rm -rf src/main/java/com/last_island/api/infrastructure/sse/
rm -f src/test/java/com/last_island/api/infrastructure/sse/SseConnectionRegistryTest.java
```
